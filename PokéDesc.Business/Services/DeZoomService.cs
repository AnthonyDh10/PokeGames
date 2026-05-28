using PokéDesc.Business.Constants;
using PokéDesc.Business.Helpers;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Domain.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Services;

public class DeZoomService : MiniGameServiceBase<DeZoomGameState>, IDeZoomService
{
    private readonly IPokemonRepository _pokemonRepository;

    public DeZoomService(IMiniGameStore<DeZoomGameState> store, IPokemonRepository pokemonRepository)
        : base(store)
    {
        _pokemonRepository = pokemonRepository;
    }

    private List<Pokemon> AllPokemon() => _pokemonRepository.GetAllAsync().GetAwaiter().GetResult();

    private static string GenerationEnName(int n) => "generation-" + n switch
    {
        1 => "i", 2 => "ii", 3 => "iii", 4 => "iv", 5 => "v",
        6 => "vi", 7 => "vii", 8 => "viii", 9 => "ix", _ => n.ToString()
    };

    public DeZoomGameDto GetOrCreateGame(string partieId, string dresseurId, List<int>? selectedGenerations = null)
    {
        lock (Lock)
        {
            Store.Cleanup(GameConstants.GameTtl);

            var state = Store.Get(partieId);
            bool needsInit = state == null || string.IsNullOrEmpty(state.PokemonNameFr);

            if (needsInit)
            {
                var generations = (state?.SelectedGenerations is { Count: > 0 } sg ? sg : null)
                    ?? selectedGenerations
                    ?? Enumerable.Range(1, 9).ToList();

                var genNames = generations
                    .Select(GenerationEnName)
                    .ToHashSet(StringComparer.OrdinalIgnoreCase);
                var pool = AllPokemon()
                    .Where(p => p.Generation != null && genNames.Contains(p.Generation.NameEn))
                    .ToList();

                if (pool.Count == 0)
                    throw new InvalidOperationException("Aucun Pokémon trouvé pour les générations sélectionnées.");

                var pokemon = pool[Random.Shared.Next(pool.Count)];

                if (state == null)
                {
                    state = new DeZoomGameState
                    {
                        PartieId = partieId,
                        Player1 = new MiniGamePlayerState { DresseurId = dresseurId },
                        SelectedGenerations = generations,
                    };
                }

                state.PokemonNameFr = pokemon.NameFr;
                state.SpriteUrl = pokemon.Sprites?.FrontDefault ?? string.Empty;
                Store.Set(partieId, state);
            }
            else
            {
                EnsurePlayer2(state, dresseurId);
            }

            var player = GetPlayer(state, dresseurId);
            return new DeZoomGameDto
            {
                SpriteUrl = state.SpriteUrl,
                AttemptCount = player.AttemptCount ?? 0,
            };
        }
    }

    public DeZoomGuessResult SubmitGuess(string partieId, string dresseurId, string pokemonNameFr,
        int elapsedSeconds, int attemptCount)
    {
        lock (Lock)
        {
            var state = Store.Get(partieId)
                ?? throw new KeyNotFoundException($"Partie {partieId} introuvable.");

            var player = GetPlayer(state, dresseurId);
            if (player.IsGuessed)
                return new DeZoomGuessResult { IsCorrect = false, Message = "Vous avez déjà terminé." };

            bool isCorrect = string.Equals(pokemonNameFr.Trim(), state.PokemonNameFr,
                StringComparison.OrdinalIgnoreCase);

            if (isCorrect)
            {
                RecordCorrectGuess(player, elapsedSeconds, attemptCount);
                return new DeZoomGuessResult
                {
                    IsCorrect = true,
                    Message = $"Bravo ! C'est bien {state.PokemonNameFr} !",
                    HasOneTypeInCommon = true,
                    HasPerfectTypeMatch = true,
                    HasSameGeneration = true,
                    IsInSameEvolutionChain = true,
                };
            }

            RecordFailedAttempt(player, elapsedSeconds, attemptCount);

            var all = AllPokemon();
            var guessedPokemon = all.FirstOrDefault(p =>
                string.Equals(p.NameFr, pokemonNameFr.Trim(), StringComparison.OrdinalIgnoreCase));
            var correctPokemon = all.FirstOrDefault(p => p.NameFr == state.PokemonNameFr);

            var proximity = guessedPokemon != null && correctPokemon != null
                ? ProximityCalculator.Calculate(guessedPokemon, correctPokemon)
                : new ProximityResult();

            string message = player.IsGuessed
                ? $"Raté ! C'était {state.PokemonNameFr}."
                : $"Mauvaise réponse ! Il vous reste {GameConstants.MaxAttempts - attemptCount} essai(s).";

            return new DeZoomGuessResult
            {
                IsCorrect = false,
                Message = message,
                CorrectPokemonNameFr = player.IsGuessed ? state.PokemonNameFr : null,
                HasOneTypeInCommon = proximity.HasOneTypeInCommon,
                HasPerfectTypeMatch = proximity.HasPerfectTypeMatch,
                HasSameGeneration = proximity.HasSameGeneration,
                IsInSameEvolutionChain = proximity.IsInSameEvolutionChain,
            };
        }
    }

    public DeZoomGuessResult SkipPokemon(string partieId, string dresseurId, int elapsedSeconds)
    {
        lock (Lock)
        {
            var state = Store.Get(partieId)
                ?? throw new KeyNotFoundException($"Partie {partieId} introuvable.");

            var player = GetPlayer(state, dresseurId);
            if (player.IsGuessed)
                return new DeZoomGuessResult { IsCorrect = false, Message = "Vous avez déjà terminé." };

            player.IsGuessed = true;
            player.WasCorrect = false;
            player.ElapsedSeconds = elapsedSeconds;

            return new DeZoomGuessResult
            {
                IsCorrect = false,
                Message = $"Pokémon passé ! C'était {state.PokemonNameFr}.",
                CorrectPokemonNameFr = state.PokemonNameFr,
            };
        }
    }

    public DeZoomGameResultsDto GetResults(string partieId)
    {
        lock (Lock)
        {
            var state = Store.Get(partieId)
                ?? throw new KeyNotFoundException($"Partie {partieId} introuvable.");

            return new DeZoomGameResultsDto
            {
                SpriteUrl = state.SpriteUrl,
                CorrectPokemonNameFr = state.PokemonNameFr,
                Player1 = BuildPlayerResultDto(state.Player1),
                Player2 = state.Player2.DresseurId != null ? BuildPlayerResultDto(state.Player2) : null,
                BothFinished = BothFinished(state),
                Generations = state.SelectedGenerations,
            };
        }
    }

    public RematchStatusDto MarkRematchReady(string partieId, string dresseurId)
    {
        lock (Lock)
        {
            var state = Store.Get(partieId)
                ?? throw new KeyNotFoundException($"Partie {partieId} introuvable.");

            // PokemonNameFr/SpriteUrl intentionnellement omis : GetOrCreateGame
            // détectera l'état non initialisé et choisira un nouveau Pokémon.
            return MarkRematchCore(state, dresseurId, newId => new DeZoomGameState
            {
                PartieId = newId,
                SelectedGenerations = state.SelectedGenerations,
                Player1 = new MiniGamePlayerState { DresseurId = state.Player1.DresseurId },
                Player2 = state.Player2.DresseurId != null
                    ? new MiniGamePlayerState { DresseurId = state.Player2.DresseurId }
                    : new MiniGamePlayerState(),
            });
        }
    }
}
