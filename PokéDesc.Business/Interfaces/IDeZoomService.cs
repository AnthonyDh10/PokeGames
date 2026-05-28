using PokéDesc.Business.Models;

namespace PokéDesc.Business.Interfaces;

public class DeZoomGameDto
{
    public string SpriteUrl { get; set; } = string.Empty;
    public int AttemptCount { get; set; }
}

public class DeZoomGuessResult
{
    public bool IsCorrect { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? CorrectPokemonNameFr { get; set; }

    public bool HasOneTypeInCommon { get; set; }
    public bool HasPerfectTypeMatch { get; set; }
    public bool HasSameGeneration { get; set; }
    public bool IsInSameEvolutionChain { get; set; }
}

public class DeZoomGameResultsDto
{
    public string SpriteUrl { get; set; } = string.Empty;
    public string CorrectPokemonNameFr { get; set; } = string.Empty;
    public MiniGamePlayerResultDto Player1 { get; set; } = new();
    public MiniGamePlayerResultDto? Player2 { get; set; }
    public bool BothFinished { get; set; }
    /// <summary>Générations sélectionnées pour la partie (1..9)</summary>
    public List<int>? Generations { get; set; }
}

public interface IDeZoomService
{
    DeZoomGameDto GetOrCreateGame(string partieId, string dresseurId, List<int>? selectedGenerations = null);
    DeZoomGuessResult SubmitGuess(string partieId, string dresseurId, string pokemonNameFr, int elapsedSeconds, int attemptCount);
    DeZoomGuessResult SkipPokemon(string partieId, string dresseurId, int elapsedSeconds);
    DeZoomGameResultsDto GetResults(string partieId);
    RematchStatusDto MarkRematchReady(string partieId, string dresseurId);
}
