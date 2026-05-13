using System.ComponentModel.DataAnnotations;

namespace PokéDesc.API.DTOs;

public class CreateGameRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;
}

public class JoinGameRequest
{
    [Required]
    public string CodeSession { get; set; } = string.Empty;

    [Required]
    public string DresseurId { get; set; } = string.Empty;
}

public class SubmitGuessRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;

    [Required]
    public string PokemonName { get; set; } = string.Empty;
}

public class UseHintRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;

    [Required]
    public string HintType { get; set; } = string.Empty; // "Type", "Stats", "Talent"
}

public class StartGameRequest
{
    [Required]
    public string Mode { get; set; } = string.Empty; // "Standard"

    public bool IsSolo { get; set; } = false; // Mode solo ou multijoueur

    [Range(1, 6)]
    public int NbPokemons { get; set; } = 1;

    public List<int>? Generations { get; set; } // null = toutes les générations

    [Range(-1, int.MaxValue)]
    public int TimerDuration { get; set; } = 60; // Durée du timer en secondes (-1 = infini)
}

public class UpdateGameSettingsRequest
{
    [Range(1, 6)]
    public int NbPokemons { get; set; } = 1;

    public List<int>? Generations { get; set; }

    [Range(-1, int.MaxValue)]
    public int? TimerDuration { get; set; }
}

public class ResetTimerRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;
}
