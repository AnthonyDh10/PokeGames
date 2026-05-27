using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Helpers;

public readonly record struct ProximityResult(
    bool HasOneTypeInCommon,
    bool HasPerfectTypeMatch,
    bool HasSameGeneration,
    bool IsInSameEvolutionChain);

public static class ProximityCalculator
{
    public static ProximityResult Calculate(Pokemon target, Pokemon? guessed)
    {
        if (guessed == null)
            return default;

        var targetTypes = target.Types?.Select(t => t.Name).ToList() ?? new List<string>();
        var guessTypes = guessed.Types?.Select(t => t.Name).ToList() ?? new List<string>();
        int commonTypesCount = targetTypes.Intersect(guessTypes, StringComparer.OrdinalIgnoreCase).Count();

        return new ProximityResult(
            HasOneTypeInCommon: commonTypesCount >= 1,
            HasPerfectTypeMatch: targetTypes.Count == guessTypes.Count && commonTypesCount == targetTypes.Count,
            HasSameGeneration: target.Generation?.NameEn == guessed.Generation?.NameEn
                               && !string.IsNullOrEmpty(target.Generation?.NameEn),
            IsInSameEvolutionChain: target.EvolutionChain?.BasePokemon == guessed.EvolutionChain?.BasePokemon
                                    && !string.IsNullOrEmpty(target.EvolutionChain?.BasePokemon));
    }
}
