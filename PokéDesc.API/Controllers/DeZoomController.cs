using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;
using PokéDesc.API.DTOs;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/dezoom")]
public class DeZoomController : MiniGameControllerBase
{
    private readonly IDeZoomService _deZoomService;

    public DeZoomController(IDeZoomService deZoomService)
    {
        _deZoomService = deZoomService;
    }

    [HttpGet("{partieId}")]
    public IActionResult GetGame(string partieId, [FromQuery] string dresseurId, [FromQuery] List<int>? generations)
    {
        if (ValidateDresseurId(dresseurId) is { } err) return err;
        var dto = _deZoomService.GetOrCreateGame(partieId, dresseurId, generations);
        return Ok(dto);
    }

    [HttpGet("{partieId}/results")]
    public IActionResult GetResults(string partieId)
    {
        var dto = _deZoomService.GetResults(partieId);
        return Ok(dto);
    }

    [HttpPost("{partieId}/guess")]
    public IActionResult SubmitGuess(string partieId, [FromBody] DeZoomGuessRequest request)
    {
        var result = _deZoomService.SubmitGuess(
            partieId,
            request.DresseurId,
            request.PokemonNameFr,
            request.ElapsedSeconds,
            request.AttemptCount
        );
        return Ok(result);
    }

    [HttpPost("{partieId}/skip")]
    public IActionResult SkipPokemon(string partieId, [FromBody] DeZoomSkipRequest request)
    {
        if (ValidateDresseurId(request.DresseurId) is { } err) return err;

        var result = _deZoomService.SkipPokemon(partieId, request.DresseurId, request.ElapsedSeconds);
        return Ok(result);
    }

    [HttpPost("{partieId}/rematch-ready")]
    public IActionResult MarkRematchReady(string partieId, [FromQuery] string dresseurId)
    {
        if (ValidateDresseurId(dresseurId) is { } err) return err;

        var status = _deZoomService.MarkRematchReady(partieId, dresseurId);
        return Ok(status);
    }
}
