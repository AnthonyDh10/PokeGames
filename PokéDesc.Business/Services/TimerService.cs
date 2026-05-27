using PokéDesc.Business.Helpers;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain;

namespace PokéDesc.Business.Services;

/// <summary>
/// Gestion du timer par joueur.
/// Dépend uniquement de <see cref="IGameSessionStore"/> — aucune logique de partie.
/// </summary>
public class TimerService : ITimerService
{
    private readonly IGameSessionStore _sessionStore;

    public TimerService(IGameSessionStore sessionStore)
    {
        _sessionStore = sessionStore;
    }

    public double GetRemainingTime(string partieId, string dresseurId)
    {
        var partie = _sessionStore.Get(partieId);
        var state = partie.GetState(dresseurId == partie.Dresseur1Id);
        return TimerCalculator.GetRemaining(state.TimerStart, state.TimeRemaining);
    }

    public int GetTimerDuration(string partieId)
        => _sessionStore.Get(partieId).TimerDurationSeconds;

    public void ResetTimer(string partieId, string dresseurId)
    {
        var partie = _sessionStore.Get(partieId);
        var state = partie.GetState(dresseurId == partie.Dresseur1Id);
        state.TimerStart = DateTime.UtcNow;
        state.TimeRemaining = partie.TimerDurationSeconds >= 0 ? partie.TimerDurationSeconds : -1;
    }
}
