namespace PokéDesc.Domain.Models;

/// <summary>
/// État de jeu d'un joueur pour une partie donnée.
/// Remplace les paires de propriétés dupliquées J1/J2 dans <see cref="PokéDesc.Domain.Partie"/>.
/// </summary>
public class PlayerGameState
{
    public int CurrentIndex { get; set; } = 0;
    public int Score { get; set; } = 0;
    public int AttemptsUsed { get; set; } = 0;
    public List<string> UsedHints { get; set; } = new();
    public DateTime? TimerStart { get; set; }
    public double TimeRemaining { get; set; } = 60.0;
    public bool RematchReady { get; set; } = false;
    public List<CompletedPokemon> CompletedPokemons { get; set; } = new();
}
