using System.Text.Json;
using System.Text.Json.Serialization;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Services;

internal class TypeDamageRef
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

internal class DamageRelations
{
    [JsonPropertyName("double_damage_from")]
    public List<TypeDamageRef> DoubleDamageFrom { get; set; } = new();

    [JsonPropertyName("half_damage_from")]
    public List<TypeDamageRef> HalfDamageFrom { get; set; } = new();

    [JsonPropertyName("no_damage_from")]
    public List<TypeDamageRef> NoDamageFrom { get; set; } = new();
}

internal class TypeData
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name_fr")]
    public string NameFr { get; set; } = string.Empty;

    [JsonPropertyName("name_en")]
    public string NameEn { get; set; } = string.Empty;

    [JsonPropertyName("damage_relations")]
    public DamageRelations DamageRelations { get; set; } = new();
}

public class TypesGameService : ITypesGameService
{
    private readonly List<TypeData> _types;
    private static readonly Dictionary<string, TypesGameState> _gameStore = new();
    private static readonly object _lock = new();

    public TypesGameService(string dataPath)
    {
        var json = File.ReadAllText(Path.Combine(dataPath, "all_types.json"));
        _types = JsonSerializer.Deserialize<List<TypeData>>(json) ?? new();
    }

    public List<TypeSimpleDto> GetAllTypes() =>
        _types.Select(t => new TypeSimpleDto { Id = t.Id, NameFr = t.NameFr }).ToList();

    public TypesGameDto GetOrCreateGame(string partieId, string dresseurId)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
            {
                var random = new Random();
                var shuffled = _types.OrderBy(_ => random.Next()).ToList();
                int type1Id = shuffled[0].Id;
                int type2Id = shuffled[1].Id;

                state = new TypesGameState
                {
                    PartieId = partieId,
                    Type1Id = type1Id,
                    Type2Id = type2Id,
                    DresseurId1 = dresseurId,
                };
                _gameStore[partieId] = state;
            }
            else if (state.DresseurId1 != dresseurId && state.DresseurId2 == null)
            {
                state.DresseurId2 = dresseurId;
            }

