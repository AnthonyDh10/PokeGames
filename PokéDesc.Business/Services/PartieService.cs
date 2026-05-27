using System.Collections.Concurrent;
using PokéDesc.Business.Constants;
using PokéDesc.Business.Helpers;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Business.Strategies;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;
using PartieStatut = PokéDesc.Domain.PartieStatut;

namespace PokéDesc.Business.Services;

public class PartieService : IPartieService
{
    private readonly IPokemonService _pokemonService;
    // TODO: Injecter un Repository pour sauvegarder la Partie (ex: IPartieRepository)
    // Pour l'instant, on va simuler le stockage en mémoire ou supposer qu'il existe.
    private readonly ConcurrentDictionary<string, Partie> _gameStore = new();
    // Lock global pour la création de revanche (double-check pattern)
    private readonly SemaphoreSlim _rematchLock = new(1, 1);
    // Un SemaphoreSlim par partie pour protéger les mutations concurrentes (J1 + J2 simultanés)
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _gameLocks = new();

    private static readonly TimeSpan GameTtl = TimeSpan.FromHours(24);

    private static readonly IReadOnlyDictionary<string, IGameModeStrategy> _strategies =
        new IGameModeStrategy[]
        {
            new StandardModeStrategy(),
            new TypesModeStrategy(),
            new DeZoomModeStrategy(),
        }.ToDictionary(s => s.Mode, StringComparer.OrdinalIgnoreCase);

    private void CleanupOldGames()
    {
        var cutoff = DateTime.UtcNow - GameTtl;
        foreach (var key in _gameStore.Keys)
        {
            if (_gameStore.TryGetValue(key, out var p) && p.CreatedAt < cutoff)
            {
                if (_gameStore.TryRemove(key, out _))
                    _gameLocks.TryRemove(key, out _);
            }
        }
    }

    private SemaphoreSlim GetOrCreateGameLock(string partieId)
        => _gameLocks.GetOrAdd(partieId, _ => new SemaphoreSlim(1, 1));



    public PartieService(IPokemonService pokemonService)
    {
        _pokemonService = pokemonService;
    }

    public Task<Partie> CreateGameAsync(string dresseurId)
    {
        CleanupOldGames();

        var partie = new Partie
        {
            Id = Guid.NewGuid().ToString(), // Simulé, MongoDB le ferait auto
            CodeSession = GenerateSessionCode(),
            Dresseur1Id = dresseurId,
            PokemonsToGuess = new List<Pokemon>(),
            Statut = PartieStatut.EnAttente
        };

        _gameStore.TryAdd(partie.Id, partie);
        return Task.FromResult(partie);
    }

    public async Task<Partie> StartGameAsync(string partieId, string mode, bool isSolo = false,
        int nbPokemons = 3, List<int>? generations = null, int timerDuration = 60)
    {
        var partie = await GetGameAsync(partieId);

        // Marquer le mode solo dans la partie
        partie.ModeSolo = isSolo;

        if (!_strategies.TryGetValue(mode, out var strategy))
            throw new ArgumentException($"Mode de jeu '{mode}' inconnu.");

        await strategy.ExecuteAsync(partie, new StartGameParams(nbPokemons, generations, timerDuration), _pokemonService);

        return partie;
    }

    public Task<Partie> JoinGameAsync(string codeSession, string dresseurId)
    {
        // Normaliser le code de session (supprimer espaces et mettre en majuscules)
        var normalizedCode = codeSession?.Trim().ToUpper();
        
        var partie = _gameStore.Values.FirstOrDefault(p => 
            p.CodeSession?.Trim().ToUpper() == normalizedCode);
            
        if (partie == null)
            throw new KeyNotFoundException("Code de session invalide.");
        
        if (!string.IsNullOrEmpty(partie.Dresseur2Id))
            throw new ArgumentException("Cette partie a déjà deux joueurs.");
        
        partie.Dresseur2Id = dresseurId;
        partie.Statut = PartieStatut.Pret; // Les deux joueurs sont connectés, en attente de démarrage
        
        return Task.FromResult(partie);
    }

    public Task<Partie> GetGameAsync(string partieId)
    {
        if (!_gameStore.TryGetValue(partieId, out var partie))
            throw new KeyNotFoundException("Partie introuvable.");
        return Task.FromResult(partie);
    }

