using System.ComponentModel.DataAnnotations;

namespace PokéDesc.API.DTOs;

public class DeZoomGuessRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;

    [Required]
    public string PokemonNameFr { get; set; } = string.Empty;

    public int ElapsedSeconds { get; set; }
    public int AttemptCount { get; set; }
}

public class DeZoomSkipRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;

    public int ElapsedSeconds { get; set; }
}

public class TypesGuessRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;

    public int Type1Id { get; set; }
    public int? Type2Id { get; set; }
    public int ElapsedSeconds { get; set; }
    public int AttemptCount { get; set; }
}
