using Xunit;
using Moq;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Services;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;
using PokéDesc.Tests.Helpers;

namespace PokéDesc.Tests.Services;

/// <summary>
/// Tests unitaires pour PartieService.
/// IPokemonService est mocké pour isoler la logique de la partie.
/// </summary>
public class PartieServiceTests
{
    private readonly Mock<IPokemonService> _pokemonServiceMock;
    private readonly PartieService _service;

    public PartieServiceTests()
    {
        _pokemonServiceMock = new Mock<IPokemonService>();
        _service = new PartieService(_pokemonServiceMock.Object);

        // Setup par défaut pour les appels dans StartGameAsync
        var allPokemons = TestDataFactory.CreateAllPokemons()
            .Where(p => p.Description.Any())
            .ToList();

        _pokemonServiceMock
            .Setup(s => s.GetAllPokemonsAsync())
            .ReturnsAsync(allPokemons);

        _pokemonServiceMock
            .Setup(s => s.GetLegendaryOrMythicalPokemonsAsync())
            .ReturnsAsync(allPokemons.Where(p => p.Status.IsLegendary || p.Status.IsMythical).ToList());
    }

    // ─────────────────────────────────────────────
    // CreateGameAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task CreateGameAsync_ReturnsPartieWithCorrectDresseur()
    {
        var partie = await _service.CreateGameAsync("dresseur-1");

        Assert.NotNull(partie);
        Assert.Equal("dresseur-1", partie.Dresseur1Id);
    }

    [Fact]
    public async Task CreateGameAsync_ReturnsPartieWithStatusEnAttente()
    {
        var partie = await _service.CreateGameAsync("dresseur-1");

        Assert.Equal("EnAttente", partie.Statut);
    }

    [Fact]
    public async Task CreateGameAsync_GeneratesUniquePartieId()
    {
        var partie1 = await _service.CreateGameAsync("dresseur-1");
        var partie2 = await _service.CreateGameAsync("dresseur-2");

        Assert.NotEqual(partie1.Id, partie2.Id);
    }

    [Fact]
    public async Task CreateGameAsync_GeneratesNonEmptyCodeSession()
    {
        var partie = await _service.CreateGameAsync("dresseur-1");

        Assert.False(string.IsNullOrWhiteSpace(partie.CodeSession));
    }

    // ─────────────────────────────────────────────
    // GetGameAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetGameAsync_WithValidId_ReturnsPartie()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var retrieved = await _service.GetGameAsync(created.Id);

