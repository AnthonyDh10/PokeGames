using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/types-game")]
public class TypesGameController : ControllerBase
{
    private readonly ITypesGameService _typesGameService;

    public TypesGameController(ITypesGameService typesGameService)
    {
        _typesGameService = typesGameService;
    }

    [HttpGet("types")]
    public IActionResult GetAllTypes()
    {
        return Ok(_typesGameService.GetAllTypes());
    }

    [HttpGet("{partieId}")]
    public IActionResult GetGame(string partieId, [FromQuery] string dresseurId)
    {
        if (string.IsNullOrWhiteSpace(dresseurId))
            return BadRequest("dresseurId est requis.");

        var dto = _typesGameService.GetOrCreateGame(partieId, dresseurId);
        return Ok(dto);
    }

    [HttpGet("{partieId}/results")]
    public IActionResult GetResults(string partieId)
    {
        var dto = _typesGameService.GetResults(partieId);
        return Ok(dto);
    }

    [HttpPost("{partieId}/rematch-ready")]
    public IActionResult MarkRematchReady(string partieId, [FromQuery] string dresseurId)
    {
        if (string.IsNullOrWhiteSpace(dresseurId))
            return BadRequest("dresseurId est requis.");

        var status = _typesGameService.MarkRematchReady(partieId, dresseurId);
        return Ok(status);
    }

    [HttpPost("{partieId}/guess")]
    public IActionResult SubmitGuess(string partieId, [FromBody] TypesGuessRequest request)
    {
        var result = _typesGameService.SubmitGuess(
            partieId,
            request.DresseurId,
            request.Type1Id,
            request.Type2Id,
            request.ElapsedSeconds,
            request.AttemptCount
        );
        return Ok(result);
    }
}

public class TypesGuessRequest
{
    public string DresseurId { get; set; } = string.Empty;
    public int Type1Id { get; set; }
    public int? Type2Id { get; set; }
    public int ElapsedSeconds { get; set; }
    public int AttemptCount { get; set; }
}
