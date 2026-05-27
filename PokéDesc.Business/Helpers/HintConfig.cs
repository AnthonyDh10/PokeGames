namespace PokéDesc.Business.Helpers;

public static class HintConfig
{
    public const int BaseScore = 100;
    public const int MaxAttempts = 3;

    public static readonly IReadOnlyDictionary<string, int> Costs = new Dictionary<string, int>
    {
        { "Type1", 20 },
        { "Type2", 20 },
        { "Generation", 15 },
        { "Category", 5 },
        { "Stats", 5 },
        { "Height", 5 },
        { "Weight", 5 },
        { "Abilities", 5 },
        { "Sprite", 50 }
    };

    public static readonly IReadOnlyDictionary<string, double> TimePenalties = new Dictionary<string, double>
    {
        { "Type1", 20.0 },
        { "Type2", 20.0 },
        { "Generation", 15.0 },
        { "Category", 5.0 },
        { "Stats", 5.0 },
        { "Height", 5.0 },
        { "Weight", 5.0 },
        { "Abilities", 5.0 },
        { "Sprite", 50.0 }
    };
}
