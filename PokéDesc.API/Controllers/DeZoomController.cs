using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/dezoom")]
public class DeZoomController : ControllerBase
{
    private readonly IDeZoomService _deZoomService;
    private readonly IPartieService _partieService;

    public DeZoomController(IDeZoomService deZoomService, IPartieService partieService)
    {
        _deZoomService = deZoomService;
        _partieService = partieService;
    }

    [HttpGet("{partieId}")]
    public async Task<IActionResult> GetGame(string partieId, [FromQuery] string dresseurId)
    {
        if (string.IsNullOrWhiteSpace(dresseurId))
            return BadRequest("dresseurId est requis.");

        List<int>? selectedGenerations = null;
        try
        {
            var partie = await _partieService.GetGameAsync(partieId);
            selectedGenerations = partie.SelectedGenerations?.Count > 0 ? partie.SelectedGenerations : null;
        }
        catch
        {
            // Partie introuvable → pas de filtre de génération
        }

        var dto = _deZoomService.GetOrCreateGame(partieId, dresseurId, selectedGenerations);
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
        if (string.IsNullOrWhiteSpace(request.DresseurId))
            return BadRequest("dresseurId est requis.");

        var result = _deZoomService.SkipPokemon(partieId, request.DresseurId, request.ElapsedSeconds);
        return Ok(result);
    }

    [HttpPost("{partieId}/rematch-ready")]
    public IActionResult MarkRematchReady(string partieId, [FromQuery] string dresseurId)
    {
        if (string.IsNullOrWhiteSpace(dresseurId))
            return BadRequest("dresseurId est requis.");

        var status = _deZoomService.MarkRematchReady(partieId, dresseurId);
        return Ok(status);
    }
}

public class DeZoomGuessRequest
{
    public string DresseurId { get; set; } = string.Empty;
    public string PokemonNameFr { get; set; } = string.Empty;
    public int ElapsedSeconds { get; set; }
    public int AttemptCount { get; set; }
}

public class DeZoomSkipRequest
{
    public string DresseurId { get; set; } = string.Empty;
    public int ElapsedSeconds { get; set; }
}
