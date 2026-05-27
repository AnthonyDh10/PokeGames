using PokéDesc.Domain.Models;

namespace PokéDesc.Domain.Interfaces;

public interface IPokemonRepository
{
    Task<List<Pokemon>> GetAllAsync();
    Task<(List<Pokemon> items, int totalCount)> GetPaginatedAsync(int page, int pageSize);
    Task<Pokemon?> GetByIdAsync(string id);
    Task<Pokemon?> GetByPokedexNumberAsync(int pokedexNumber);
    Task<List<Pokemon>> GetByTypeAsync(string typeName);
    Task<List<Pokemon>> GetByGenerationAsync(string generationName);
}
