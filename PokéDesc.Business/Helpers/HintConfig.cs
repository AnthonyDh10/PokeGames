namespace PokéDesc.Business.Helpers;

public record HintCost(int Points, double TimePenaltyPct);

public static class HintConfig
{
    public const int BaseScore = 100;
    public const int MaxAttempts = 3;

    public static readonly IReadOnlyDictionary<string, HintCost> Hints = new Dictionary<string, HintCost>
    {
        { "Type1",      new HintCost(20, 20.0) },
        { "Type2",      new HintCost(20, 20.0) },
        { "Generation", new HintCost(15, 15.0) },
        { "Category",   new HintCost( 5,  5.0) },
        { "Stats",      new HintCost( 5,  5.0) },
        { "Height",     new HintCost( 5,  5.0) },
        { "Weight",     new HintCost( 5,  5.0) },
        { "Abilities",  new HintCost( 5,  5.0) },
        { "Sprite",     new HintCost(50, 50.0) },
    };
}
