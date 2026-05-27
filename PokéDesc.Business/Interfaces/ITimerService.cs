namespace PokéDesc.Business.Interfaces;

/// <summary>
/// Responsabilité unique : gestion du timer par joueur.
/// Isolé de <see cref="IPartieService"/> pour respecter SRP.
/// </summary>
public interface ITimerService
{
    /// <summary>Retourne le temps restant (en secondes) pour un joueur.</summary>
    double GetRemainingTime(string partieId, string dresseurId);

    /// <summary>Retourne la durée totale du timer configurée pour la partie.</summary>
    int GetTimerDuration(string partieId);

    /// <summary>Réinitialise le timer d'un joueur à la durée totale de la partie.</summary>
    void ResetTimer(string partieId, string dresseurId);
}
