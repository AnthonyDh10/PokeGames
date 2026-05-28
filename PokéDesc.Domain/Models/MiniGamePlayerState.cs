#nullable enable

namespace PokéDesc.Domain.Models;

/// <summary>
/// État d'un joueur dans un mini-jeu (DeZoom, TypesGame).
/// Remplace les paires de propriétés dupliquées J1/J2 dans <see cref="DeZoomGameState"/>
/// et <see cref="TypesGameState"/>, sur le même principe que <see cref="PlayerGameState"/>
/// dans <see cref="PokéDesc.Domain.Partie"/>.
/// </summary>
public class MiniGamePlayerState
{
    public string? DresseurId { get; set; }
    public bool IsGuessed { get; set; }
    public bool WasCorrect { get; set; }
    public int? ElapsedSeconds { get; set; }
    public int? AttemptCount { get; set; }
    public bool RematchReady { get; set; }
}
