using PokéDesc.Business.Constants;
using PokéDesc.Business.Helpers;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;
using PartieStatut = PokéDesc.Domain.PartieStatut;

namespace PokéDesc.Business.Services;

public class PartieService : IPartieService
{
    private readonly IPokemonService _pokemonService;
    private readonly IGameSessionStore _sessionStore;
    private readonly ILobbyNotifier _notifier;
    private readonly SemaphoreSlim _rematchLock = new(1, 1);
    private static readonly TimeSpan GameTtl = TimeSpan.FromHours(24);
    private readonly IReadOnlyDictionary<string, IGameModeStrategy> _strategies;

    public PartieService(IPokemonService pokemonService, IGameSessionStore sessionStore, IEnumerable<IGameModeStrategy> strategies, ILobbyNotifier notifier)
    {
        _pokemonService = pokemonService;
        _sessionStore = sessionStore;
        _notifier = notifier;
        _strategies = strategies.ToDictionary(s => s.Mode, StringComparer.OrdinalIgnoreCase);
    }

    public Task<Partie> CreateGameAsync(string dresseurId)
    {
        _sessionStore.Cleanup(GameTtl);
        var partie = new Partie
        {
            Id = Guid.NewGuid().ToString(),
            CodeSession = GenerateSessionCode(),
            Dresseur1Id = dresseurId,
            PokemonsToGuess = new List<Pokemon>(),
            Statut = PartieStatut.EnAttente
        };
        _sessionStore.Add(partie);
        return Task.FromResult(partie);
    }

    public async Task<Partie> StartGameAsync(string partieId, string mode, bool isSolo = false,
        int nbPokemons = 3, List<int>? generations = null, int timerDuration = 60)
    {
        var partie = await GetGameAsync(partieId);
        partie.ModeSolo = isSolo;
        if (!_strategies.TryGetValue(mode, out var strategy))
            throw new ArgumentException($"Mode de jeu '{mode}' inconnu.");
        await strategy.ExecuteAsync(partie, new StartGameParams(nbPokemons, generations, timerDuration));
        await _notifier.NotifyGameStarted(partie.Id);
        return partie;
    }

    public async Task<Partie> JoinGameAsync(string codeSession, string dresseurId)
    {
        var partie = _sessionStore.FindByCode(codeSession);
        if (partie == null)
            throw new KeyNotFoundException("Code de session invalide.");
        var gameLock = _sessionStore.GetOrCreateLock(partie.Id);
        await gameLock.WaitAsync();
        try
        {
            partie.Join(dresseurId);
        }
        finally
        {
            gameLock.Release();
        }
        await _notifier.NotifyLobbyUpdated(partie.Id);
        return partie;
    }

    public Task<Partie> GetGameAsync(string partieId)
        => Task.FromResult(_sessionStore.Get(partieId));

    public async Task<Partie> UseHintAsync(string partieId, string dresseurId, string hintType)
    {
        var gameLock = _sessionStore.GetOrCreateLock(partieId);
        await gameLock.WaitAsync();
        Partie partie;
        try
        {
            partie = await GetGameAsync(partieId);
            var state = partie.GetState(dresseurId == partie.Dresseur1Id);
            if (!HintConfig.Hints.ContainsKey(hintType))
                throw new ArgumentException($"Type d'indice '{hintType}' inconnu.");
            if (!state.UsedHints.Contains(hintType))
            {
                state.UsedHints.Add(hintType);
                if (HintConfig.Hints.TryGetValue(hintType, out var hintCost) && partie.TimerDurationSeconds > 0)
                {
                    double penalty = partie.TimerDurationSeconds * hintCost.TimePenaltyPct / 100.0;
                    if (state.TimeRemaining >= 0)
                        state.TimeRemaining = Math.Max(0, state.TimeRemaining - penalty);
                }
            }
        }
        finally
        {
            gameLock.Release();
        }
        await _notifier.NotifyLobbyUpdated(partieId);
        return partie;
    }

    public async Task<GuessResult> SubmitGuessAsync(string partieId, string dresseurId, string pokemonName)
    {
        var result = await SubmitGuessInternalAsync(partieId, dresseurId, pokemonName);
        await _notifier.NotifyLobbyUpdated(partieId);
        return result;
    }

