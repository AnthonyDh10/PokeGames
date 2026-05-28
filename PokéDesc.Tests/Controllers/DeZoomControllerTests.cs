using Xunit;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PokéDesc.API.Controllers;
using PokéDesc.API.DTOs;
using PokéDesc.Business.Interfaces;

namespace PokéDesc.Tests.Controllers;

/// <summary>
/// Tests unitaires pour DeZoomController.
/// </summary>
public class DeZoomControllerTests
{
    private readonly Mock<IDeZoomService> _deZoomServiceMock;
    private readonly DeZoomController _controller;

    public DeZoomControllerTests()
    {
        _deZoomServiceMock = new Mock<IDeZoomService>();
        _controller = new DeZoomController(_deZoomServiceMock.Object);
    }

    // ─────────────────────────────────────────────
    // GET /api/dezoom/{partieId}
    // ─────────────────────────────────────────────

    [Fact]
    public void GetGame_WithDresseurId_Returns200()
    {
        _deZoomServiceMock.Setup(s => s.GetOrCreateGame("partie-1", "d1", null))
            .Returns(new DeZoomGameDto());

        var result = _controller.GetGame("partie-1", "d1", null);

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void GetGame_WithoutDresseurId_Returns400()
    {
        var result = _controller.GetGame("partie-1", "", null);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // GET /api/dezoom/{partieId}/results
    // ─────────────────────────────────────────────

    [Fact]
    public void GetResults_Returns200()
    {
        _deZoomServiceMock.Setup(s => s.GetResults("partie-1")).Returns(new DeZoomGameResultsDto());

        var result = _controller.GetResults("partie-1");

        Assert.IsType<OkObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // POST /api/dezoom/{partieId}/guess
    // ─────────────────────────────────────────────

    [Fact]
    public void SubmitGuess_Returns200WithResult()
    {
        _deZoomServiceMock.Setup(s => s.SubmitGuess("partie-1", "d1", "Bulbizarre", 10, 1))
            .Returns(new DeZoomGuessResult());

        var result = _controller.SubmitGuess("partie-1", new DeZoomGuessRequest
        {
            DresseurId = "d1",
            PokemonNameFr = "Bulbizarre",
            ElapsedSeconds = 10,
            AttemptCount = 1,
        });

        Assert.IsType<OkObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // POST /api/dezoom/{partieId}/skip
    // ─────────────────────────────────────────────

    [Fact]
    public void SkipPokemon_WithDresseurId_Returns200()
    {
        _deZoomServiceMock.Setup(s => s.SkipPokemon("partie-1", "d1", 5)).Returns(new DeZoomGuessResult());

        var result = _controller.SkipPokemon("partie-1", new DeZoomSkipRequest
        {
            DresseurId = "d1",
            ElapsedSeconds = 5,
        });

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void SkipPokemon_WithoutDresseurId_Returns400()
    {
        var result = _controller.SkipPokemon("partie-1", new DeZoomSkipRequest
        {
            DresseurId = "",
            ElapsedSeconds = 5,
        });

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // POST /api/dezoom/{partieId}/rematch-ready
    // ─────────────────────────────────────────────

    [Fact]
    public void MarkRematchReady_WithDresseurId_Returns200()
    {
        _deZoomServiceMock.Setup(s => s.MarkRematchReady("partie-1", "d1")).Returns(new PokéDesc.Business.Models.RematchStatusDto());

        var result = _controller.MarkRematchReady("partie-1", "d1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void MarkRematchReady_WithoutDresseurId_Returns400()
    {
        var result = _controller.MarkRematchReady("partie-1", "");

        Assert.IsType<BadRequestObjectResult>(result);
    }
}