    public async Task<Partie> UseHintAsync(string partieId, string dresseurId, string hintType)
    {
        var gameLock = GetOrCreateGameLock(partieId);
        await gameLock.WaitAsync();
        try
        {
            var partie = await GetGameAsync(partieId);
        
            // Vérifier si c'est le tour du joueur (simplifié ici pour J1)
            bool isJ1 = dresseurId == partie.Dresseur1Id;
            var usedHints = isJ1 ? partie.UsedHintsJ1 : partie.UsedHintsJ2;

            if (!HintConfig.Hints.ContainsKey(hintType))
            {
                throw new ArgumentException($"Type d'indice '{hintType}' inconnu.");
            }

            if (!usedHints.Contains(hintType))
            {
                usedHints.Add(hintType);
            
                // Appliquer la pénalité de temps (sauf si timer infini)
                // La pénalité est un pourcentage de la durée totale du timer de la partie
                if (HintConfig.Hints.TryGetValue(hintType, out var hintCost) && partie.TimerDurationSeconds > 0)
                {
                    double timePenaltySeconds = partie.TimerDurationSeconds * hintCost.TimePenaltyPct / 100.0;
                    if (isJ1)
                    {
                        if (partie.TimeRemainingJ1 >= 0)
                        {
                            partie.TimeRemainingJ1 = Math.Max(0, partie.TimeRemainingJ1 - timePenaltySeconds);
                        }
                    }
                    else
                    {
                        if (partie.TimeRemainingJ2 >= 0)
                        {
                            partie.TimeRemainingJ2 = Math.Max(0, partie.TimeRemainingJ2 - timePenaltySeconds);
                        }
                    }
                }
            }

            return partie;
        }
        finally
        {
            gameLock.Release();
        }
    }

    public async Task<GuessResult> SubmitGuessAsync(string partieId, string dresseurId, string pokemonName)
    {
        var gameLock = GetOrCreateGameLock(partieId);
        await gameLock.WaitAsync();
        try
        {
        var partie = await GetGameAsync(partieId);
        bool isJ1 = dresseurId == partie.Dresseur1Id;
        
        bool isTimedOut = TimerCalculator.IsTimedOut(
            isJ1 ? partie.TimerStartJ1 : partie.TimerStartJ2,
            isJ1 ? partie.TimeRemainingJ1 : partie.TimeRemainingJ2);
        if (isTimedOut)
        {
            return await HandleTimeout(partie, isJ1);
        }
        
        int currentIndex = isJ1 ? partie.CurrentIndexJ1 : partie.CurrentIndexJ2;
        var pokemonsList = partie.PokemonsToGuess;
        
        if (currentIndex >= pokemonsList.Count)
        {
            return new GuessResult { IsGameFinished = true, Message = "Partie déjà terminée.", UpdatedGame = partie };
        }

        var targetPokemon = pokemonsList[currentIndex];
        bool isCorrect = string.Equals(targetPokemon.NameFr, pokemonName, StringComparison.OrdinalIgnoreCase);

        // --- LOGIQUE DE PROXIMITÉ ---
        var proximity = new ProximityResult();
        if (!isCorrect)
        {
            var guessedPokemon = await _pokemonService.GetPokemonByNameAsync(pokemonName);
            proximity = ProximityCalculator.Calculate(targetPokemon, guessedPokemon);
        }

        if (isCorrect)
        {
            int points = ScoringCalculator.Calculate(isJ1 ? partie.UsedHintsJ1 : partie.UsedHintsJ2);
            
            if (isJ1) partie.ScoreJ1 += points;
            else partie.ScoreJ2 += points;

            RecordCompletedPokemon(partie, isJ1, targetPokemon, true, points);
            AdvanceToNextPokemon(partie, isJ1);

            return new GuessResult
            {
                IsCorrect = true,
                IsTurnFinished = true,
                PointsEarned = points,
                Message = $"Bravo ! C'était bien {targetPokemon.NameFr}.",
                UpdatedGame = partie,
                IsGameFinished = CheckIfGameFinished(partie, isJ1),
                // Si c'est correct, toutes les proximités sont techniquement vraies
                HasOneTypeInCommon = true,
                HasPerfectTypeMatch = true,
                HasSameGeneration = true,
                IsInSameEvolutionChain = true
            };
        }
        else
        {
            if (isJ1) partie.AttemptsUsedJ1++;
            else partie.AttemptsUsedJ2++;

            int attemptsUsed = isJ1 ? partie.AttemptsUsedJ1 : partie.AttemptsUsedJ2;

            if (attemptsUsed >= HintConfig.MaxAttempts)
            {
                RecordCompletedPokemon(partie, isJ1, targetPokemon, false, 0);
                AdvanceToNextPokemon(partie, isJ1);
                
                return new GuessResult
                {
                    IsCorrect = false,
                    IsTurnFinished = true,
                    PointsEarned = 0,
                    Message = $"Dommage, c'était {targetPokemon.NameFr}. Tu passes au suivant.",
                    UpdatedGame = partie,
                    IsGameFinished = CheckIfGameFinished(partie, isJ1),
                    HasOneTypeInCommon = proximity.HasOneTypeInCommon,
                    HasPerfectTypeMatch = proximity.HasPerfectTypeMatch,
                    HasSameGeneration = proximity.HasSameGeneration,
                    IsInSameEvolutionChain = proximity.IsInSameEvolutionChain
                };
            }
            else
            {
                return new GuessResult
                {
                    IsCorrect = false,
                    IsTurnFinished = false,
                    PointsEarned = 0,
                    Message = $"Mauvaise réponse. Il te reste {HintConfig.MaxAttempts - attemptsUsed} essais.",
                    UpdatedGame = partie,
                    HasOneTypeInCommon = proximity.HasOneTypeInCommon,
                    HasPerfectTypeMatch = proximity.HasPerfectTypeMatch,
                    HasSameGeneration = proximity.HasSameGeneration,
                    IsInSameEvolutionChain = proximity.IsInSameEvolutionChain
                };
            }
        }
        }
        finally
        {
            gameLock.Release();
        }
    }

