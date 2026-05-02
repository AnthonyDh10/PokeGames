namespace PokéDesc.Domain.Models;

public class TypesGameState
{
    public string PartieId { get; set; } = string.Empty;
    public int Type1Id { get; set; }
    public int? Type2Id { get; set; } // null = mono-type

    // J1 — premier joueur à rejoindre
    public string? DresseurId1 { get; set; }
    public bool IsGuessedJ1 { get; set; }
    public int? ElapsedSecondsJ1 { get; set; }
    public int? AttemptCountJ1 { get; set; }
    public bool RematchReadyJ1 { get; set; }

    // J2 — deuxième joueur à rejoindre
    public string? DresseurId2 { get; set; }
    public bool IsGuessedJ2 { get; set; }
    public int? ElapsedSecondsJ2 { get; set; }
    public int? AttemptCountJ2 { get; set; }
    public bool RematchReadyJ2 { get; set; }

    // Rematch
    public string? RematchPartieId { get; set; }
}

