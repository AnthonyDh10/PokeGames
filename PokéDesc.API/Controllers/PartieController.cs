using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.API.DTOs;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartieController : ControllerBase
{
    private readonly IPartieService _partieService;
    private readonly ILogger<PartieController> _logger;

    public PartieController(IPartieService partieService, ILogger<PartieController> logger)
    {
        _partieService = partieService;
        _logger = logger;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
    {
        var partie = await _partieService.CreateGameAsync(request.DresseurId);
        return Ok(PartieResponseDto.FromPartie(partie));
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinGame([FromBody] JoinGameRequest request)
    {
        try
        {
            var partie = await _partieService.JoinGameAsync(request.CodeSession, request.DresseurId);
            return Ok(PartieResponseDto.FromPartie(partie));
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
            return Ok(PartieResponseDto.FromPartie(partie));
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
            return Ok(new GuessResultDto
            {
                IsCorrect = result.IsCorrect,
                IsTurnFinished = result.IsTurnFinished,
                IsGameFinished = result.IsGameFinished,
                IsTimeout = result.IsTimeout,
                Message = result.Message,
                PointsEarned = result.PointsEarned,
                UpdatedGame = PartieResponseDto.FromPartie(result.UpdatedGame),
                HasOneTypeInCommon = result.HasOneTypeInCommon,
                HasPerfectTypeMatch = result.HasPerfectTypeMatch,
                HasSameGeneration = result.HasSameGeneration,
                IsInSameEvolutionChain = result.IsInSameEvolutionChain,
            });
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
            return Ok(PartieResponseDto.FromPartie(partie));
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
            return Ok(PartieResponseDto.FromPartie(partie));
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
            var partie = await _partieService.UpdateGameSettingsAsync(partieId, request.NbPokemons, request.Generations, request.TimerDuration);
            return Ok(PartieResponseDto.FromPartie(partie));
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
    public async Task<IActionResult> MarkRematchReady(string partieId, [FromBody] MarkRematchReadyRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DresseurId))
            return BadRequest("dresseurId est requis.");

        try
        {
            var status = await _partieService.MarkRematchReadyAsync(partieId, request.DresseurId);
            return Ok(status);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erreur lors du traitement de la revanche pour la partie {PartieId}", partieId);
            return StatusCode(500, new { message = "Erreur serveur" });
        }
    }

    [HttpGet("{partieId}/timer/{dresseurId}")]
    public IActionResult GetRemainingTime(string partieId, string dresseurId)
    {
        try
        {
            var remainingTime = _partieService.GetRemainingTime(partieId, dresseurId);
            var timerDurationSeconds = _partieService.GetTimerDuration(partieId);
            return Ok(new { TimeRemaining = remainingTime, TimerDurationSeconds = timerDurationSeconds });
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