    private async Task<GuessResult> SubmitGuessInternalAsync(string partieId, string dresseurId, string pokemonName)
    {
        var gameLock = _sessionStore.GetOrCreateLock(partieId);
        await gameLock.WaitAsync();
        try
        {
            var partie = await GetGameAsync(partieId);
            bool isJ1 = dresseurId == partie.Dresseur1Id;
            var state = partie.GetState(isJ1);

            if (TimerCalculator.IsTimedOut(state.TimerStart, state.TimeRemaining))
                return HandleTimeout(partie, isJ1);

            if (state.CurrentIndex >= partie.PokemonsToGuess.Count)
                return new GuessResult { IsGameFinished = true, Message = "Partie déjà terminée.", UpdatedGame = partie };

            var targetPokemon = partie.PokemonsToGuess[state.CurrentIndex];
            bool isCorrect = string.Equals(targetPokemon.NameFr, pokemonName, StringComparison.OrdinalIgnoreCase);

            var proximity = new ProximityResult();
            if (!isCorrect)
            {
                var guessedPokemon = await _pokemonService.GetPokemonByNameAsync(pokemonName);
                proximity = ProximityCalculator.Calculate(targetPokemon, guessedPokemon);
            }

            if (isCorrect)
            {
                int points = ScoringCalculator.Calculate(state.UsedHints);
                state.Score += points;
                RecordCompletedPokemon(state, targetPokemon, true, points);
                AdvanceToNextPokemon(state);
                return new GuessResult
                {
                    IsCorrect = true,
                    IsTurnFinished = true,
                    PointsEarned = points,
                    Message = $"Bravo ! C'était bien {targetPokemon.NameFr}.",
                    UpdatedGame = partie,
                    IsGameFinished = CheckIfGameFinished(partie, state),
                    HasOneTypeInCommon = true,
                    HasPerfectTypeMatch = true,
                    HasSameGeneration = true,
                    IsInSameEvolutionChain = true
                };
            }
            else
            {
                state.AttemptsUsed++;
                if (state.AttemptsUsed >= HintConfig.MaxAttempts)
                {
                    RecordCompletedPokemon(state, targetPokemon, false, 0);
                    AdvanceToNextPokemon(state);
                    var result1 = new GuessResult
                    {
                        IsCorrect = false,
                        IsTurnFinished = true,
                        PointsEarned = 0,
                        Message = $"Dommage, c'était {targetPokemon.NameFr}. Tu passes au suivant.",
                        UpdatedGame = partie,
                        IsGameFinished = CheckIfGameFinished(partie, state),
                    };
                    ApplyProximity(result1, proximity);
                    return result1;
                }
                else
                {
                    var result2 = new GuessResult
                    {
                        IsCorrect = false,
                        IsTurnFinished = false,
                        PointsEarned = 0,
                        Message = $"Mauvaise réponse. Il te reste {HintConfig.MaxAttempts - state.AttemptsUsed} essais.",
                        UpdatedGame = partie,
                    };
                    ApplyProximity(result2, proximity);
                    return result2;
                }
            }
        }
        finally
        {
            gameLock.Release();
        }
    }

    public async Task<GuessResult> NotifyTimeoutAsync(string partieId, string dresseurId)
    {
        var gameLock = _sessionStore.GetOrCreateLock(partieId);
        await gameLock.WaitAsync();
        GuessResult result;
        try
        {
            var partie = await GetGameAsync(partieId);
            bool isJ1 = dresseurId == partie.Dresseur1Id;
            result = HandleTimeout(partie, isJ1);
        }
        finally
        {
            gameLock.Release();
        }
        await _notifier.NotifyLobbyUpdated(partieId);
        return result;
    }

    public async Task<Partie> UpdateGameSettingsAsync(string partieId, int nbPokemons, List<int>? generations, int? timerDuration)
    {
        var partie = await GetGameAsync(partieId);
        if (partie.Statut == PartieStatut.EnCours)
            return partie;
        if (nbPokemons < GameConstants.MinPokemons || nbPokemons > GameConstants.MaxPokemons)
            throw new ArgumentException($"Le nombre de Pokémon doit être entre {GameConstants.MinPokemons} et {GameConstants.MaxPokemons}.");
        partie.NbPokemons = nbPokemons;
        partie.SelectedGenerations = generations ?? Enumerable.Range(1, 8).ToList();
        if (timerDuration.HasValue)
            partie.TimerDurationSeconds = timerDuration.Value;
        await _notifier.NotifyLobbyUpdated(partie.Id);
        return partie;
    }

