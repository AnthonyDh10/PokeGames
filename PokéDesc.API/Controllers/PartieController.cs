using Microsoft.AspNetCore.Mvc;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.API.DTOs;
using PokéDesc.Domain;

namespace PokéDesc.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PartieController : ControllerBase
{
    private readonly IPartieService _partieService;
    private readonly ITimerService _timerService;

    public PartieController(IPartieService partieService, ITimerService timerService)
    {
        _partieService = partieService;
        _timerService = timerService;
    }

    [HttpPost("create")]
    public async Task<IActionResult> CreateGame([FromBody] CreateGameRequest request)
    {
        var partie = await _partieService.CreateGameAsync(request.DresseurId, request.Name);
        return OkWithPartie(partie);
    }

    [HttpPost("join")]
    public async Task<IActionResult> JoinGame([FromBody] JoinGameRequest request)
    {
        var partie = await _partieService.JoinGameAsync(request.CodeSession, request.DresseurId, request.Name);
        return OkWithPartie(partie);
    }

    [HttpPost("{partieId}/kick")]
    public async Task<IActionResult> KickPlayer(string partieId, [FromBody] KickPlayerRequest request)
    {
        var partie = await _partieService.KickPlayerAsync(partieId, request.DresseurId, request.TargetId);
        return OkWithPartie(partie);
    }

    [HttpPost("{partieId}/leave")]
    public async Task<IActionResult> LeaveGame(string partieId, [FromBody] LeaveGameRequest request)
    {
        var partie = await _partieService.LeaveGameAsync(partieId, request.DresseurId);
        return OkWithPartie(partie);
    }

    [HttpGet("{partieId}")]
    public async Task<IActionResult> GetGame(string partieId)
    {
        var partie = await _partieService.GetGameAsync(partieId);
        return OkWithPartie(partie);
    }

    [HttpPost("{partieId}/guess")]
    public async Task<IActionResult> SubmitGuess(string partieId, [FromBody] SubmitGuessRequest request)
    {
        var result = await _partieService.SubmitGuessAsync(partieId, request.DresseurId, request.PokemonName);
        return Ok(MapGuessResult(result));
    }

    [HttpPost("{partieId}/timeout")]
    public async Task<IActionResult> NotifyTimeout(string partieId, [FromBody] TimeoutRequest request)
    {
        var result = await _partieService.NotifyTimeoutAsync(partieId, request.DresseurId);
        return Ok(MapGuessResult(result));
    }

    [HttpPost("{partieId}/hint")]
    public async Task<IActionResult> UseHint(string partieId, [FromBody] UseHintRequest request)
    {
        var partie = await _partieService.UseHintAsync(partieId, request.DresseurId, request.HintType);
        return OkWithPartie(partie);
    }

    [HttpPost("{partieId}/start")]
    public async Task<IActionResult> StartGame(string partieId, [FromBody] StartGameRequest request)
    {
        var partie = await _partieService.StartGameAsync(
            partieId,
            request.DresseurId,
            request.Mode,
            request.IsSolo,
            request.NbPokemons,
            request.Generations,
            request.TimerDuration
        );
        return OkWithPartie(partie);
    }

    [HttpPut("{partieId}/settings")]
    public async Task<IActionResult> UpdateGameSettings(string partieId, [FromBody] UpdateGameSettingsRequest request)
    {
        var partie = await _partieService.UpdateGameSettingsAsync(partieId, request.DresseurId, request.NbPokemons, request.Generations, request.TimerDuration);
        return OkWithPartie(partie);
    }

    [HttpPost("{partieId}/rematch-ready")]
    public async Task<IActionResult> MarkRematchReady(string partieId, [FromBody] MarkRematchReadyRequest request)
    {
        var status = await _partieService.MarkRematchReadyAsync(partieId, request.DresseurId);
        return Ok(status);
    }

    [HttpGet("{partieId}/timer/{dresseurId}")]
    public IActionResult GetRemainingTime(string partieId, string dresseurId)
    {
        var remainingTime = _timerService.GetRemainingTime(partieId, dresseurId);
        var timerDurationSeconds = _timerService.GetTimerDuration(partieId);
        return Ok(new { TimeRemaining = remainingTime, TimerDurationSeconds = timerDurationSeconds });
    }

    [HttpPost("{partieId}/timer/reset")]
    public IActionResult ResetTimer(string partieId, [FromBody] ResetTimerRequest request)
    {
        _timerService.ResetTimer(partieId, request.DresseurId);
        return Ok();
    }

    // ── Helpers privés ───────────────────────────────────────────────────────

    private OkObjectResult OkWithPartie(Partie partie)
        => Ok(PartieResponseDto.FromPartie(partie));

    private static GuessResultDto MapGuessResult(GuessResult result) => new()
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
    };
}
