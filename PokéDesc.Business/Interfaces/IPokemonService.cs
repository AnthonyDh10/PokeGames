using PokéDesc.Domain.Models;
using PokéDesc.Business.Models;

namespace PokéDesc.Business.Interfaces;

public interface IPokemonService
{
    Task<List<Pokemon>> GetAllPokemonsAsync();
    Task<(List<Pokemon> items, int totalCount, int totalPages)> GetPokemonsPaginatedAsync(int page, int pageSize);
    Task<Pokemon> GetPokemonByIdAsync(string id);
    Task<Pokemon> GetPokemonByPokedexNumberAsync(int pokedexNumber);
    Task<List<Pokemon>> GetPokemonsByTypeAsync(string typeName);
    Task<List<Pokemon>> GetPokemonsByGenerationAsync(string generationName);
    Task<List<Pokemon>> GetLegendaryPokemonsAsync();
    Task<List<Pokemon>> GetMythicalPokemonsAsync();
    Task<List<Pokemon>> GetLegendaryOrMythicalPokemonsAsync();
    Task<List<Pokemon>> GetBaseEvolutionPokemonsAsync();
    Task<List<string>> GetCensoredDescriptionAsync(string id);
    Task<string> GetPokemonNameFrAsync(string id);
    Task<PokemonHints> GetPokemonHintsAsync(string id);
}
