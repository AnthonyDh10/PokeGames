namespace PokéDesc.Business.Models;

/// <summary>
/// DTO de résultat joueur partagé par DeZoom et TypesGame.
/// Remplace <c>DeZoomPlayerResultDto</c> et <c>TypesPlayerResultDto</c>.
/// </summary>
public class MiniGamePlayerResultDto
{
    public string? DresseurId { get; set; }
    public bool HasFinished { get; set; }
    public bool WasCorrect { get; set; }
    public int? ElapsedSeconds { get; set; }
    public int? AttemptCount { get; set; }
}
