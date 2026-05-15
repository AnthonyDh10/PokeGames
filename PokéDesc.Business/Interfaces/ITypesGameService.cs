namespace PokéDesc.Business.Interfaces;

public class TypesGameDto
{
    public bool IsMono { get; set; }
    public Dictionary<string, List<string>> Interactions { get; set; } = new();
}

public class TypesGuessResult
{
    public bool IsCorrect { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? CorrectType1NameFr { get; set; }
    public string? CorrectType2NameFr { get; set; }
}

public class TypeSimpleDto
{
    public int Id { get; set; }
    public string NameFr { get; set; } = string.Empty;
}

public class TypesPlayerResultDto
{
    public string? DresseurId { get; set; }
    public bool HasFinished { get; set; }
    public bool WasCorrect { get; set; }
    public int? ElapsedSeconds { get; set; }
    public int? AttemptCount { get; set; }
}

public class TypesGameResultsDto
{
    public bool IsMono { get; set; }
    public Dictionary<string, List<string>> Interactions { get; set; } = new();
    public string? CorrectType1NameFr { get; set; }
    public string? CorrectType2NameFr { get; set; }
    public TypesPlayerResultDto Player1 { get; set; } = new();
    public TypesPlayerResultDto? Player2 { get; set; }
    public bool BothFinished { get; set; }
}

public class TypesRematchStatusDto
{
    public bool Player1Ready { get; set; }
    public bool Player2Ready { get; set; }
    public string? RematchPartieId { get; set; }
}

public interface ITypesGameService
{
    TypesGameDto GetOrCreateGame(string partieId, string dresseurId);
    TypesGuessResult SubmitGuess(string partieId, string dresseurId, int type1Id, int? type2Id, int elapsedSeconds, int attemptCount);
    TypesGameResultsDto GetResults(string partieId);
    TypesRematchStatusDto MarkRematchReady(string partieId, string dresseurId);
    List<TypeSimpleDto> GetAllTypes();
}