    private void AdvanceToNextPokemon(Partie partie, bool isJ1)
    {
        if (isJ1)
        {
            partie.CurrentIndexJ1++;
            partie.AttemptsUsedJ1 = 0;
            partie.UsedHintsJ1.Clear();
        }
        else
        {
            partie.CurrentIndexJ2++;
            partie.AttemptsUsedJ2 = 0;
            partie.UsedHintsJ2.Clear();
        }
    }

    public void ResetTimer(string partieId, string dresseurId)
    {
        if (!_gameStore.TryGetValue(partieId, out var partie))
            throw new KeyNotFoundException("Partie introuvable.");
            
        bool isJ1 = dresseurId == partie.Dresseur1Id;
        double timerDuration = partie.TimerDurationSeconds >= 0 ? partie.TimerDurationSeconds : -1;
        
        if (isJ1)
        {
            partie.TimerStartJ1 = DateTime.UtcNow;
            partie.TimeRemainingJ1 = timerDuration;
        }
        else
        {
            partie.TimerStartJ2 = DateTime.UtcNow;
            partie.TimeRemainingJ2 = timerDuration;
        }
    }

    private void RecordCompletedPokemon(Partie partie, bool isJ1, Pokemon pokemon, bool wasGuessed, int pointsEarned)
    {
        var completedPokemon = new CompletedPokemon
        {
            PokemonId = pokemon.Id,
            PokemonName = pokemon.NameFr,
            WasGuessed = wasGuessed,
            AttemptsUsed = isJ1 ? partie.AttemptsUsedJ1 : partie.AttemptsUsedJ2,
            HintsUsed = new List<string>(isJ1 ? partie.UsedHintsJ1 : partie.UsedHintsJ2),
            PointsEarned = pointsEarned
        };

        if (isJ1)
            partie.CompletedPokemonsJ1.Add(completedPokemon);
        else
            partie.CompletedPokemonsJ2.Add(completedPokemon);
    }

    private bool CheckIfGameFinished(Partie partie, bool isJ1)
    {
        int index = isJ1 ? partie.CurrentIndexJ1 : partie.CurrentIndexJ2;
        return index >= partie.PokemonsToGuess.Count;
    }

