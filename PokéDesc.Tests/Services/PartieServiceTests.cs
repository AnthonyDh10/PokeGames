using Xunit;
using Moq;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Services;
using PokéDesc.Business.Strategies;
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

        IGameModeStrategy[] strategies =
        [
            new StandardModeStrategy(_pokemonServiceMock.Object),
            new TypesModeStrategy(),
            new DeZoomModeStrategy(),
        ];

        _service = new PartieService(_pokemonServiceMock.Object, new GameSessionStore(), strategies, Mock.Of<ILobbyNotifier>());

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
    public async Task CreateGameAsync_SetsCreatorAsHost()
    {
        var partie = await _service.CreateGameAsync("dresseur-1");

        Assert.NotNull(partie);
        Assert.Equal("dresseur-1", partie.HostId);
    }

    [Fact]
    public async Task CreateGameAsync_AddsSingleHostPlayer()
    {
        var partie = await _service.CreateGameAsync("dresseur-1", "Sacha");

        var player = Assert.Single(partie.Players);
        Assert.Equal("dresseur-1", player.DresseurId);
        Assert.Equal("Sacha", player.Name);
        Assert.Equal(PlayerRole.Host, player.Role);
    }

    [Fact]
    public async Task CreateGameAsync_ReturnsPartieWithStatusEnAttente()
    {
        var partie = await _service.CreateGameAsync("dresseur-1");

        Assert.Equal(PokéDesc.Domain.PartieStatut.EnAttente, partie.Statut);
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
    public async Task JoinGameAsync_WithValidCode_AddsGuestPlayer()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var joined = await _service.JoinGameAsync(created.CodeSession, "dresseur-2", "Régis");

        var guest = joined.GetPlayer("dresseur-2");
        Assert.NotNull(guest);
        Assert.Equal("Régis", guest!.Name);
        Assert.Equal(PlayerRole.Guest, guest.Role);
        Assert.Equal(2, joined.Players.Count);
    }

    [Fact]
    public async Task JoinGameAsync_WithValidCode_KeepsStatusEnAttente()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var joined = await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        Assert.Equal(PokéDesc.Domain.PartieStatut.EnAttente, joined.Statut);
    }

    [Fact]
    public async Task JoinGameAsync_WithInvalidCode_ThrowsKeyNotFoundException()
    {
        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.JoinGameAsync("CODE-INEXISTANT", "dresseur-2"));
    }

    [Fact]
    public async Task JoinGameAsync_UpToEightPlayers_Succeeds()
    {
        var created = await _service.CreateGameAsync("dresseur-1"); // hôte = 1 joueur

        for (int i = 2; i <= 8; i++)
            await _service.JoinGameAsync(created.CodeSession, $"dresseur-{i}");

        var partie = await _service.GetGameAsync(created.Id);
        Assert.Equal(8, partie.Players.Count);
    }

    [Fact]
    public async Task JoinGameAsync_WhenLobbyFull_ThrowsInvalidOperationException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        for (int i = 2; i <= 8; i++)
            await _service.JoinGameAsync(created.CodeSession, $"dresseur-{i}");

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.JoinGameAsync(created.CodeSession, "dresseur-9"));
    }

    [Fact]
    public async Task JoinGameAsync_SamePlayerTwice_IsIdempotent()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        var joined = await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        Assert.Equal(2, joined.Players.Count);
    }

    [Fact]
    public async Task JoinGameAsync_CaseInsensitiveCode_Succeeds()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        var lowerCode = created.CodeSession.ToLower();

        var joined = await _service.JoinGameAsync(lowerCode, "dresseur-2");

        Assert.NotNull(joined.GetPlayer("dresseur-2"));
    }

    // ─────────────────────────────────────────────
    // StartGameAsync — Mode Standard + autorisation hôte
    // ─────────────────────────────────────────────

    [Fact]
    public async Task StartGameAsync_StandardMode_SetsStatusEnCours()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var started = await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);

        Assert.Equal(PokéDesc.Domain.PartieStatut.EnCours, started.Statut);
    }

    [Fact]
    public async Task StartGameAsync_StandardMode_AssignsPokemonsToGuess()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var started = await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 2);

        Assert.Equal(2, started.PokemonsToGuess.Count);
    }

    [Fact]
    public async Task StartGameAsync_WithUnknownMode_ThrowsArgumentException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.StartGameAsync(created.Id, "dresseur-1", "ModeInconnu", isSolo: true));
    }

    [Fact]
    public async Task StartGameAsync_ByGuest_ThrowsUnauthorizedAccessException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.StartGameAsync(created.Id, "dresseur-2", "Standard", nbPokemons: 1));
    }

    // ─────────────────────────────────────────────
    // UseHintAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task UseHintAsync_AddsHintToUsedHints()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);

        await _service.UseHintAsync(created.Id, "dresseur-1", "Type1");

        var partie = await _service.GetGameAsync(created.Id);
        Assert.Contains("Type1", partie.GetPlayer("dresseur-1")!.State.UsedHints);
    }

    [Fact]
    public async Task UseHintAsync_WithUnknownHintType_ThrowsArgumentException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.UseHintAsync(created.Id, "dresseur-1", "IndiceInexistant"));
    }

    [Fact]
    public async Task UseHintAsync_SameHintTwice_AddedOnlyOnce()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);

        await _service.UseHintAsync(created.Id, "dresseur-1", "Category");
        await _service.UseHintAsync(created.Id, "dresseur-1", "Category");

        var partie = await _service.GetGameAsync(created.Id);
        Assert.Single(partie.GetPlayer("dresseur-1")!.State.UsedHints.Where(h => h == "Category"));
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
        var started = await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);

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
        var started = await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);
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
        var started = await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);
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
        var started = await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", isSolo: true, nbPokemons: 1);
        started.PokemonsToGuess = new List<Pokemon> { pokemon };

        var result = await _service.SubmitGuessAsync(created.Id, "dresseur-1", "Bulbizarre");

        Assert.True(result.PointsEarned > 0);
    }

    // ─────────────────────────────────────────────
    // UpdateGameSettingsAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task UpdateGameSettingsAsync_ByHost_UpdatesNbPokemons()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        var updated = await _service.UpdateGameSettingsAsync(created.Id, "dresseur-1", nbPokemons: 5, generations: null, timerDuration: null);

        Assert.Equal(5, updated.NbPokemons);
    }

    [Fact]
    public async Task UpdateGameSettingsAsync_ByGuest_ThrowsUnauthorizedAccessException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.UpdateGameSettingsAsync(created.Id, "dresseur-2", nbPokemons: 5, generations: null, timerDuration: null));
    }

    // ─────────────────────────────────────────────
    // KickPlayerAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task KickPlayerAsync_ByHost_RemovesTarget()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        var partie = await _service.KickPlayerAsync(created.Id, "dresseur-1", "dresseur-2");

        Assert.Null(partie.GetPlayer("dresseur-2"));
        Assert.Single(partie.Players);
    }

    [Fact]
    public async Task KickPlayerAsync_ByGuest_ThrowsUnauthorizedAccessException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-3");

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            _service.KickPlayerAsync(created.Id, "dresseur-2", "dresseur-3"));
    }

    [Fact]
    public async Task KickPlayerAsync_HostKicksSelf_ThrowsArgumentException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _service.KickPlayerAsync(created.Id, "dresseur-1", "dresseur-1"));
    }

    [Fact]
    public async Task KickPlayerAsync_UnknownTarget_ThrowsKeyNotFoundException()
    {
        var created = await _service.CreateGameAsync("dresseur-1");

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.KickPlayerAsync(created.Id, "dresseur-1", "fantome"));
    }

    // ─────────────────────────────────────────────
    // LeaveGameAsync — promotion d'hôte
    // ─────────────────────────────────────────────

    [Fact]
    public async Task LeaveGameAsync_HostLeaves_PromotesNextPlayer()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-3");

        var partie = await _service.LeaveGameAsync(created.Id, "dresseur-1");

        Assert.Null(partie.GetPlayer("dresseur-1"));
        Assert.Equal("dresseur-2", partie.HostId);
        Assert.Equal(PlayerRole.Host, partie.GetPlayer("dresseur-2")!.Role);
    }

    [Fact]
    public async Task LeaveGameAsync_GuestLeaves_HostUnchanged()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        var partie = await _service.LeaveGameAsync(created.Id, "dresseur-2");

        Assert.Equal("dresseur-1", partie.HostId);
        Assert.Single(partie.Players);
    }

    // ─────────────────────────────────────────────
    // MarkRematchReadyAsync
    // ─────────────────────────────────────────────

    [Fact]
    public async Task MarkRematchReadyAsync_AllPlayersReady_CreatesRematch()
    {
        var pokemon = TestDataFactory.CreateBulbizarre();
        _pokemonServiceMock.Setup(s => s.GetAllPokemonsAsync()).ReturnsAsync(new List<Pokemon> { pokemon });
        _pokemonServiceMock.Setup(s => s.GetLegendaryOrMythicalPokemonsAsync()).ReturnsAsync(new List<Pokemon>());

        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");
        await _service.StartGameAsync(created.Id, "dresseur-1", "Standard", nbPokemons: 1);

        await _service.MarkRematchReadyAsync(created.Id, "dresseur-1");
        var status = await _service.MarkRematchReadyAsync(created.Id, "dresseur-2");

        Assert.True(status.Player1Ready);
        Assert.True(status.Player2Ready);
        Assert.False(string.IsNullOrEmpty(status.RematchPartieId));
    }

    [Fact]
    public async Task MarkRematchReadyAsync_OnlyOneReady_DoesNotCreateRematch()
    {
        var created = await _service.CreateGameAsync("dresseur-1");
        await _service.JoinGameAsync(created.CodeSession, "dresseur-2");

        var status = await _service.MarkRematchReadyAsync(created.Id, "dresseur-1");

        Assert.True(status.Player1Ready);
        Assert.False(status.Player2Ready);
        Assert.True(string.IsNullOrEmpty(status.RematchPartieId));
    }
}
