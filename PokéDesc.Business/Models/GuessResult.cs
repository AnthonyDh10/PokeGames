using PokéDesc.Domain;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Models;

public class GuessResult
{
    public bool IsCorrect { get; set; }
    public bool IsTurnFinished { get; set; } // Vrai si trouvé OU plus d'essais
    public bool IsGameFinished { get; set; }
    public bool IsTimeout { get; set; } // Vrai si le temps est écoulé
    public string Message { get; set; } = string.Empty;
    public int PointsEarned { get; set; }
    public Partie UpdatedGame { get; set; } = null!;
}
