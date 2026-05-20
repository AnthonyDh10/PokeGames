using PokéDesc.Business.Interfaces;
using PokéDesc.Data.Repositories;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Services;

public class DeZoomService : IDeZoomService
{
    private readonly List<Pokemon> _pokemons;
    private static readonly Dictionary<string, DeZoomGameState> _gameStore = new();
    private static readonly object _lock = new();

    private static readonly Dictionary<int, string> GenerationNames = new()
    {
        { 1, "generation-i" },   { 2, "generation-ii" },  { 3, "generation-iii" },
        { 4, "generation-iv" },  { 5, "generation-v" },   { 6, "generation-vi" },
        { 7, "generation-vii" }, { 8, "generation-viii" }, { 9, "generation-ix" }
    };

    public DeZoomService(PokemonRepository repository)
    {
        _pokemons = repository.GetAllAsync().Result
            .Where(p => !string.IsNullOrEmpty(p.Sprites?.FrontDefault))
            .ToList();
    }

    private static string PickSpriteUrl(Pokemon pokemon, Random random)
    {
        bool isShiny = !string.IsNullOrEmpty(pokemon.Sprites?.FrontShiny) && random.NextDouble() < 0.05;
        return isShiny ? pokemon.Sprites!.FrontShiny! : pokemon.Sprites!.FrontDefault;
    }

    private List<Pokemon> FilterByGenerations(List<int>? selectedGenerations)
    {
        if (selectedGenerations == null || selectedGenerations.Count == 0)
            return _pokemons;

        var genNames = selectedGenerations
            .Where(g => GenerationNames.ContainsKey(g))
            .Select(g => GenerationNames[g])
            .ToHashSet();

        return _pokemons
            .Where(p => genNames.Contains(p.Generation?.NameEn ?? ""))
            .ToList();
    }

    public DeZoomGameDto GetOrCreateGame(string partieId, string dresseurId, List<int>? selectedGenerations = null)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
            {
                var random = new Random();
                var pool = FilterByGenerations(selectedGenerations);
                if (pool.Count == 0) pool = _pokemons; // fallback
                var pokemon = pool[random.Next(pool.Count)];

                state = new DeZoomGameState
                {
                    PartieId = partieId,
                    PokemonNameFr = pokemon.NameFr,
                    SpriteUrl = PickSpriteUrl(pokemon, random),
                    DresseurId1 = dresseurId,
                    SelectedGenerations = selectedGenerations ?? Enumerable.Range(1, 9).ToList(),
                };
                _gameStore[partieId] = state;
            }
            else if (state.DresseurId1 != dresseurId && state.DresseurId2 == null)
            {
                state.DresseurId2 = dresseurId;
            }

            bool isJ1 = dresseurId == state.DresseurId1;
            int attemptCount = isJ1 ? (state.AttemptCountJ1 ?? 0) : (state.AttemptCountJ2 ?? 0);

