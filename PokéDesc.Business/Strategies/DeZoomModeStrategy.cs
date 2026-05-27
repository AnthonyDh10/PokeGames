using PokéDesc.Business.Interfaces;
using PokéDesc.Domain;

namespace PokéDesc.Business.Strategies;

/// <summary>
/// Mode DeZoom : filtre les générations et démarre la partie.
/// La logique de jeu (zoom progressif) est gérée par <c>DeZoomService</c>.
/// </summary>
public class DeZoomModeStrategy : IGameModeStrategy
{
    public string Mode => "DeZoom";

    public Task ExecuteAsync(Partie partie, StartGameParams parameters)
    {
        partie.SelectedGenerations = parameters.Generations ?? Enumerable.Range(1, 9).ToList();
        partie.Statut = PartieStatut.EnCours;
        return Task.CompletedTask;
    }
}
