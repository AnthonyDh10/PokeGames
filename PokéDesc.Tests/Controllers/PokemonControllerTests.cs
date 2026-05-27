using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PokéDesc.API.Controllers;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Domain.Models;
using PokéDesc.Tests.Helpers;

namespace PokéDesc.Tests.Controllers;

/// <summary>
/// Tests unitaires pour PokemonController.
/// </summary>
public class PokemonControllerTests
{
    private readonly Mock<IPokemonService> _serviceMock;
    private readonly PokemonController _controller;

    public PokemonControllerTests()
    {
        _serviceMock = new Mock<IPokemonService>();
        _controller = new PokemonController(_serviceMock.Object);
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon (sans pagination)
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetAll_WithoutPagination_Returns200WithAllPokemons()
    {
        var pokemons = TestDataFactory.CreateAllPokemons();
        _serviceMock.Setup(s => s.GetAllPokemonsAsync()).ReturnsAsync(pokemons);

        var result = await _controller.GetAll(page: null, pageSize: null);

        var ok = Assert.IsType<OkObjectResult>(result);
        var data = Assert.IsAssignableFrom<List<Pokemon>>(ok.Value);
        Assert.Equal(4, data.Count);
    }

    [Fact]
    public async Task GetAll_WithPagination_Returns200WithPaginatedResult()
    {
        var pokemons = TestDataFactory.CreateAllPokemons().Take(2).ToList();
        _serviceMock
            .Setup(s => s.GetPokemonsPaginatedAsync(1, 2))
            .ReturnsAsync((pokemons, 4, 2));

        var result = await _controller.GetAll(page: 1, pageSize: 2);

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetAll_WhenServiceThrows_PropagatesException()
    {
        _serviceMock.Setup(s => s.GetAllPokemonsAsync()).ThrowsAsync(new Exception("DB error"));

        await Assert.ThrowsAsync<Exception>(() => _controller.GetAll(page: null, pageSize: null));
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon/type/{typeName}
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetByType_Returns200WithMatchingPokemons()
    {
        var psychicList = new List<Pokemon> { TestDataFactory.CreateMewtwo(), TestDataFactory.CreateMew() };
        _serviceMock.Setup(s => s.GetPokemonsByTypeAsync("Psy")).ReturnsAsync(psychicList);

        var result = await _controller.GetByType("Psy");

        var ok = Assert.IsType<OkObjectResult>(result);
        var data = Assert.IsAssignableFrom<List<Pokemon>>(ok.Value);
        Assert.Equal(2, data.Count);
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon/legendary
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetLegendary_Returns200WithLegendaries()
    {
        _serviceMock.Setup(s => s.GetLegendaryPokemonsAsync())
            .ReturnsAsync(new List<Pokemon> { TestDataFactory.CreateMewtwo() });

        var result = await _controller.GetLegendary();

        var ok = Assert.IsType<OkObjectResult>(result);
        var data = Assert.IsAssignableFrom<List<Pokemon>>(ok.Value);
        Assert.Single(data);
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon/mythical
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetMythical_Returns200WithMythicals()
    {
        _serviceMock.Setup(s => s.GetMythicalPokemonsAsync())
            .ReturnsAsync(new List<Pokemon> { TestDataFactory.CreateMew() });

        var result = await _controller.GetMythical();

        var ok = Assert.IsType<OkObjectResult>(result);
        var data = Assert.IsAssignableFrom<List<Pokemon>>(ok.Value);
        Assert.Single(data);
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon/legendary-mythical
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetLegendaryOrMythical_Returns200WithBoth()
    {
        _serviceMock.Setup(s => s.GetLegendaryOrMythicalPokemonsAsync())
            .ReturnsAsync(new List<Pokemon> { TestDataFactory.CreateMewtwo(), TestDataFactory.CreateMew() });

        var result = await _controller.GetLegendaryOrMythical();

        var ok = Assert.IsType<OkObjectResult>(result);
        var data = Assert.IsAssignableFrom<List<Pokemon>>(ok.Value);
        Assert.Equal(2, data.Count);
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon/{id}/censored-description
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetCensoredDescription_WithValidId_Returns200()
    {
        _serviceMock.Setup(s => s.GetCensoredDescriptionAsync("1"))
            .ReturnsAsync(new List<string> { "*** a une graine sur le dos depuis sa naissance." });

        var result = await _controller.GetCensoredDescription("1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetCensoredDescription_WithUnknownId_ThrowsKeyNotFoundException()
    {
        _serviceMock.Setup(s => s.GetCensoredDescriptionAsync("999"))
            .ThrowsAsync(new KeyNotFoundException("Pokemon 999 introuvable"));

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _controller.GetCensoredDescription("999"));
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon/{id}/hints
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetHints_WithValidId_Returns200()
    {
        var hints = new PokemonHints { Category = "Pokémon Graine" };
        _serviceMock.Setup(s => s.GetPokemonHintsAsync("1")).ReturnsAsync(hints);

        var result = await _controller.GetHints("1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(ok.Value);
    }

    [Fact]
    public async Task GetHints_WithUnknownId_ThrowsKeyNotFoundException()
    {
        _serviceMock.Setup(s => s.GetPokemonHintsAsync("999"))
            .ThrowsAsync(new KeyNotFoundException("Pokemon 999 introuvable"));

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _controller.GetHints("999"));
    }

    // ─────────────────────────────────────────────
    // GET /api/pokemon/base-evolution
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetBaseEvolution_Returns200()
    {
        _serviceMock.Setup(s => s.GetBaseEvolutionPokemonsAsync())
            .ReturnsAsync(new List<Pokemon> { TestDataFactory.CreateBulbizarre() });

        var result = await _controller.GetBaseEvolution();

        Assert.IsType<OkObjectResult>(result);
    }
}
