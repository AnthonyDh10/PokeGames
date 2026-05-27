using System.Text.Json;
using PokéDesc.Domain.Interfaces;
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
        // Tri par numéro de Pokédex une seule fois à l'initialisation (Singleton)
        foreach (var p in _pokemons)
            p.Id = p.PokedexNumber.ToString();
        _pokemons.Sort((a, b) => a.PokedexNumber.CompareTo(b.PokedexNumber));
    }

    public Task<List<Pokemon>> GetAllAsync()
        => Task.FromResult(_pokemons.ToList());

    public Task<(List<Pokemon> items, int totalCount)> GetPaginatedAsync(int page, int pageSize)
    {
        var items = _pokemons.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return Task.FromResult((items, _pokemons.Count));
    }

    public Task<Pokemon?> GetByIdAsync(string id)
        => Task.FromResult(_pokemons.FirstOrDefault(p => p.Id == id));

    public Task<Pokemon?> GetByPokedexNumberAsync(int pokedexNumber)
        => Task.FromResult(_pokemons.FirstOrDefault(p => p.PokedexNumber == pokedexNumber));

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
