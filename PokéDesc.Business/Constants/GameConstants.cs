namespace PokéDesc.Business.Constants;

public static class GameConstants
{
    public const int MinPokemons = 1;
    public const int MaxPokemons = 6;

    public static readonly Dictionary<int, string> GenerationNames = new()
    {
        { 1, "generation-i" },   { 2, "generation-ii" },  { 3, "generation-iii" },
        { 4, "generation-iv" },  { 5, "generation-v" },   { 6, "generation-vi" },
        { 7, "generation-vii" }, { 8, "generation-viii" }, { 9, "generation-ix" }
    };
}
