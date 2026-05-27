using System.Text.Json;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.Data.Repositories;

public class PokemonRepository : IPokemonRepository
{
    private readonly List<Pokemon> _pokemons;

    public PokemonRepository(string dataPath)
    {
        var jsonPath = Path.Combine(dataPath, "all_pokemon.json");
        var json = File.ReadAllText(jsonPath);
        var options = new JsonSerializerOptions
        {
            // Mappe les clés snake_case du fichier JSON vers les propriétés PascalCase C#.
            // Les [JsonPropertyName] explicites (NumericId, Stats) conservent leur mappage.
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            PropertyNameCaseInsensitive = true
        };
        _pokemons = JsonSerializer.Deserialize<List<Pokemon>>(json, options)!;

        // Id = string du numéro de Pokédex (remplace l'ancien ObjectId MongoDB)
        foreach (var p in _pokemons)
            p.Id = p.PokedexNumber.ToString();
    }

    public Task<List<Pokemon>> GetAllAsync()
        => Task.FromResult(_pokemons.OrderBy(p => p.PokedexNumber).ToList());

    public Task<(List<Pokemon> items, int totalCount)> GetPaginatedAsync(int page, int pageSize)
    {
        var sorted = _pokemons.OrderBy(p => p.PokedexNumber).ToList();
        var items = sorted.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Task.FromResult((items, sorted.Count));
    }

    public Task<Pokemon> GetByIdAsync(string id)
        => Task.FromResult(_pokemons.FirstOrDefault(p => p.Id == id)!);

    public Task<Pokemon> GetByPokedexNumberAsync(int pokedexNumber)
        => Task.FromResult(_pokemons.FirstOrDefault(p => p.PokedexNumber == pokedexNumber)!);

    public Task<List<Pokemon>> GetByTypeAsync(string typeName)
        => Task.FromResult(_pokemons
            .Where(p => p.Types != null && p.Types.Any(t =>
                string.Equals(t.Name, typeName, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(t.NameEn, typeName, StringComparison.OrdinalIgnoreCase)))
            .ToList());

    public Task<List<Pokemon>> GetByGenerationAsync(string generationName)
        => Task.FromResult(_pokemons
            .Where(p => p.Generation != null && (
                string.Equals(p.Generation.NameFr, generationName, StringComparison.OrdinalIgnoreCase) ||
                string.Equals(p.Generation.NameEn, generationName, StringComparison.OrdinalIgnoreCase)))
            .ToList());
}
