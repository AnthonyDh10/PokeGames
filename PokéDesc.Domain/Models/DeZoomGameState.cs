#nullable enable

namespace PokéDesc.Domain.Models;

public class DeZoomGameState
{
    public string PartieId { get; set; } = string.Empty;
    public string PokemonNameFr { get; set; } = string.Empty;
    public string SpriteUrl { get; set; } = string.Empty;

    // J1 — premier joueur à rejoindre
    public string? DresseurId1 { get; set; }
    public bool IsGuessedJ1 { get; set; }
    public bool WasCorrectJ1 { get; set; }
    public int? ElapsedSecondsJ1 { get; set; }
    public int? AttemptCountJ1 { get; set; }
    public bool RematchReadyJ1 { get; set; }

    // J2 — deuxième joueur à rejoindre
    public string? DresseurId2 { get; set; }
    public bool IsGuessedJ2 { get; set; }
    public bool WasCorrectJ2 { get; set; }
    public int? ElapsedSecondsJ2 { get; set; }
    public int? AttemptCountJ2 { get; set; }
    public bool RematchReadyJ2 { get; set; }

    // Rematch
    public string? RematchPartieId { get; set; }

    // Paramètres de la partie
    public List<int> SelectedGenerations { get; set; } = Enumerable.Range(1, 9).ToList();
}
