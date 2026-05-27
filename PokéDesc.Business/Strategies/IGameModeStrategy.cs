using PokéDesc.Business.Interfaces;
using PokéDesc.Domain;

namespace PokéDesc.Business.Strategies;

/// <summary>
/// Paramètres transmis à chaque stratégie de mode de jeu lors du démarrage.
/// </summary>
public record StartGameParams(
    int NbPokemons,
    List<int>? Generations,
    int TimerDuration);

/// <summary>
/// Contrat d'une stratégie de mode de jeu.
/// Chaque mode (Standard, Types, DeZoom…) implémente cette interface
/// pour configurer la <see cref="Partie"/> en cours de démarrage.
/// </summary>
public interface IGameModeStrategy
{
    /// <summary>Identifiant du mode (valeur de la propriété <c>mode</c> reçue par l'API).</summary>
    string Mode { get; }

    /// <summary>Configure la partie et applique les règles propres au mode.</summary>
    Task ExecuteAsync(Partie partie, StartGameParams parameters, IPokemonService pokemonService);
}
