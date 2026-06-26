namespace PokéDesc.Domain.Models;

/// <summary>
/// Un joueur d'une partie (ex-"slot" J1/J2, désormais dynamique dans <see cref="PokéDesc.Domain.Partie.Players"/>).
/// L'identité est le <see cref="DresseurId"/> (= sessionId) ; le <see cref="Name"/> est cosmétique.
/// L'état de jeu propre au joueur est porté par <see cref="State"/> (réutilise <see cref="PlayerGameState"/> inchangé).
/// </summary>
public class Player
{
    /// <summary>Identité du joueur (= sessionId). Clé unique au sein d'une partie.</summary>
    public string DresseurId { get; set; } = string.Empty;

    /// <summary>Nom d'affichage choisi par le joueur (cosmétique, peut entrer en collision).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Rôle dans la partie (Host / Guest).</summary>
    public PlayerRole Role { get; set; } = PlayerRole.Guest;

    /// <summary>Présence temps réel, pilotée par SignalR (Phase 5).</summary>
    public bool IsConnected { get; set; } = true;

    /// <summary>État de jeu du joueur (score, index, timer…). Réutilisé tel quel.</summary>
    public PlayerGameState State { get; set; } = new();
}