        Assert.Equal(created.Id, retrieved.Id);
    }

    [Fact]
    public async Task GetGameAsync_WithUnknownId_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetGameAsync("id-inexistant"));
    }

    // ─────────────────────────────────────────────
    // JoinGameAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task JoinGameAsync_WithValidCode_ReturnsPartieWithDresseur2()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var joined = await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        Assert.Equal("dresseur-2", joined.Dresseur2Id);
    }

    [Fact]
    public async Task JoinGameAsync_WithValidCode_UpdatesStatusToPret()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var joined = await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        Assert.Equal("Prêt", joined.Statut);
    }

    [Fact]
    public async Task JoinGameAsync_WithInvalidCode_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.JoinGameAsync("CODE-INEXISTANT", "dresseur-2"));
    }

    [Fact]
    public async Task JoinGameAsync_WhenGameAlreadyFull_ThrowsArgumentException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.JoinGameAsync(created.CodeSession, "dresseur-3"));
    }

    [Fact]
    public async Task JoinGameAsync_CaseInsensitiveCode_Succeeds()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        var lowerCode = created.CodeSession.ToLower();

        var joined = await _service.JoinGameAsync(lowerCode, "dresseur-2");

        Assert.Equal("dresseur-2", joined.Dresseur2Id);
    }

    // ─────────────────────────────────────────────
    // StartGameAsync — Mode Standard
    // ─────────────────────────────────────────────

    [Fact]
    public async Task StartGameAsync_StandardMode_SetsStatusEnCours()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var started = await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);

        Assert.Equal("EnCours", started.Statut);
    }

    [Fact]
    public async Task StartGameAsync_StandardMode_AssignsPokemonsToGuess()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var started = await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 2);

        Assert.Equal(2, started.PokemonsToGuess.Count);
    }

    [Fact]
    public async Task StartGameAsync_WithUnknownMode_ThrowsArgumentException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.StartGameAsync(created.Id, "ModeInconnu", isSolo: true));
    }

    // ─────────────────────────────────────────────
    // UseHintAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task UseHintAsync_AddsHintToUsedHints()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);

        await _service.UseHintAsync(created.Id, "dresseur-1", "Type1");

        var partie = await _service.GetGameAsync(created.Id);
        Assert.Contains("Type1", partie.UsedHintsJ1);
    }

    [Fact]
    public async Task UseHintAsync_WithUnknownHintType_ThrowsArgumentException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.UseHintAsync(created.Id, "dresseur-1", "IndiceInexistant"));
    }

    [Fact]
    public async Task UseHintAsync_SameHintTwice_AddedOnlyOnce()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);

        await _service.UseHintAsync(created.Id, "dresseur-1", "Category");
        await _service.UseHintAsync(created.Id, "dresseur-1", "Category");

        var partie = await _service.GetGameAsync(created.Id);
        Assert.Single(partie.UsedHintsJ1.Where(h => h == "Category"));
    }

    // ─────────────────────────────────────────────
    // SubmitGuessAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task SubmitGuessAsync_CorrectAnswer_ReturnsIsCorrectTrue()
    {
        var pokemon = TestDataFactory.CreateBulbizarre();
        _pokemonServiceMock.Setup(s => s.GetAllPokemonsAsync()).ReturnsAsync(new List<Pokemon> { pokemon });
        _pokemonServiceMock.Setup(s => s.GetLegendaryOrMythicalPokemonsAsync()).ReturnsAsync(new List<Pokemon>());

        var created = await _service.CreateGameAsync("dresseur-1");
        var started = await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);

        // Force the specific pokemon to guess
        started.PokemonsToGuess = new List<Pokemon> { pokemon };

        var result = await _service.SubmitGuessAsync(created.Id, "dresseur-1", "Bulbizarre");

        Assert.True(result.IsCorrect);
        Assert.True(result.IsTurnFinished);
    }

    [Fact]
    public async Task SubmitGuessAsync_WrongAnswer_ReturnsIsCorrectFalse()
    {
        var pokemon = TestDataFactory.CreateBulbizarre();
        _pokemonServiceMock.Setup(s => s.GetAllPokemonsAsync()).ReturnsAsync(new List<Pokemon> { pokemon });
        _pokemonServiceMock.Setup(s => s.GetLegendaryOrMythicalPokemonsAsync()).ReturnsAsync(new List<Pokemon>());
        _pokemonServiceMock.Setup(s => s.GetPokemonByNameAsync(It.IsAny<string>())).ReturnsAsync((Pokemon?)null);

        var created = await _service.CreateGameAsync("dresseur-1");
        var started = await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);
        started.PokemonsToGuess = new List<Pokemon> { pokemon };

        var result = await _service.SubmitGuessAsync(created.Id, "dresseur-1", "Pikachu");

        Assert.False(result.IsCorrect);
        Assert.False(result.IsTurnFinished);
    }

    [Fact]
    public async Task SubmitGuessAsync_ThreeWrongAnswers_TurnIsFinished()
    {
        var pokemon = TestDataFactory.CreateBulbizarre();
        _pokemonServiceMock.Setup(s => s.GetAllPokemonsAsync()).ReturnsAsync(new List<Pokemon> { pokemon });
        _pokemonServiceMock.Setup(s => s.GetLegendaryOrMythicalPokemonsAsync()).ReturnsAsync(new List<Pokemon>());
        _pokemonServiceMock.Setup(s => s.GetPokemonByNameAsync(It.IsAny<string>())).ReturnsAsync((Pokemon?)null);

        var created = await _service.CreateGameAsync("dresseur-1");
        var started = await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);
        started.PokemonsToGuess = new List<Pokemon> { pokemon };

        await _service.SubmitGuessAsync(created.Id, "dresseur-1", "Pikachu");
        await _service.SubmitGuessAsync(created.Id, "dresseur-1", "Pikachu");
        var result = await _service.SubmitGuessAsync(created.Id, "dresseur-1", "Pikachu");

        Assert.True(result.IsTurnFinished);
        Assert.False(result.IsCorrect);
    }

    [Fact]
    public async Task SubmitGuessAsync_CorrectAnswer_EarnsPoints()
    {
        var pokemon = TestDataFactory.CreateBulbizarre();
        _pokemonServiceMock.Setup(s => s.GetAllPokemonsAsync()).ReturnsAsync(new List<Pokemon> { pokemon });
        _pokemonServiceMock.Setup(s => s.GetLegendaryOrMythicalPokemonsAsync()).ReturnsAsync(new List<Pokemon>());

        var created = await _service.CreateGameAsync("dresseur-1");
        var started = await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1);
        started.PokemonsToGuess = new List<Pokemon> { pokemon };

        var result = await _service.SubmitGuessAsync(created.Id, "dresseur-1", "Bulbizarre");

        Assert.True(result.PointsEarned > 0);
    }

    // ─────────────────────────────────────────────
    // ResetTimer
    // ─────────────────────────────────────────────

    [Fact]
    public async Task ResetTimer_ForJ1_ResetsTimeRemaining()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.StartGameAsync(created.Id, "Standard", isSolo: true, nbPokemons: 1, timerDuration: 60);

        // Simulate time passing by reducing timer
        var partie = await _service.GetGameAsync(created.Id);
        partie.TimeRemainingJ1 = 10;

        _service.ResetTimer(created.Id, "dresseur-1");

        var updated = await _service.GetGameAsync(created.Id);
        Assert.Equal(60, updated.TimeRemainingJ1, precision: 1);
    }

    // ─────────────────────────────────────────────
    // UpdateGameSettingsAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateGameSettingsAsync_UpdatesNbPokemons()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var updated = await _service.UpdateGameSettingsAsync(created.Id, nbPokemons: 5, generations: null, timerDuration: null);

        Assert.Equal(5, updated.NbPokemons);
    }
}
