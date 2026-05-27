namespace PokéDesc.Business.Helpers;

public static class ScoringCalculator
{
    public static int Calculate(List<string> usedHints)
    {
        int score = HintConfig.BaseScore;
        foreach (var hint in usedHints)
        {
            if (HintConfig.Hints.TryGetValue(hint, out var cost))
                score -= cost.Points;
        }
        return Math.Max(0, score);
    }
}
