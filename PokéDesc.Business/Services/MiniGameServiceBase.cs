using PokéDesc.Business.Constants;
using PokéDesc.Business.Interfaces;
using PokéDesc.Business.Models;
using PokéDesc.Domain.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Services;

/// <summary>
/// Classe de base abstraite partagée par <see cref="DeZoomService"/> et <see cref="TypesGameService"/>.
/// Factorise : lock, store, gestion joueurs, résultats, logique rematch.
/// </summary>
public abstract class MiniGameServiceBase<TState> where TState : class, IMiniGameState
{
    protected readonly IMiniGameStore<TState> Store;
    protected readonly object Lock = new();

    protected MiniGameServiceBase(IMiniGameStore<TState> store)
    {
        Store = store;
    }

    // ── Helpers joueur ──────────────────────────────────────────────────────

    /// <summary>Retourne l'état du joueur (Player1 si dresseurId correspond, sinon Player2).</summary>
    protected static MiniGamePlayerState GetPlayer(TState state, string dresseurId)
        => dresseurId == state.Player1.DresseurId ? state.Player1 : state.Player2;

    /// <summary>
    /// Affecte <paramref name="dresseurId"/> à Player2 s'il n'est pas Player1
    /// et que la place Player2 est libre.
    /// </summary>
    protected static void EnsurePlayer2(TState state, string dresseurId)
    {
        if (state.Player1.DresseurId != dresseurId && state.Player2.DresseurId == null)
            state.Player2.DresseurId = dresseurId;
    }

    // ── Helpers deviner ─────────────────────────────────────────────────────

    /// <summary>Marque le joueur comme ayant deviné correctement.</summary>
    protected static void RecordCorrectGuess(MiniGamePlayerState player, int elapsedSeconds, int attemptCount)
    {
        player.IsGuessed = true;
        player.WasCorrect = true;
        player.ElapsedSeconds = elapsedSeconds;
        player.AttemptCount = attemptCount;
    }

    /// <summary>
    /// Enregistre une tentative échouée.
    /// Verrouille le joueur (IsGuessed) si le nombre maximum de tentatives est atteint.
    /// </summary>
    protected static void RecordFailedAttempt(MiniGamePlayerState player, int elapsedSeconds, int attemptCount)
    {
        player.AttemptCount = attemptCount;
        if (attemptCount >= GameConstants.MaxAttempts)
        {
            player.IsGuessed = true;
            player.ElapsedSeconds = elapsedSeconds;
        }
    }

    // ── Helpers résultats ───────────────────────────────────────────────────

    /// <summary>Vrai si tous les joueurs engagés ont terminé.</summary>
    protected static bool BothFinished(TState state) =>
        state.Player1.IsGuessed && (state.Player2.DresseurId == null || state.Player2.IsGuessed);

    /// <summary>Construit le DTO de résultat pour un joueur à partir de son état.</summary>
    protected static MiniGamePlayerResultDto BuildPlayerResultDto(MiniGamePlayerState player) =>
        new()
        {
            DresseurId = player.DresseurId,
            HasFinished = player.IsGuessed,
            WasCorrect = player.WasCorrect,
            ElapsedSeconds = player.ElapsedSeconds,
            AttemptCount = player.AttemptCount,
        };

    // ── Rematch ─────────────────────────────────────────────────────────────

    /// <summary>
    /// Logique rematch commune : marque le joueur prêt, crée la nouvelle partie
    /// si les deux joueurs sont prêts, retourne le statut actuel.
    /// Doit être appelé depuis un bloc <c>lock (Lock)</c>.
    /// </summary>
    protected RematchStatusDto MarkRematchCore(TState state, string dresseurId, Func<string, TState> createRematch)
    {
        GetPlayer(state, dresseurId).RematchReady = true;

        bool bothReady = state.Player1.RematchReady
            && (state.Player2.DresseurId == null || state.Player2.RematchReady);

        if (bothReady && string.IsNullOrEmpty(state.RematchPartieId))
        {
            string newId = Guid.NewGuid().ToString();
            state.RematchPartieId = newId;
            Store.Set(newId, createRematch(newId));
        }

        return new RematchStatusDto
        {
            Player1Ready = state.Player1.RematchReady,
            Player2Ready = state.Player2.RematchReady || state.Player2.DresseurId == null,
            RematchPartieId = state.RematchPartieId,
        };
    }
}
