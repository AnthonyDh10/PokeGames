using PokéDesc.Business.Constants;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Domain.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Services;

public class TypesGameService : MiniGameServiceBase<TypesGameState>, ITypesGameService
{
    private readonly ITypesRepository _typesRepository;

    public TypesGameService(IMiniGameStore<TypesGameState> store, ITypesRepository typesRepository)
        : base(store)
    {
        _typesRepository = typesRepository;
    }

    private List<TypeData> AllTypes() => _typesRepository.GetAllAsync().GetAwaiter().GetResult();

    public TypesGameDto GetOrCreateGame(string partieId, string dresseurId)
    {
        lock (Lock)
        {
            Store.Cleanup(GameConstants.GameTtl);

            var state = Store.Get(partieId);
            if (state == null)
            {
                var types = AllTypes();
                var type1 = types[Random.Shared.Next(types.Count)];

                // 50 % de chance d'avoir un deuxième type différent
                TypeData? type2 = null;
                if (Random.Shared.Next(2) == 0)
                {
                    var candidates = types.Where(t => t.Id != type1.Id).ToList();
                    if (candidates.Count > 0)
                        type2 = candidates[Random.Shared.Next(candidates.Count)];
                }

                state = new TypesGameState
                {
                    PartieId = partieId,
                    Type1Id = type1.Id,
                    Type2Id = type2?.Id ?? 0,
                    Player1 = new MiniGamePlayerState { DresseurId = dresseurId },
                };

                Store.Set(partieId, state);
            }
            else
            {
                EnsurePlayer2(state, dresseurId);
            }

            var allTypes = AllTypes();
            var t1 = allTypes.First(t => t.Id == state.Type1Id);
            var t2 = state.Type2Id != 0 ? allTypes.FirstOrDefault(t => t.Id == state.Type2Id) : null;

            return new TypesGameDto { Interactions = BuildInteractions(t1, t2, allTypes) };
        }
    }

    public TypesGuessResult SubmitGuess(string partieId, string dresseurId, int type1Id, int? type2Id,
        int elapsedSeconds, int attemptCount)
    {
        lock (Lock)
        {
            var state = Store.Get(partieId)
                ?? throw new KeyNotFoundException($"Partie {partieId} introuvable.");

            var player = GetPlayer(state, dresseurId);
            if (player.IsGuessed)
                return new TypesGuessResult { IsCorrect = false, Message = "Vous avez déjà terminé." };

            // Un type est correct s'il correspond à type1 OU type2 du Pokémon cible
            bool hasType1 = type1Id == state.Type1Id || type1Id == state.Type2Id;
            bool hasType2 = !type2Id.HasValue || (type2Id.Value == state.Type1Id || type2Id.Value == state.Type2Id);
            bool correctCount = type2Id.HasValue == (state.Type2Id != 0);
            bool isCorrect = hasType1 && hasType2 && correctCount;

            var allTypes = AllTypes();

            if (isCorrect)
            {
                RecordCorrectGuess(player, elapsedSeconds, attemptCount);
                return new TypesGuessResult
                {
                    IsCorrect = true,
                    Message = "Bravo ! Bonne combinaison de types !",
                    CorrectType1NameFr = allTypes.FirstOrDefault(t => t.Id == state.Type1Id)?.NameFr,
                    CorrectType2NameFr = state.Type2Id != 0
                        ? allTypes.FirstOrDefault(t => t.Id == state.Type2Id)?.NameFr
                        : null,
                };
            }

            RecordFailedAttempt(player, elapsedSeconds, attemptCount);

            // Correspondance partielle : au moins un type correct
            string? partialMatchType = null;
            if (type1Id == state.Type1Id || type1Id == state.Type2Id)
                partialMatchType = allTypes.FirstOrDefault(t => t.Id == type1Id)?.NameFr;
            else if (type2Id.HasValue && (type2Id.Value == state.Type1Id || type2Id.Value == state.Type2Id))
                partialMatchType = allTypes.FirstOrDefault(t => t.Id == type2Id.Value)?.NameFr;

            var correctType1Fr = allTypes.FirstOrDefault(t => t.Id == state.Type1Id)?.NameFr;
            var correctType2Fr = state.Type2Id != 0
                ? allTypes.FirstOrDefault(t => t.Id == state.Type2Id)?.NameFr
                : null;

            string message = player.IsGuessed
                ? $"Raté ! C'était {correctType1Fr}{(correctType2Fr != null ? $" / {correctType2Fr}" : "")}."
                : $"Mauvaise réponse ! Il vous reste {GameConstants.MaxAttempts - attemptCount} essai(s).";

            return new TypesGuessResult
            {
                IsCorrect = false,
                Message = message,
                CorrectType1NameFr = player.IsGuessed ? correctType1Fr : null,
                CorrectType2NameFr = player.IsGuessed ? correctType2Fr : null,
                PartialMatchTypeFr = partialMatchType,
            };
        }
    }

