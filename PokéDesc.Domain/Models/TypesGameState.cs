#nullable enable

using PokéDesc.Domain.Interfaces;

namespace PokéDesc.Domain.Models;

public class TypesGameState : IMiniGameState
{
    public string PartieId { get; set; } = string.Empty;
    public int Type1Id { get; set; }
    public int Type2Id { get; set; }

    public MiniGamePlayerState Player1 { get; set; } = new();
    public MiniGamePlayerState Player2 { get; set; } = new();

    public string? RematchPartieId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Retourne l'état du joueur identifié par son id.</summary>
    public MiniGamePlayerState GetPlayer(string dresseurId)
        => dresseurId == Player1.DresseurId ? Player1 : Player2;
}

