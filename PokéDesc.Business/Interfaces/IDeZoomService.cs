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
}

public class DeZoomPlayerResultDto
{
    public string? DresseurId { get; set; }
    public bool HasFinished { get; set; }
    public bool WasCorrect { get; set; }
    public int? ElapsedSeconds { get; set; }
    public int? AttemptCount { get; set; }
}

public class DeZoomGameResultsDto
{
    public string SpriteUrl { get; set; } = string.Empty;
    public string CorrectPokemonNameFr { get; set; } = string.Empty;
    public DeZoomPlayerResultDto Player1 { get; set; } = new();
    public DeZoomPlayerResultDto? Player2 { get; set; }
    public bool BothFinished { get; set; }
    // Générations sélectionnées pour la partie (1..9)
    public List<int>? Generations { get; set; }
}

public class DeZoomRematchStatusDto
{
    public bool Player1Ready { get; set; }
    public bool Player2Ready { get; set; }
    public string? RematchPartieId { get; set; }
}

public interface IDeZoomService
{
    DeZoomGameDto GetOrCreateGame(string partieId, string dresseurId, List<int>? selectedGenerations = null);
    DeZoomGuessResult SubmitGuess(string partieId, string dresseurId, string pokemonNameFr, int elapsedSeconds, int attemptCount);
    DeZoomGuessResult SkipPokemon(string partieId, string dresseurId, int elapsedSeconds);
    DeZoomGameResultsDto GetResults(string partieId);
    DeZoomRematchStatusDto MarkRematchReady(string partieId, string dresseurId);
}
