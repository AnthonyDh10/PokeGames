namespace PokéDesc.Business.Helpers;

public static class ScoringCalculator
{
    public static int Calculate(List<string> usedHints)
    {
        int score = HintConfig.BaseScore;
        foreach (var hint in usedHints)
        {
            if (HintConfig.Costs.TryGetValue(hint, out int cost))
                score -= cost;
        }
        return Math.Max(0, score);
    }
}