            return BuildDto(state);
        }
    }

    public TypesGuessResult SubmitGuess(string partieId, string dresseurId, int type1Id, int? type2Id, int elapsedSeconds, int attemptCount)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
                return new TypesGuessResult { IsCorrect = false, Message = "Partie introuvable." };

            bool isJ1 = dresseurId == state.DresseurId1;
            bool alreadyGuessed = isJ1 ? state.IsGuessedJ1 : state.IsGuessedJ2;
            if (alreadyGuessed)
            {
                var t1Cached = _types.First(t => t.Id == state.Type1Id);
                var t2Cached = _types.First(t => t.Id == state.Type2Id);
                var answer = $"{t1Cached.NameFr} / {t2Cached.NameFr}";
                return new TypesGuessResult { IsCorrect = true, Message = $"Bravo ! C'était {answer}.", CorrectType1NameFr = t1Cached.NameFr, CorrectType2NameFr = t2Cached.NameFr };
            }

            // La réponse doit toujours être une paire (type2Id ne peut pas être null)
            if (type2Id == null)
            {
                return new TypesGuessResult { IsCorrect = false, Message = "Vous devez sélectionner deux types !" };
            }

            var secretSet = new HashSet<int> { state.Type1Id, state.Type2Id };
            var guessSet = new HashSet<int> { type1Id, type2Id.Value };
            bool isCorrect = secretSet.SetEquals(guessSet);

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

                var t1 = _types.First(t => t.Id == state.Type1Id);
                var t2 = _types.First(t => t.Id == state.Type2Id);
                var answerStr = $"{t1.NameFr} / {t2.NameFr}";
                return new TypesGuessResult
                {
                    IsCorrect = true,
                    Message = $"Bravo ! C'était {answerStr}.",
                    CorrectType1NameFr = t1.NameFr,
                    CorrectType2NameFr = t2.NameFr,
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

            return new TypesGuessResult
            {
                IsCorrect = false,
                Message = "Ce n'est pas ça, réessayez !",
            };
        }
    }

    public TypesGameResultsDto GetResults(string partieId)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
                return new TypesGameResultsDto();

            var t1 = _types.First(t => t.Id == state.Type1Id);
            var t2 = _types.First(t => t.Id == state.Type2Id);

            var player2 = state.DresseurId2 != null
                ? new TypesPlayerResultDto
                {
                    DresseurId = state.DresseurId2,
                    HasFinished = state.IsGuessedJ2,
                    WasCorrect = state.WasCorrectJ2,
                    ElapsedSeconds = state.ElapsedSecondsJ2,
                    AttemptCount = state.AttemptCountJ2,
                }
                : null;

            return new TypesGameResultsDto
            {
                IsMono = false,
                Interactions = BuildDto(state).Interactions,
                CorrectType1NameFr = t1.NameFr,
                CorrectType2NameFr = t2.NameFr,
                Player1 = new TypesPlayerResultDto
                {
                    DresseurId = state.DresseurId1,
                    HasFinished = state.IsGuessedJ1,
                    WasCorrect = state.WasCorrectJ1,
                    ElapsedSeconds = state.ElapsedSecondsJ1,
                    AttemptCount = state.AttemptCountJ1,
                },
                Player2 = player2,
                BothFinished = state.IsGuessedJ1 && (state.DresseurId2 == null || state.IsGuessedJ2),
            };
        }
    }

    private TypesGameDto BuildDto(TypesGameState state)
    {
        var buckets = new Dictionary<string, List<string>>
        {
            ["x4"] = new(),
            ["x2"] = new(),
            ["x1"] = new(),
            ["x0.5"] = new(),
            ["x0.25"] = new(),
            ["x0"] = new(),
        };

        var defType1 = _types.First(t => t.Id == state.Type1Id);
        var defType2 = _types.First(t => t.Id == state.Type2Id);

        foreach (var attacker in _types)
        {
            double mult = ComputeMultiplier(attacker.NameEn, defType1, defType2);
            string bucket = mult switch
            {
                4.0 => "x4",
                2.0 => "x2",
                0.5 => "x0.5",
                0.25 => "x0.25",
                0.0 => "x0",
                _ => "x1",
            };
            buckets[bucket].Add(attacker.NameFr);
        }

        return new TypesGameDto
        {
            IsMono = defType2 == null,
            Interactions = buckets,
        };
    }

    private static double ComputeMultiplier(string attackerNameEn, TypeData def1, TypeData? def2)
    {
        double mult = 1.0;
        mult *= GetMultiplierAgainstSingle(attackerNameEn, def1);
        if (def2 != null)
            mult *= GetMultiplierAgainstSingle(attackerNameEn, def2);
        return mult;
    }

    public TypesRematchStatusDto MarkRematchReady(string partieId, string dresseurId)
    {
        lock (_lock)
        {
            if (!_gameStore.TryGetValue(partieId, out var state))
                return new TypesRematchStatusDto();

            bool isJ1 = dresseurId == state.DresseurId1;
            if (isJ1)
                state.RematchReadyJ1 = true;
            else
                state.RematchReadyJ2 = true;

            // If both are ready and rematch partieId not yet created, create it
            bool bothReady = state.RematchReadyJ1 && (state.DresseurId2 == null || state.RematchReadyJ2);
            if (bothReady && string.IsNullOrEmpty(state.RematchPartieId))
            {
                string newPartieId = Guid.NewGuid().ToString();
                state.RematchPartieId = newPartieId;

                // Pre-create the new game with the same players
                var newState = new TypesGameState
                {
                    PartieId = newPartieId,
                    DresseurId1 = state.DresseurId1,
                    DresseurId2 = state.DresseurId2,
                };
                // Set up new puzzle
                var random = new Random();
                bool isMono = random.Next(10) < 3;
                var shuffled = _types.OrderBy(_ => random.Next()).ToList();
                newState.Type1Id = shuffled[0].Id;
                newState.Type2Id = isMono ? null : shuffled[1].Id;

                _gameStore[newPartieId] = newState;
            }

            return new TypesRematchStatusDto
            {
                Player1Ready = state.RematchReadyJ1,
                Player2Ready = state.RematchReadyJ2 || state.DresseurId2 == null,
                RematchPartieId = state.RematchPartieId,
            };
        }
    }

    private static double GetMultiplierAgainstSingle(string attackerNameEn, TypeData defender)
    {
        if (defender.DamageRelations.NoDamageFrom.Any(r => r.Name == attackerNameEn))
            return 0.0;
        if (defender.DamageRelations.DoubleDamageFrom.Any(r => r.Name == attackerNameEn))
            return 2.0;
        if (defender.DamageRelations.HalfDamageFrom.Any(r => r.Name == attackerNameEn))
            return 0.5;
        return 1.0;
    }
}
