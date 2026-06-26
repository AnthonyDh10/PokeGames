using System.ComponentModel.DataAnnotations;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;

namespace PokéDesc.API.DTOs;

/// <summary>
/// Version sûre de Partie retournée au client — exclut PokemonsToGuess pour ne pas exposer les réponses.
/// Contrat dynamique à N joueurs : <see cref="Players"/> remplace les anciens champs *J1/*J2.
/// </summary>
public class PartieResponseDto
{
    public string Id { get; set; } = string.Empty;
    public string CodeSession { get; set; } = string.Empty;
    public string Statut { get; set; } = string.Empty;
    public string HostId { get; set; } = string.Empty;
    public int MaxPlayers { get; set; }
    public bool ModeSolo { get; set; }
    public GameSettingsDto Settings { get; set; } = new();
    public List<PlayerDto> Players { get; set; } = new();
    public string? RematchPartieId { get; set; }

    public static PartieResponseDto FromPartie(Partie p) => new()
    {
        Id = p.Id,
        CodeSession = p.CodeSession,
        Statut = p.Statut.ToDisplayString(),
        HostId = p.HostId,
        MaxPlayers = p.MaxPlayers,
        ModeSolo = p.ModeSolo,
        Settings = new GameSettingsDto
        {
            NbPokemons = p.NbPokemons,
            Generations = p.SelectedGenerations,
            TimerDuration = p.TimerDurationSeconds,
        },
        Players = p.Players.Select(pl => PlayerDto.FromPlayer(pl, p.PokemonsToGuess)).ToList(),
        RematchPartieId = p.RematchPartieId,
    };
}

/// <summary>Paramètres de partie configurés par l'hôte.</summary>
public class GameSettingsDto
{
    public int NbPokemons { get; set; }
    public List<int> Generations { get; set; } = new();
    public int TimerDuration { get; set; }
}

/// <summary>État public d'un joueur (issu de <see cref="Player"/> + <see cref="PlayerGameState"/>).</summary>
public class PlayerDto
{
    public string DresseurId { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public bool IsConnected { get; set; }
    public int CurrentIndex { get; set; }
    public int Score { get; set; }
    public int AttemptsUsed { get; set; }
    public List<string> UsedHints { get; set; } = new();
    public DateTime? TimerStart { get; set; }
    public double TimeRemaining { get; set; }
    public bool RematchReady { get; set; }
    /// <summary>ID du Pokémon en cours pour ce joueur (null si la partie n'a pas démarré ou est terminée).</summary>
    public string? CurrentPokemonId { get; set; }
    public List<CompletedPokemon> CompletedPokemons { get; set; } = new();

    public static PlayerDto FromPlayer(Player pl, List<Pokemon>? pokemonsToGuess) => new()
    {
        DresseurId = pl.DresseurId,
        Name = pl.Name,
        Role = pl.Role.ToString(),
        IsConnected = pl.IsConnected,
        CurrentIndex = pl.State.CurrentIndex,
        Score = pl.State.Score,
        AttemptsUsed = pl.State.AttemptsUsed,
        UsedHints = pl.State.UsedHints,
        TimerStart = pl.State.TimerStart,
        TimeRemaining = pl.State.TimeRemaining,
        RematchReady = pl.State.RematchReady,
        CurrentPokemonId = pokemonsToGuess != null && pl.State.CurrentIndex < pokemonsToGuess.Count
            ? pokemonsToGuess[pl.State.CurrentIndex].Id : null,
        CompletedPokemons = pl.State.CompletedPokemons,
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

    /// <summary>Nom d'affichage de l'hôte (optionnel).</summary>
    public string Name { get; set; } = string.Empty;
}

public class JoinGameRequest
{
    [Required]
    public string CodeSession { get; set; } = string.Empty;

    [Required]
    public string DresseurId { get; set; } = string.Empty;

    /// <summary>Nom d'affichage du joueur (optionnel).</summary>
    public string Name { get; set; } = string.Empty;
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
    public string DresseurId { get; set; } = string.Empty; // doit être l'hôte

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
    [Required]
    public string DresseurId { get; set; } = string.Empty; // doit être l'hôte

    [Range(1, 6)]
    public int NbPokemons { get; set; } = 1;

    public List<int>? Generations { get; set; }

    [Range(-1, int.MaxValue)]
    public int? TimerDuration { get; set; }
}

public class KickPlayerRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty; // l'hôte qui expulse

    [Required]
    public string TargetId { get; set; } = string.Empty; // le joueur expulsé
}

public class LeaveGameRequest
{
    [Required]
    public string DresseurId { get; set; } = string.Empty;
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
