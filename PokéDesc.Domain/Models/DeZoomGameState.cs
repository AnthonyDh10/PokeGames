#nullable enable

using PokéDesc.Domain.Interfaces;

namespace PokéDesc.Domain.Models;

public class DeZoomGameState : IMiniGameState
{
    public string PartieId { get; set; } = string.Empty;
    public string PokemonNameFr { get; set; } = string.Empty;
    public string SpriteUrl { get; set; } = string.Empty;

    public MiniGamePlayerState Player1 { get; set; } = new();
    public MiniGamePlayerState Player2 { get; set; } = new();

    public string? RematchPartieId { get; set; }
    public List<int> SelectedGenerations { get; set; } = Enumerable.Range(1, 9).ToList();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>Retourne l'état du joueur identifié par son id.</summary>
    public MiniGamePlayerState GetPlayer(string dresseurId)
        => dresseurId == Player1.DresseurId ? Player1 : Player2;
}