    public TypesGameResultsDto GetResults(string partieId)
    {
        lock (Lock)
        {
            var state = Store.Get(partieId)
                ?? throw new KeyNotFoundException($"Partie {partieId} introuvable.");

            var allTypes = AllTypes();
            var type1 = allTypes.FirstOrDefault(t => t.Id == state.Type1Id);
            var type2 = state.Type2Id != 0 ? allTypes.FirstOrDefault(t => t.Id == state.Type2Id) : null;

            return new TypesGameResultsDto
            {
                Interactions = BuildInteractions(type1, type2, allTypes),
                CorrectType1NameFr = type1?.NameFr,
                CorrectType2NameFr = type2?.NameFr,
                Player1 = BuildPlayerResultDto(state.Player1),
                Player2 = state.Player2.DresseurId != null ? BuildPlayerResultDto(state.Player2) : null,
                BothFinished = BothFinished(state),
            };
        }
    }

    public RematchStatusDto MarkRematchReady(string partieId, string dresseurId)
    {
        lock (Lock)
        {
            var state = Store.Get(partieId)
                ?? throw new KeyNotFoundException($"Partie {partieId} introuvable.");

            return MarkRematchCore(state, dresseurId, newId => new TypesGameState
            {
                PartieId = newId,
                Type1Id = state.Type1Id,
                Type2Id = state.Type2Id,
                Player1 = new MiniGamePlayerState { DresseurId = state.Player1.DresseurId },
                Player2 = state.Player2.DresseurId != null
                    ? new MiniGamePlayerState { DresseurId = state.Player2.DresseurId }
                    : new MiniGamePlayerState(),
            });
        }
    }

    public List<TypeSimpleDto> GetAllTypes()
    {
        return AllTypes()
            .Select(t => new TypeSimpleDto { Id = t.Id, NameFr = t.NameFr })
            .ToList();
    }

    // ── Helper privé ─────────────────────────────────────────────────────────

    /// <summary>
    /// Calcule les interactions défensives réelles et retourne un dictionnaire
    /// avec les clés "x4", "x2", "x1", "x0.5", "x0.25", "x0" (noms FR).
    /// Utilise un multiplicateur entier ×4 pour éviter les erreurs virgule flottante.
    /// </summary>
    private static Dictionary<string, List<string>> BuildInteractions(
        TypeData? type1, TypeData? type2, List<TypeData> allTypes)
    {
        if (type1 == null) return new();

        // Index NameEn → NameFr
        var enToFr = allTypes.ToDictionary(
            t => t.NameEn, t => t.NameFr, StringComparer.OrdinalIgnoreCase);

        // Ensembles de résistances/faiblesses (clés = NameEn PokeAPI)
        var t1x2  = ToSet(type1.DamageRelations.DoubleDamageFrom);
        var t1x05 = ToSet(type1.DamageRelations.HalfDamageFrom);
        var t1x0  = ToSet(type1.DamageRelations.NoDamageFrom);

        HashSet<string> t2x2 = new(), t2x05 = new(), t2x0 = new();
        if (type2 != null)
        {
            t2x2  = ToSet(type2.DamageRelations.DoubleDamageFrom);
            t2x05 = ToSet(type2.DamageRelations.HalfDamageFrom);
            t2x0  = ToSet(type2.DamageRelations.NoDamageFrom);
        }

        var groups = new Dictionary<string, List<string>>();

        foreach (var atk in allTypes)
        {
            string en = atk.NameEn;

            // Multiplicateur entier (×4 pour éviter les flottants) : 4 = x1
            int mult4 = 4;
            if      (t1x0.Contains(en))  mult4 = 0;
            else if (t1x2.Contains(en))  mult4 = 8;
            else if (t1x05.Contains(en)) mult4 = 2;

            if (type2 != null)
            {
                if      (t2x0.Contains(en))  mult4 = 0;        // immunité totale
                else if (t2x2.Contains(en))  mult4 *= 2;       // ×2 → peut donner ×4
                else if (t2x05.Contains(en)) mult4 /= 2;       // ÷2 → peut donner ×0.25
            }

            string key = mult4 switch
            {
                16 => "x4",
                8  => "x2",
                4  => "x1",
                2  => "x0.5",
                1  => "x0.25",
                0  => "x0",
                _  => $"x{mult4 / 4.0}",
            };

            string nameFr = enToFr.TryGetValue(en, out var fr) ? fr : en;

            if (!groups.TryGetValue(key, out var list))
                groups[key] = list = new List<string>();
            list.Add(nameFr);
        }

        return groups;
    }

    private static HashSet<string> ToSet(IEnumerable<TypeDamageRef> refs) =>
        refs.Select(r => r.Name).ToHashSet(StringComparer.OrdinalIgnoreCase);
}
