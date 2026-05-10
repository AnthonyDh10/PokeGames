using PokéDesc.Data.Repositories;
using PokéDesc.Domain.Models;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;

namespace PokéDesc.Business.Services;

public class PokemonService : IPokemonService
{
    private readonly PokemonRepository _repository;

    public PokemonService(PokemonRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<Pokemon>> GetAllPokemonsAsync()
    {
        return await _repository.GetAllAsync();
    }

    public async Task<(List<Pokemon> items, int totalCount, int totalPages)> GetPokemonsPaginatedAsync(int page, int pageSize)
    {
        var (items, totalCount) = await _repository.GetPaginatedAsync(page, pageSize);
        var totalPages = (int)Math.Ceiling((double)totalCount / pageSize);
        return (items, totalCount, totalPages);
    }

    public async Task<Pokemon> GetPokemonByIdAsync(string id)
    {
        Pokemon? pokemon = null;

        if (int.TryParse(id, out int pokedexNumber))
        {
            pokemon = await _repository.GetByPokedexNumberAsync(pokedexNumber);
        }

        if (pokemon == null)
        {
            throw new KeyNotFoundException($"Pokemon avec l'ID {id} introuvable");
        }
        return pokemon;
    }

    public async Task<Pokemon> GetPokemonByPokedexNumberAsync(int pokedexNumber)
    {
        var pokemon = await _repository.GetByPokedexNumberAsync(pokedexNumber);
        if (pokemon == null)
        {
            throw new KeyNotFoundException($"Pokemon #{pokedexNumber} introuvable");
        }
        return pokemon;
    }

    public async Task<List<Pokemon>> GetPokemonsByTypeAsync(string typeName)
    {
        return await _repository.GetByTypeAsync(typeName);
    }

    public async Task<List<Pokemon>> GetPokemonsByGenerationAsync(string generationName)
    {
        return await _repository.GetByGenerationAsync(generationName);
    }

    public async Task<List<Pokemon>> GetLegendaryPokemonsAsync()
    {
        var allPokemons = await _repository.GetAllAsync();
        return allPokemons.Where(p => p.Status.IsLegendary).ToList();
    }

    public async Task<List<Pokemon>> GetMythicalPokemonsAsync()
    {
        var allPokemons = await _repository.GetAllAsync();
        return allPokemons.Where(p => p.Status.IsMythical).ToList();
    }

    public async Task<List<Pokemon>> GetLegendaryOrMythicalPokemonsAsync()
    {
        var allPokemons = await _repository.GetAllAsync();
        return allPokemons.Where(p => p.Status.IsLegendary || p.Status.IsMythical).ToList();
    }

    public async Task<List<Pokemon>> GetBaseEvolutionPokemonsAsync()
    {
        var allPokemons = await _repository.GetAllAsync();
        return allPokemons.Where(p =>
        {
            if (p.EvolutionChain?.Chain == null || !p.EvolutionChain.Chain.Any())
                return false;

            var evolutionEntry = p.EvolutionChain.Chain
                .FirstOrDefault(e => string.Equals(e.Name, p.NameEn, StringComparison.OrdinalIgnoreCase));

            return evolutionEntry?.Level == 0;
        }).ToList();
    }

    public async Task<List<string>> GetCensoredDescriptionAsync(string id)
    {
        var pokemon = await GetPokemonByIdAsync(id);
        if (pokemon.Description == null || !pokemon.Description.Any())
            return new List<string>();

        var nameFr = pokemon.NameFr?.Trim() ?? string.Empty;

        return pokemon.Description.Select(desc =>
        {
            if (string.IsNullOrWhiteSpace(nameFr))
                return desc;
            return System.Text.RegularExpressions.Regex.Replace(
                desc,
                System.Text.RegularExpressions.Regex.Escape(nameFr),
                "***",
                System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        }).ToList();
    }

    public async Task<PokemonHints> GetPokemonHintsAsync(string id)
    {
        var pokemon = await GetPokemonByIdAsync(id);

        return new PokemonHints
        {
            Category = pokemon.Category,
            Generation = pokemon.Generation,
            Region = pokemon.Region,
            Types = pokemon.Types,
            Status = pokemon.Status,
            Breeding = pokemon.Breeding,
            Physical = pokemon.Physical,
            Abilities = pokemon.Abilities,
            Stats = pokemon.Stats,
            Sprites = pokemon.Sprites,
            Cries = pokemon.Cries,
            EvolutionChainCount = pokemon.EvolutionChain?.Count ?? 1
        };
    }

    public async Task<string> GetPokemonNameFrAsync(string id)
    {
        var pokemon = await GetPokemonByIdAsync(id);
        return pokemon.NameFr;
    }

    public async Task<Pokemon?> GetPokemonByNameAsync(string nameFr)
    {
    var allPokemons = await _repository.GetAllAsync();
    // Recherche insensible à la casse et aux espaces superflus
    return allPokemons.FirstOrDefault(p => 
        string.Equals(p.NameFr?.Trim(), nameFr?.Trim(), StringComparison.OrdinalIgnoreCase));
    }
}

