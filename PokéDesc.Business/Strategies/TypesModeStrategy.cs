using PokéDesc.Business.Interfaces;
using PokéDesc.Domain;

namespace PokéDesc.Business.Strategies;

/// <summary>
/// Mode Types (Typuzzle) : démarre la partie sans Pokémon à deviner,
/// le mini-jeu gérant sa propre logique côté <c>TypesGameService</c>.
/// </summary>
public class TypesModeStrategy : IGameModeStrategy
{
    public string Mode => "Types";

    public Task ExecuteAsync(Partie partie, StartGameParams parameters, IPokemonService pokemonService)
    {
        partie.Statut = PartieStatut.EnCours;
        partie.TimerStartJ1 = DateTime.UtcNow;
        partie.TimerStartJ2 = DateTime.UtcNow;
        return Task.CompletedTask;
    }
}
