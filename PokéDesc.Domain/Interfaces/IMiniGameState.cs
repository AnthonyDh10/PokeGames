#nullable enable

using PokéDesc.Domain.Models;

namespace PokéDesc.Domain.Interfaces;

/// <summary>
/// Contrat commun à tous les états de mini-jeux (DeZoom, TypesGame).
/// Permet à <c>MiniGameServiceBase&lt;TState&gt;</c> de partager la logique
/// de gestion des joueurs, du rematch et du nettoyage TTL.
/// </summary>
public interface IMiniGameState
{
    string PartieId { get; set; }
    MiniGamePlayerState Player1 { get; set; }
    MiniGamePlayerState Player2 { get; set; }
    string? RematchPartieId { get; set; }
    DateTime CreatedAt { get; set; }
}
