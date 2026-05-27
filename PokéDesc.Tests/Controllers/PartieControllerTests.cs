using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using PokéDesc.API.Controllers;
using PokéDesc.API.DTOs;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Domain;
using PokéDesc.Tests.Helpers;

namespace PokéDesc.Tests.Controllers;

/// <summary>
/// Tests unitaires pour PartieController.
/// </summary>
public class PartieControllerTests
{
    private readonly Mock<IPartieService> _serviceMock;
    private readonly PartieController _controller;

    public PartieControllerTests()
    {
        _serviceMock = new Mock<IPartieService>();
        _controller = new PartieController(_serviceMock.Object);
    }

    private static Partie CreateTestPartie(string id = "partie-1", string dresseur1 = "d1") => new()
    {
        Id = id,
        CodeSession = "ABC123",
        Dresseur1Id = dresseur1,
        Statut = PokéDesc.Domain.PartieStatut.EnAttente,
    };

    // ─────────────────────────────────────────────
    // POST /api/partie/create
    // ─────────────────────────────────────────────

    [Fact]
    public async Task CreateGame_Returns200WithPartie()
    {
        var partie = CreateTestPartie();
        _serviceMock.Setup(s => s.CreateGameAsync("d1")).ReturnsAsync(partie);

        var result = await _controller.CreateGame(new CreateGameRequest { DresseurId = "d1" });

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<PartieResponseDto>(ok.Value);
        Assert.Equal(partie.Id, dto.Id);
        Assert.Equal(partie.Dresseur1Id, dto.Dresseur1Id);
    }

    // ─────────────────────────────────────────────
    // POST /api/partie/join
    // ─────────────────────────────────────────────

    [Fact]
    public async Task JoinGame_WithValidCode_Returns200()
    {
        var partie = CreateTestPartie();
        _serviceMock.Setup(s => s.JoinGameAsync("ABC123", "d2")).ReturnsAsync(partie);

        var result = await _controller.JoinGame(new JoinGameRequest { CodeSession = "ABC123", DresseurId = "d2" });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task JoinGame_WithInvalidCode_ThrowsKeyNotFoundException()
    {
        _serviceMock.Setup(s => s.JoinGameAsync("BAD", "d2"))
            .ThrowsAsync(new KeyNotFoundException("Partie introuvable"));

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _controller.JoinGame(new JoinGameRequest { CodeSession = "BAD", DresseurId = "d2" }));
    }

    // ─────────────────────────────────────────────
    // GET /api/partie/{partieId}
    // ─────────────────────────────────────────────

    [Fact]
    public async Task GetGame_WithValidId_Returns200()
    {
        var partie = CreateTestPartie();
        _serviceMock.Setup(s => s.GetGameAsync("partie-1")).ReturnsAsync(partie);

        var result = await _controller.GetGame("partie-1");

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<PartieResponseDto>(ok.Value);
        Assert.Equal(partie.Id, dto.Id);
    }

    [Fact]
    public async Task GetGame_WithUnknownId_ThrowsKeyNotFoundException()
    {
        _serviceMock.Setup(s => s.GetGameAsync("inexistant"))
            .ThrowsAsync(new KeyNotFoundException("Partie introuvable"));

        await Assert.ThrowsAsync<KeyNotFoundException>(() => _controller.GetGame("inexistant"));
    }

    // ─────────────────────────────────────────────
    // POST /api/partie/{partieId}/guess
    // ─────────────────────────────────────────────

    [Fact]
    public async Task SubmitGuess_Returns200WithResult()
    {
        var updatedGame = CreateTestPartie();
        var guessResult = new GuessResult { IsCorrect = true, Message = "Bravo !", PointsEarned = 100, UpdatedGame = updatedGame };
        _serviceMock.Setup(s => s.SubmitGuessAsync("partie-1", "d1", "Bulbizarre"))
            .ReturnsAsync(guessResult);

        var result = await _controller.SubmitGuess("partie-1",
            new SubmitGuessRequest { DresseurId = "d1", PokemonName = "Bulbizarre" });

        var ok = Assert.IsType<OkObjectResult>(result);
        var dto = Assert.IsType<GuessResultDto>(ok.Value);
        Assert.True(dto.IsCorrect);
        Assert.Equal("Bravo !", dto.Message);
        Assert.Equal(100, dto.PointsEarned);
        Assert.Equal(updatedGame.Id, dto.UpdatedGame.Id);
    }

