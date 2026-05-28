using PokéDesc.Business.Models;

namespace PokéDesc.Business.Interfaces;

public class TypesGameDto
{
    public Dictionary<string, List<string>> Interactions { get; set; } = new();
}

public class TypesGuessResult
{
    public bool IsCorrect { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? CorrectType1NameFr { get; set; }
    public string? CorrectType2NameFr { get; set; }
    public string? PartialMatchTypeFr { get; set; }
}

public class TypeSimpleDto
{
    public int Id { get; set; }
    public string NameFr { get; set; } = string.Empty;
}

public class TypesGameResultsDto
{
    public Dictionary<string, List<string>> Interactions { get; set; } = new();
    public string? CorrectType1NameFr { get; set; }
    public string? CorrectType2NameFr { get; set; }
    public MiniGamePlayerResultDto Player1 { get; set; } = new();
    public MiniGamePlayerResultDto? Player2 { get; set; }
    public bool BothFinished { get; set; }
}

public interface ITypesGameService
{
    TypesGameDto GetOrCreateGame(string partieId, string dresseurId);
    TypesGuessResult SubmitGuess(string partieId, string dresseurId, int type1Id, int? type2Id, int elapsedSeconds, int attemptCount);
    TypesGameResultsDto GetResults(string partieId);
    RematchStatusDto MarkRematchReady(string partieId, string dresseurId);
    List<TypeSimpleDto> GetAllTypes();
}
