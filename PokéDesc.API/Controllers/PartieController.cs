using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;
using PokéDesc.API.DTOs;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartieController : ControllerBase
{
    private readonly IPartieService _partieService;

    public PartieController(IPartieService partieService)
    {
        _partieService = partieService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
    {
        var partie = await _partieService.CreateGameAsync(request.DresseurId);
        return Ok(partie);
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinGame([FromBody] JoinGameRequest request)
    {
        try
        {
            var partie = await _partieService.JoinGameAsync(request.CodeSession, request.DresseurId);
            return Ok(partie);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpGet("{partieId}")]
    public async Task<IActionResult> GetGame(string partieId)
    {
        try
        {
            var partie = await _partieService.GetGameAsync(partieId);
            return Ok(partie);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{partieId}/guess")]
    public async Task<IActionResult> SubmitGuess(string partieId, [FromBody] SubmitGuessRequest request)
    {
        try
        {
            var result = await _partieService.SubmitGuessAsync(partieId, request.DresseurId, request.PokemonName);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }

    [HttpPost("{partieId}/hint")]
    public async Task<IActionResult> UseHint(string partieId, [FromBody] UseHintRequest request)
    {
        try
        {
            var partie = await _partieService.UseHintAsync(partieId, request.DresseurId, request.HintType);
            return Ok(partie);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{partieId}/start")]
    public async Task<IActionResult> StartGame(string partieId, [FromBody] StartGameRequest request)
    {
        try
        {
            var partie = await _partieService.StartGameAsync(
                partieId,
                request.Mode,
                request.IsSolo,
                request.NbPokemons,
                request.Generations,
                request.TimerDuration
            );
            return Ok(partie);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{partieId}/settings")]
    public async Task<IActionResult> UpdateGameSettings(string partieId, [FromBody] UpdateGameSettingsRequest request)
    {
        try
        {
            var partie = await _partieService.UpdateGameSettingsAsync(partieId, request.NbPokemons, request.Generations);
            return Ok(partie);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPost("{partieId}/rematch-ready")]
    public async Task<IActionResult> MarkRematchReady(string partieId, [FromQuery] string dresseurId)
    {
        if (string.IsNullOrWhiteSpace(dresseurId))
            return BadRequest("dresseurId est requis.");

        var status = await _partieService.MarkRematchReadyAsync(partieId, dresseurId);
        return Ok(status);
    }

    [HttpGet("{partieId}/timer/{dresseurId}")]
    public IActionResult GetRemainingTime(string partieId, string dresseurId)
    {
        try
        {
            var remainingTime = _partieService.GetRemainingTime(partieId, dresseurId);
            return Ok(new { TimeRemaining = remainingTime });
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
    
    [HttpPost("{partieId}/timer/reset")]
    public IActionResult ResetTimer(string partieId, [FromBody] ResetTimerRequest request)
    {
        try
        {
            _partieService.ResetTimer(partieId, request.DresseurId);
            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