    private static string GenerateSessionCode()
    {
        const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[Random.Shared.Next(chars.Length)])
            .ToArray());
    }

    public async Task<GuessResult> NotifyTimeoutAsync(string partieId, string dresseurId)
    {
        var partie = await GetGameAsync(partieId);
        bool isJ1 = dresseurId == partie.Dresseur1Id;
        return await HandleTimeout(partie, isJ1);
    }

    private async Task<GuessResult> HandleTimeout(Partie partie, bool isJ1)
    {
        int currentIndex = isJ1 ? partie.CurrentIndexJ1 : partie.CurrentIndexJ2;
        var pokemonsList = partie.PokemonsToGuess;

        if (currentIndex >= pokemonsList.Count)
        {
            return new GuessResult { IsGameFinished = true, Message = "Partie déjà terminée.", UpdatedGame = partie };
        }

        var targetPokemon = pokemonsList[currentIndex];

        // Enregistrer le Pokémon comme raté (timeout)
        RecordCompletedPokemon(partie, isJ1, targetPokemon, false, 0);

        // NE PAS passer au Pokémon suivant automatiquement
        // Le joueur le fera manuellement avec le bouton du popup
        // Mais il faut incrémenter l'index pour que le frontend sache qu'on doit passer au suivant
        AdvanceToNextPokemon(partie, isJ1);

        return new GuessResult
        {
            IsCorrect = false,
            IsTurnFinished = true,
            IsTimeout = true,
            PointsEarned = 0,
            Message = $"Temps écoulé ! C'était {targetPokemon.NameFr}.",
            UpdatedGame = partie,
            IsGameFinished = CheckIfGameFinished(partie, isJ1)
        };
    }

    public double GetRemainingTime(string partieId, string dresseurId)
    {
        if (!_gameStore.TryGetValue(partieId, out var partie))
            throw new KeyNotFoundException("Partie introuvable.");

        bool isJ1 = dresseurId == partie.Dresseur1Id;
        return TimerCalculator.GetRemaining(
            isJ1 ? partie.TimerStartJ1 : partie.TimerStartJ2,
            isJ1 ? partie.TimeRemainingJ1 : partie.TimeRemainingJ2);
    }

    public int GetTimerDuration(string partieId)
    {
        if (!_gameStore.TryGetValue(partieId, out var partie))
            throw new KeyNotFoundException("Partie introuvable.");
        return partie.TimerDurationSeconds;
    }

    public async Task<Partie> UpdateGameSettingsAsync(string partieId, int nbPokemons, List<int>? generations, int? timerDuration)
    {
        var partie = await GetGameAsync(partieId);

        // Ne pas modifier les paramètres si la partie est déjà en cours
        // (protège TimerDurationSeconds contre une mise à jour tardive du lobby)
        if (partie.Statut == PartieStatut.EnCours)
            return partie;

        // Valider les paramètres
        if (nbPokemons < GameConstants.MinPokemons || nbPokemons > GameConstants.MaxPokemons)
            throw new ArgumentException($"Le nombre de Pokémon doit être entre {GameConstants.MinPokemons} et {GameConstants.MaxPokemons}.");

        // Mettre à jour les paramètres
        partie.NbPokemons = nbPokemons;
        partie.SelectedGenerations = generations ?? Enumerable.Range(1, 8).ToList();

        // Mettre à jour la durée du timer si fournie (-1 = infini)
        if (timerDuration.HasValue)
        {
            partie.TimerDurationSeconds = timerDuration.Value;
        }

        return partie;
    }

    public async Task<RematchStatusDto> MarkRematchReadyAsync(string partieId, string dresseurId)
    {
        if (string.IsNullOrWhiteSpace(dresseurId))
            throw new ArgumentException("dresseurId est requis.", nameof(dresseurId));

        var partie = await GetGameAsync(partieId);
        bool isJ1 = dresseurId == partie.Dresseur1Id;

        if (isJ1) partie.RematchReadyJ1 = true;
        else partie.RematchReadyJ2 = true;

        bool bothReady = partie.RematchReadyJ1 && (partie.ModeSolo || partie.RematchReadyJ2);

        if (bothReady && string.IsNullOrEmpty(partie.RematchPartieId))
        {
            await _rematchLock.WaitAsync();
            try
            {
                // Double-check après acquisition du lock pour éviter les doublons
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

        return new RematchStatusDto
        {
            Player1Ready = partie.RematchReadyJ1,
            Player2Ready = partie.RematchReadyJ2 || partie.ModeSolo,
            RematchPartieId = partie.RematchPartieId,
        };
    }
}