            return new DeZoomGameDto
            {
                SpriteUrl = state.SpriteUrl,
                AttemptCount = attemptCount,
            };
        }
    }

    public DeZoomGuessResult SubmitGuess(string partieId, string dresseurId, string pokemonNameFr, int elapsedSeconds, int attemptCount)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
                return new DeZoomGuessResult { IsCorrect = false, Message = "Partie introuvable." };

            bool isJ1 = dresseurId == state.DresseurId1;
            bool alreadyGuessed = isJ1 ? state.IsGuessedJ1 : state.IsGuessedJ2;

            if (alreadyGuessed)
            {
                return new DeZoomGuessResult
                {
                    IsCorrect = true,
                    Message = $"Bravo ! C'était {state.PokemonNameFr}.",
                    CorrectPokemonNameFr = state.PokemonNameFr,
                };
            }

            bool isCorrect = string.Equals(pokemonNameFr.Trim(), state.PokemonNameFr, StringComparison.OrdinalIgnoreCase);

            if (isCorrect)
            {
                if (isJ1)
                {
                    state.IsGuessedJ1 = true;
                    state.WasCorrectJ1 = true;
                    state.ElapsedSecondsJ1 = elapsedSeconds;
                    state.AttemptCountJ1 = attemptCount;
                }
                else
                {
                    state.IsGuessedJ2 = true;
                    state.WasCorrectJ2 = true;
                    state.ElapsedSecondsJ2 = elapsedSeconds;
                    state.AttemptCountJ2 = attemptCount;
                }

                return new DeZoomGuessResult
                {
                    IsCorrect = true,
                    Message = $"Bravo ! C'était {state.PokemonNameFr}.",
                    CorrectPokemonNameFr = state.PokemonNameFr,
                };
            }

            // Mauvaise réponse : stocker la tentative, et finir la partie si 3 tentatives épuisées
            if (isJ1)
            {
                state.AttemptCountJ1 = attemptCount;
                if (attemptCount >= 3)
                {
                    state.IsGuessedJ1 = true;
                    state.ElapsedSecondsJ1 = elapsedSeconds;
                }
            }
            else
            {
                state.AttemptCountJ2 = attemptCount;
                if (attemptCount >= 3)
                {
                    state.IsGuessedJ2 = true;
                    state.ElapsedSecondsJ2 = elapsedSeconds;
                }
            }

            // Calcul de la proximité (uniquement avant le game over)
            bool hasOneTypeInCommon = false;
            bool hasPerfectTypeMatch = false;
            bool hasSameGeneration = false;
            bool isInSameEvolutionChain = false;

            if (attemptCount < 3)
            {
                var targetPokemon = _pokemons.FirstOrDefault(p =>
                    string.Equals(p.NameFr, state.PokemonNameFr, StringComparison.OrdinalIgnoreCase));
                var guessedPokemon = _pokemons.FirstOrDefault(p =>
                    string.Equals(p.NameFr, pokemonNameFr.Trim(), StringComparison.OrdinalIgnoreCase));

                if (targetPokemon != null && guessedPokemon != null)
                {
                    var targetTypes = targetPokemon.Types?.Select(t => t.Name).ToList() ?? new List<string>();
                    var guessTypes = guessedPokemon.Types?.Select(t => t.Name).ToList() ?? new List<string>();
                    int commonTypesCount = targetTypes.Intersect(guessTypes, StringComparer.OrdinalIgnoreCase).Count();

                    hasOneTypeInCommon = commonTypesCount >= 1;
                    hasPerfectTypeMatch = targetTypes.Count == guessTypes.Count && commonTypesCount == targetTypes.Count;

                    hasSameGeneration = targetPokemon.Generation?.NameEn == guessedPokemon.Generation?.NameEn
                                        && !string.IsNullOrEmpty(targetPokemon.Generation?.NameEn);

                    isInSameEvolutionChain = targetPokemon.EvolutionChain?.BasePokemon == guessedPokemon.EvolutionChain?.BasePokemon
                                            && !string.IsNullOrEmpty(targetPokemon.EvolutionChain?.BasePokemon);
                }
            }

            string message = attemptCount < 3
                ? $"Mauvaise réponse. Il te reste {3 - attemptCount} essai{(3 - attemptCount > 1 ? "s" : "")}."
                : $"Dommage, c'était {state.PokemonNameFr} !";

            return new DeZoomGuessResult
            {
                IsCorrect = false,
                Message = message,
                CorrectPokemonNameFr = attemptCount >= 3 ? state.PokemonNameFr : null,
                HasOneTypeInCommon = hasOneTypeInCommon,
                HasPerfectTypeMatch = hasPerfectTypeMatch,
                HasSameGeneration = hasSameGeneration,
                IsInSameEvolutionChain = isInSameEvolutionChain,
            };
        }
    }

    public DeZoomGuessResult SkipPokemon(string partieId, string dresseurId, int elapsedSeconds)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
                return new DeZoomGuessResult { IsCorrect = false, Message = "Partie introuvable." };

            bool isJ1 = dresseurId == state.DresseurId1;
            if (isJ1)
            {
                state.IsGuessedJ1 = true;
                state.ElapsedSecondsJ1 = elapsedSeconds;
            }
            else
            {
                state.IsGuessedJ2 = true;
                state.ElapsedSecondsJ2 = elapsedSeconds;
            }

            return new DeZoomGuessResult
            {
                IsCorrect = false,
                Message = "Passé !",
                CorrectPokemonNameFr = state.PokemonNameFr,
            };
        }
    }

    public DeZoomGameResultsDto GetResults(string partieId)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
                return new DeZoomGameResultsDto();

            var player2 = state.DresseurId2 != null
                ? new DeZoomPlayerResultDto
                {
                    DresseurId = state.DresseurId2,
                    HasFinished = state.IsGuessedJ2,
                    WasCorrect = state.WasCorrectJ2,
                    ElapsedSeconds = state.ElapsedSecondsJ2,
                    AttemptCount = state.AttemptCountJ2,
                }
                : null;

            return new DeZoomGameResultsDto
            {
                SpriteUrl = state.SpriteUrl,
                CorrectPokemonNameFr = state.PokemonNameFr,
                Player1 = new DeZoomPlayerResultDto
                {
                    DresseurId = state.DresseurId1,
                    HasFinished = state.IsGuessedJ1,
                    WasCorrect = state.WasCorrectJ1,
                    ElapsedSeconds = state.ElapsedSecondsJ1,
                    AttemptCount = state.AttemptCountJ1,
                },
                Player2 = player2,
                BothFinished = state.IsGuessedJ1 && (state.DresseurId2 == null || state.IsGuessedJ2),
                Generations = state.SelectedGenerations,
            };
        }
    }

    public DeZoomRematchStatusDto MarkRematchReady(string partieId, string dresseurId)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
                return new DeZoomRematchStatusDto();

            bool isJ1 = dresseurId == state.DresseurId1;
            if (isJ1)
                state.RematchReadyJ1 = true;
            else
                state.RematchReadyJ2 = true;

            bool bothReady = state.RematchReadyJ1 && (state.DresseurId2 == null || state.RematchReadyJ2);
            if (bothReady && string.IsNullOrEmpty(state.RematchPartieId))
            {
                string newPartieId = Guid.NewGuid().ToString();
                state.RematchPartieId = newPartieId;

                var random = new Random();
                var pool = FilterByGenerations(state.SelectedGenerations);
                if (pool.Count == 0) pool = _pokemons;
                var pokemon = pool[random.Next(pool.Count)];

                _gameStore[newPartieId] = new DeZoomGameState
                {
                    PartieId = newPartieId,
                    PokemonNameFr = pokemon.NameFr,
                    SpriteUrl = PickSpriteUrl(pokemon, random),
                    DresseurId1 = state.DresseurId1,
                    DresseurId2 = state.DresseurId2,
                    SelectedGenerations = state.SelectedGenerations,
                };
            }

            return new DeZoomRematchStatusDto
            {
                Player1Ready = state.RematchReadyJ1,
                Player2Ready = state.RematchReadyJ2 || state.DresseurId2 == null,
                RematchPartieId = state.RematchPartieId,
            };
        }
    }
}