    [Fact]
    public async Task SubmitGuess_WithUnknownPartie_ThrowsKeyNotFoundException()
    {
        _serviceMock.Setup(s => s.SubmitGuessAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new KeyNotFoundException("Partie introuvable"));

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _controller.SubmitGuess("inexistant",
                new SubmitGuessRequest { DresseurId = "d1", PokemonName = "Bulbizarre" }));
    }

    // ─────────────────────────────────────────────
    // POST /api/partie/{partieId}/hint
    // ─────────────────────────────────────────────

    [Fact]
    public async Task UseHint_Returns200WithUpdatedPartie()
    {
        var partie = CreateTestPartie();
        _serviceMock.Setup(s => s.UseHintAsync("partie-1", "d1", "Type1")).ReturnsAsync(partie);

        var result = await _controller.UseHint("partie-1",
            new UseHintRequest { DresseurId = "d1", HintType = "Type1" });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task UseHint_WithUnknownHintType_ThrowsArgumentException()
    {
        _serviceMock.Setup(s => s.UseHintAsync(It.IsAny<string>(), It.IsAny<string>(), "Inconnu"))
            .ThrowsAsync(new ArgumentException("Type d'indice inconnu"));

        await Assert.ThrowsAsync<ArgumentException>(
            () => _controller.UseHint("partie-1",
                new UseHintRequest { DresseurId = "d1", HintType = "Inconnu" }));
    }

    [Fact]
    public async Task UseHint_WithUnknownPartie_ThrowsKeyNotFoundException()
    {
        _serviceMock.Setup(s => s.UseHintAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ThrowsAsync(new KeyNotFoundException("Partie introuvable"));

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _controller.UseHint("inexistant",
                new UseHintRequest { DresseurId = "d1", HintType = "Type1" }));
    }

    // ─────────────────────────────────────────────
    // POST /api/partie/{partieId}/start
    // ─────────────────────────────────────────────

    [Fact]
    public async Task StartGame_Returns200WithStartedPartie()
    {
        var partie = CreateTestPartie();
        partie.Statut = PokéDesc.Domain.PartieStatut.EnCours;
        _serviceMock.Setup(s => s.StartGameAsync("partie-1", "Standard", true, 1, null, 60))
            .ReturnsAsync(partie);

        var result = await _controller.StartGame("partie-1", new StartGameRequest
        {
            Mode = "Standard",
            IsSolo = true,
            NbPokemons = 1,
            TimerDuration = 60,
        });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public async Task StartGame_WithUnknownMode_ThrowsArgumentException()
    {
        _serviceMock.Setup(s => s.StartGameAsync(It.IsAny<string>(), "ModeInconnu",
                It.IsAny<bool>(), It.IsAny<int>(), It.IsAny<List<int>?>(), It.IsAny<int>()))
            .ThrowsAsync(new ArgumentException("Mode inconnu"));

        await Assert.ThrowsAsync<ArgumentException>(
            () => _controller.StartGame("partie-1", new StartGameRequest { Mode = "ModeInconnu" }));
    }

    // ─────────────────────────────────────────────
    // GET /api/partie/{partieId}/timer/{dresseurId}
    // ─────────────────────────────────────────────

    [Fact]
    public void GetRemainingTime_Returns200WithTimerData()
    {
        _serviceMock.Setup(s => s.GetRemainingTime("partie-1", "d1")).Returns(45.5);
        _serviceMock.Setup(s => s.GetTimerDuration("partie-1")).Returns(60);

        var result = _controller.GetRemainingTime("partie-1", "d1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void GetRemainingTime_WhenServiceThrows_PropagatesException()
    {
        _serviceMock.Setup(s => s.GetRemainingTime(It.IsAny<string>(), It.IsAny<string>()))
            .Throws(new Exception("Partie introuvable"));

        Assert.Throws<Exception>(() => _controller.GetRemainingTime("inexistant", "d1"));
    }

    // ─────────────────────────────────────────────
    // POST /api/partie/{partieId}/timer/reset
    // ─────────────────────────────────────────────

    [Fact]
    public void ResetTimer_Returns200()
    {
        _serviceMock.Setup(s => s.ResetTimer("partie-1", "d1"));

        var result = _controller.ResetTimer("partie-1", new ResetTimerRequest { DresseurId = "d1" });

        Assert.IsType<OkResult>(result);
    }

    // ─────────────────────────────────────────────
    // POST /api/partie/{partieId}/rematch-ready
    // ─────────────────────────────────────────────

    [Fact]
    public async Task MarkRematchReady_WithValidDresseurId_Returns200()
    {
        var status = new RematchStatusDto { Player1Ready = true, Player2Ready = false };
        _serviceMock.Setup(s => s.MarkRematchReadyAsync("partie-1", "d1")).ReturnsAsync(status);

        var result = await _controller.MarkRematchReady("partie-1", new MarkRematchReadyRequest { DresseurId = "d1" });

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(status, ok.Value);
    }

    [Fact]
    public async Task MarkRematchReady_WithEmptyDresseurId_ThrowsArgumentException()
    {
        _serviceMock.Setup(s => s.MarkRematchReadyAsync("partie-1", ""))
            .ThrowsAsync(new ArgumentException("dresseurId est requis."));

        await Assert.ThrowsAsync<ArgumentException>(
            () => _controller.MarkRematchReady("partie-1", new MarkRematchReadyRequest { DresseurId = "" }));
    }
}
