using Xunit;
using Microsoft.AspNetCore.Mvc;
using Moq;
using PokéDesc.API.Controllers;
using PokéDesc.API.DTOs;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;

namespace PokéDesc.Tests.Controllers;

/// <summary>
/// Tests unitaires pour TypesGameController.
/// </summary>
public class TypesGameControllerTests
{
    private readonly Mock<ITypesGameService> _serviceMock;
    private readonly TypesGameController _controller;

    public TypesGameControllerTests()
    {
        _serviceMock = new Mock<ITypesGameService>();
        _controller = new TypesGameController(_serviceMock.Object);
    }

    // ─────────────────────────────────────────────
    // GET /api/types-game/types
    // ─────────────────────────────────────────────

    [Fact]
    public void GetAllTypes_Returns200()
    {
        _serviceMock.Setup(s => s.GetAllTypes()).Returns(new List<TypeSimpleDto>());

        var result = _controller.GetAllTypes();

        Assert.IsType<OkObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // GET /api/types-game/{partieId}
    // ─────────────────────────────────────────────

    [Fact]
    public void GetGame_WithDresseurId_Returns200()
    {
        _serviceMock.Setup(s => s.GetOrCreateGame("partie-1", "d1")).Returns(new TypesGameDto());

        var result = _controller.GetGame("partie-1", "d1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void GetGame_WithoutDresseurId_Returns400()
    {
        var result = _controller.GetGame("partie-1", "");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // GET /api/types-game/{partieId}/results
    // ─────────────────────────────────────────────

    [Fact]
    public void GetResults_Returns200()
    {
        _serviceMock.Setup(s => s.GetResults("partie-1")).Returns(new TypesGameResultsDto());

        var result = _controller.GetResults("partie-1");

        Assert.IsType<OkObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // POST /api/types-game/{partieId}/rematch-ready
    // ─────────────────────────────────────────────

    [Fact]
    public void MarkRematchReady_WithDresseurId_Returns200()
    {
        _serviceMock.Setup(s => s.MarkRematchReady("partie-1", "d1")).Returns(new RematchStatusDto());

        var result = _controller.MarkRematchReady("partie-1", "d1");

        Assert.IsType<OkObjectResult>(result);
    }

    [Fact]
    public void MarkRematchReady_WithoutDresseurId_Returns400()
    {
        var result = _controller.MarkRematchReady("partie-1", "");

        Assert.IsType<BadRequestObjectResult>(result);
    }

    // ─────────────────────────────────────────────
    // POST /api/types-game/{partieId}/guess
    // ─────────────────────────────────────────────

    [Fact]
    public void SubmitGuess_Returns200WithResult()
    {
        _serviceMock.Setup(s => s.SubmitGuess("partie-1", "d1", 10, null, 5, 1))
            .Returns(new TypesGuessResult());

        var result = _controller.SubmitGuess("partie-1", new TypesGuessRequest
        {
            DresseurId = "d1",
            Type1Id = 10,
            Type2Id = null,
            ElapsedSeconds = 5,
            AttemptCount = 1,
        });

        Assert.IsType<OkObjectResult>(result);
    }
}
