using Xunit;
using PokéDesc.Business.Services;
using PokéDesc.Data.Repositories;
using PokéDesc.Tests.Helpers;

namespace PokéDesc.Tests.Services;

/// <summary>
/// Tests unitaires pour PokemonService.
/// Utilise un PokemonRepository pointant vers des données JSON de test minimales.
/// </summary>
public class PokemonServiceTests
{
    private readonly PokemonService _service;

    public PokemonServiceTests()
    {
        var repository = new PokemonRepository(TestDataFactory.TestDataPath);
        _service = new PokemonService(repository);
    }

    // ─────────────────────────────────────────────
    // GetAllPokemonsAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetAllPokemonsAsync_ReturnsAllPokemons()
    {
        var result = await _service.GetAllPokemonsAsync();

        Assert.Equal(4, result.Count);
    }

    [Fact]
    public async Task GetAllPokemonsAsync_ReturnsOrderedByPokedexNumber()
    {
        var result = await _service.GetAllPokemonsAsync();

        Assert.Equal(1, result[0].PokedexNumber);
        Assert.Equal(4, result[1].PokedexNumber);
        Assert.Equal(150, result[2].PokedexNumber);
        Assert.Equal(151, result[3].PokedexNumber);
    }

    // ─────────────────────────────────────────────
    // GetPokemonByIdAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonByIdAsync_WithValidId_ReturnsPokemon()
    {
        var result = await _service.GetPokemonByIdAsync("1");

        Assert.NotNull(result);
        Assert.Equal("Bulbizarre", result.NameFr);
    }

    [Fact]
    public async Task GetPokemonByIdAsync_WithNumericStringId_ReturnsPokemon()
    {
        var result = await _service.GetPokemonByIdAsync("150");

        Assert.Equal("Mewtwo", result.NameFr);
    }

    [Fact]
    public async Task GetPokemonByIdAsync_WithUnknownId_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetPokemonByIdAsync("999"));
    }

    // ─────────────────────────────────────────────
    // GetPokemonByPokedexNumberAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonByPokedexNumberAsync_WithValidNumber_ReturnsPokemon()
    {
        var result = await _service.GetPokemonByPokedexNumberAsync(4);

        Assert.Equal("Salamèche", result.NameFr);
    }

    [Fact]
    public async Task GetPokemonByPokedexNumberAsync_WithUnknownNumber_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetPokemonByPokedexNumberAsync(999));
    }

    // ─────────────────────────────────────────────
    // GetLegendaryPokemonsAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetLegendaryPokemonsAsync_ReturnsOnlyLegendaries()
    {
        var result = await _service.GetLegendaryPokemonsAsync();

        Assert.Single(result);
        Assert.Equal("Mewtwo", result[0].NameFr);
    }

    // ─────────────────────────────────────────────
    // GetMythicalPokemonsAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetMythicalPokemonsAsync_ReturnsOnlyMythicals()
    {
        var result = await _service.GetMythicalPokemonsAsync();

        Assert.Single(result);
        Assert.Equal("Mew", result[0].NameFr);
    }

    // ─────────────────────────────────────────────
    // GetLegendaryOrMythicalPokemonsAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetLegendaryOrMythicalPokemonsAsync_ReturnsBothLegendaryAndMythical()
    {
        var result = await _service.GetLegendaryOrMythicalPokemonsAsync();

        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.NameFr == "Mewtwo");
        Assert.Contains(result, p => p.NameFr == "Mew");
    }

    // ─────────────────────────────────────────────
    // GetPokemonsByTypeAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonsByTypeAsync_ReturnsPokemonsWithMatchingType()
    {
        var result = await _service.GetPokemonsByTypeAsync("Psy");

        Assert.Equal(2, result.Count);
        Assert.All(result, p => Assert.True(p.Types.Any(t => t.Name == "Psy")));
    }

    [Fact]
    public async Task GetPokemonsByTypeAsync_WithUnknownType_ReturnsEmptyList()
    {
        var result = await _service.GetPokemonsByTypeAsync("TypeInexistant");

        Assert.Empty(result);
    }

    // ─────────────────────────────────────────────
    // GetPokemonsByGenerationAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonsByGenerationAsync_ReturnsPokemonsInGeneration()
    {
        var result = await _service.GetPokemonsByGenerationAsync("generation-i");

        Assert.Equal(4, result.Count);
    }

    // ─────────────────────────────────────────────
    // GetCensoredDescriptionAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetCensoredDescriptionAsync_CensorsThePokemonName()
    {
        var result = await _service.GetCensoredDescriptionAsync("1");

        Assert.Single(result);
        Assert.DoesNotContain("Bulbizarre", result[0]);
        Assert.Contains("***", result[0]);
    }

    [Fact]
    public async Task GetCensoredDescriptionAsync_WithUnknownId_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetCensoredDescriptionAsync("999"));
    }

    // ─────────────────────────────────────────────
    // GetPokemonHintsAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonHintsAsync_ReturnsHintsWithCorrectData()
    {
        var result = await _service.GetPokemonHintsAsync("1");

        Assert.NotNull(result);
        Assert.Equal("Pokémon Graine", result.Category);
        Assert.NotNull(result.Physical);
        Assert.Equal(0.7, result.Physical.HeightM);
    }

    [Fact]
    public async Task GetPokemonHintsAsync_WithUnknownId_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetPokemonHintsAsync("999"));
    }

    // ─────────────────────────────────────────────
    // GetPokemonNameFrAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonNameFrAsync_ReturnsCorrectName()
    {
        var result = await _service.GetPokemonNameFrAsync("4");

        Assert.Equal("Salamèche", result);
    }

    // ─────────────────────────────────────────────
    // GetPokemonByNameAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonByNameAsync_WithValidName_ReturnsPokemon()
    {
        var result = await _service.GetPokemonByNameAsync("Bulbizarre");

        Assert.NotNull(result);
        Assert.Equal(1, result!.PokedexNumber);
    }

    [Fact]
    public async Task GetPokemonByNameAsync_IsCaseInsensitive()
    {
        var result = await _service.GetPokemonByNameAsync("bulbizarre");

        Assert.NotNull(result);
    }

    [Fact]
    public async Task GetPokemonByNameAsync_WithUnknownName_ReturnsNull()
    {
        var result = await _service.GetPokemonByNameAsync("Pikachu");

        Assert.Null(result);
    }

    // ─────────────────────────────────────────────
    // GetPokemonsPaginatedAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetPokemonsPaginatedAsync_ReturnsCorrectPage()
    {
        var (items, totalCount, totalPages) = await _service.GetPokemonsPaginatedAsync(page: 1, pageSize: 2);

        Assert.Equal(2, items.Count);
        Assert.Equal(4, totalCount);
        Assert.Equal(2, totalPages);
    }

    [Fact]
    public async Task GetPokemonsPaginatedAsync_SecondPage_ReturnsRemainingItems()
    {
        var (items, totalCount, _) = await _service.GetPokemonsPaginatedAsync(page: 2, pageSize: 2);

        Assert.Equal(2, items.Count);
        Assert.Equal(4, totalCount);
    }
}