    public async Task<RematchStatusDto> MarkRematchReadyAsync(string partieId, string dresseurId)
    {
        if (string.IsNullOrWhiteSpace(dresseurId))
            throw new ArgumentException("dresseurId est requis.", nameof(dresseurId));
        var partie = await GetGameAsync(partieId);
        partie.GetState(dresseurId == partie.Dresseur1Id).RematchReady = true;
        bool bothReady = partie.StateJ1.RematchReady && (partie.ModeSolo || partie.StateJ2.RematchReady);
        if (bothReady && string.IsNullOrEmpty(partie.RematchPartieId))
        {
            await _rematchLock.WaitAsync();
            try
            {
                if (string.IsNullOrEmpty(partie.RematchPartieId))
                {
                    var newPartie = await CreateGameAsync(partie.Dresseur1Id);
                    if (!string.IsNullOrEmpty(partie.Dresseur2Id))
                    {
                        newPartie.Dresseur2Id = partie.Dresseur2Id;
                        newPartie.Statut = PartieStatut.Pret;
                    }
                    await StartGameAsync(newPartie.Id, "Standard", partie.ModeSolo, partie.NbPokemons, partie.SelectedGenerations, partie.TimerDurationSeconds);
                    partie.RematchPartieId = newPartie.Id;
                }
            }
            finally
            {
                _rematchLock.Release();
            }
        }
        await _notifier.NotifyLobbyUpdated(partie.Id);
        return new RematchStatusDto
        {
            Player1Ready = partie.StateJ1.RematchReady,
            Player2Ready = partie.StateJ2.RematchReady || partie.ModeSolo,
            RematchPartieId = partie.RematchPartieId,
        };
    }

    // Méthodes privées

    private static void ApplyProximity(GuessResult result, ProximityResult proximity)
    {
        result.HasOneTypeInCommon = proximity.HasOneTypeInCommon;
        result.HasPerfectTypeMatch = proximity.HasPerfectTypeMatch;
        result.HasSameGeneration = proximity.HasSameGeneration;
        result.IsInSameEvolutionChain = proximity.IsInSameEvolutionChain;
    }

    private static void AdvanceToNextPokemon(PlayerGameState state)
    {
        state.CurrentIndex++;
        state.AttemptsUsed = 0;
        state.UsedHints.Clear();
    }

    private static void RecordCompletedPokemon(PlayerGameState state, Pokemon pokemon, bool wasGuessed, int pointsEarned)
    {
        state.CompletedPokemons.Add(new CompletedPokemon
        {
            PokemonId = pokemon.Id,
            PokemonName = pokemon.NameFr,
            WasGuessed = wasGuessed,
            AttemptsUsed = state.AttemptsUsed,
            HintsUsed = new List<string>(state.UsedHints),
            PointsEarned = pointsEarned
        });
    }

    private static bool CheckIfGameFinished(Partie partie, PlayerGameState state)
        => state.CurrentIndex >= partie.PokemonsToGuess.Count;

    private static GuessResult HandleTimeout(Partie partie, bool isJ1)
    {
        var state = partie.GetState(isJ1);
        if (state.CurrentIndex >= partie.PokemonsToGuess.Count)
            return new GuessResult { IsGameFinished = true, Message = "Partie déjà terminée.", UpdatedGame = partie };
        var targetPokemon = partie.PokemonsToGuess[state.CurrentIndex];
        RecordCompletedPokemon(state, targetPokemon, false, 0);
        AdvanceToNextPokemon(state);
        return new GuessResult
        {
            IsCorrect = false,
            IsTurnFinished = true,
            IsTimeout = true,
            PointsEarned = 0,
            Message = $"Temps écoulé ! C'était {targetPokemon.NameFr}.",
            UpdatedGame = partie,
            IsGameFinished = CheckIfGameFinished(partie, state)
        };
    }

    private static string GenerateSessionCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[Random.Shared.Next(chars.Length)])
            .ToArray());
    }
}