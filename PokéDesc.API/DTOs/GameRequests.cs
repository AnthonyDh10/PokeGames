using System.ComponentModel.DataAnnotations;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;

namespace PokéDesc.API.DTOs;

/// <summary>
/// Version sûre de Partie retournée au client — exclut PokemonsToGuess pour ne pas exposer les réponses.
/// </summary>
public class PartieResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string CodeSession { get; set; } = string.Empty;
    public string Dresseur1Id { get; set; } = string.Empty;
    public string? Dresseur2Id { get; set; }
    public string Statut { get; set; } = string.Empty;
    public bool ModeSolo { get; set; }
    public int NbPokemons { get; set; }
    public List<int> SelectedGenerations { get; set; } = new();
    public int TimerDurationSeconds { get; set; }

    public int CurrentIndexJ1 { get; set; }
    public int ScoreJ1 { get; set; }
    public int AttemptsUsedJ1 { get; set; }
    public List<string> UsedHintsJ1 { get; set; } = new();
    public DateTime? TimerStartJ1 { get; set; }
    public double TimeRemainingJ1 { get; set; }

    public int CurrentIndexJ2 { get; set; }
    public int ScoreJ2 { get; set; }
    public int AttemptsUsedJ2 { get; set; }
    public List<string> UsedHintsJ2 { get; set; } = new();
    public DateTime? TimerStartJ2 { get; set; }
    public double TimeRemainingJ2 { get; set; }

    public List<CompletedPokemon> CompletedPokemonsJ1 { get; set; } = new();
    public List<CompletedPokemon> CompletedPokemonsJ2 { get; set; } = new();

    public bool RematchReadyJ1 { get; set; }
    public bool RematchReadyJ2 { get; set; }
    public string? RematchPartieId { get; set; }

    /// <summary>ID du Pokémon actuel pour J1 (null si la partie n'a pas encore démarré).</summary>
    public string? CurrentPokemonIdJ1 { get; set; }
    /// <summary>ID du Pokémon actuel pour J2 (null si la partie n'a pas encore démarré).</summary>
    public string? CurrentPokemonIdJ2 { get; set; }

    public static PartieResponseDto FromPartie(Partie p) => new()
    {
        Id = p.Id,
        CodeSession = p.CodeSession,
        Dresseur1Id = p.Dresseur1Id,
        Dresseur2Id = p.Dresseur2Id,
        Statut = p.Statut.ToDisplayString(),
        ModeSolo = p.ModeSolo,
        NbPokemons = p.NbPokemons,
        SelectedGenerations = p.SelectedGenerations,
        TimerDurationSeconds = p.TimerDurationSeconds,
        CurrentIndexJ1 = p.StateJ1.CurrentIndex,
        ScoreJ1 = p.StateJ1.Score,
        AttemptsUsedJ1 = p.StateJ1.AttemptsUsed,
        UsedHintsJ1 = p.StateJ1.UsedHints,
        TimerStartJ1 = p.StateJ1.TimerStart,
        TimeRemainingJ1 = p.StateJ1.TimeRemaining,
        CurrentIndexJ2 = p.StateJ2.CurrentIndex,
        ScoreJ2 = p.StateJ2.Score,
        AttemptsUsedJ2 = p.StateJ2.AttemptsUsed,
        UsedHintsJ2 = p.StateJ2.UsedHints,
        TimerStartJ2 = p.StateJ2.TimerStart,
        TimeRemainingJ2 = p.StateJ2.TimeRemaining,
        CompletedPokemonsJ1 = p.StateJ1.CompletedPokemons,
        CompletedPokemonsJ2 = p.StateJ2.CompletedPokemons,
        RematchReadyJ1 = p.StateJ1.RematchReady,
        RematchReadyJ2 = p.StateJ2.RematchReady,
        RematchPartieId = p.RematchPartieId,
        CurrentPokemonIdJ1 = p.PokemonsToGuess != null && p.StateJ1.CurrentIndex < p.PokemonsToGuess.Count
            ? p.PokemonsToGuess[p.StateJ1.CurrentIndex].Id : null,
        CurrentPokemonIdJ2 = p.PokemonsToGuess != null && p.StateJ2.CurrentIndex < p.PokemonsToGuess.Count
            ? p.PokemonsToGuess[p.StateJ2.CurrentIndex].Id : null,
    };
}

/// <summary>
/// Version sûre de GuessResult — UpdatedGame utilise PartieResponseDto.
/// </summary>
public class GuessResultDto
{
    public bool IsCorrect { get; set; }
    public bool IsTurnFinished { get; set; }
    public bool IsGameFinished { get; set; }
    public bool IsTimeout { get; set; }
    public string Message { get; set; } = string.Empty;
    public int PointsEarned { get; set; }
    public PartieResponseDto UpdatedGame { get; set; } = null!;
    public bool HasOneTypeInCommon { get; set; }
    public bool HasPerfectTypeMatch { get; set; }
    public bool HasSameGeneration { get; set; }
    public bool IsInSameEvolutionChain { get; set; }
}

public class MarkRematchReadyRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;
}

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

public class TimeoutRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;
}
