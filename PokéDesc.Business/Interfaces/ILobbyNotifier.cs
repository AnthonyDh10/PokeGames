namespace PokéDesc.Business.Interfaces;

/// <summary>
/// Abstraction du push temps réel vers les clients d'une partie.
/// Permet à la couche Business de notifier les changements d'état sans référencer
/// l'infrastructure SignalR (séparation N-tiers : l'implémentation vit dans PokéDesc.API).
/// </summary>
public interface ILobbyNotifier
{
    /// <summary>Pousse l'état courant de la partie au groupe (arrivée d'un joueur, settings, guess, hint, timeout, rematch…).</summary>
    Task NotifyLobbyUpdated(string partieId);

    /// <summary>Signale aux clients que la partie démarre afin de les rediriger vers l'écran de jeu.</summary>
    Task NotifyGameStarted(string partieId);

    /// <summary>Signale au groupe qu'un joueur a été expulsé (le client concerné quitte la partie).</summary>
    Task NotifyPlayerKicked(string partieId, string targetId);
}
