using PokéDesc.Domain;
using PokéDesc.Domain.Models;
using PokéDesc.Business.Models;

namespace PokéDesc.Business.Interfaces;

public interface IPartieService
{
    /// <summary>
    /// Crée une nouvelle partie. Le créateur devient l'hôte (premier <see cref="Player"/>, rôle Host).
    /// </summary>
    Task<Partie> CreateGameAsync(string dresseurId, string name = "");

    /// <summary>
    /// Lance la partie avec le mode de jeu choisi. Réservé à l'hôte.
    /// </summary>
    Task<Partie> StartGameAsync(string partieId, string dresseurId, string mode, bool isSolo = false,
        int nbPokemons = 1, List<int>? generations = null, int timerDuration = 60);

    /// <summary>
    /// Permet à un joueur de rejoindre une partie existante via son code (rôle Guest).
    /// </summary>
    Task<Partie> JoinGameAsync(string codeSession, string dresseurId, string name = "");

    /// <summary>
    /// Soumet une réponse pour le Pokémon en cours.
    /// </summary>
    Task<GuessResult> SubmitGuessAsync(string partieId, string dresseurId, string pokemonName);

    /// <summary>
    /// Signale un timeout pour le joueur en cours — avance au Pokémon suivant sans score.
    /// </summary>
    Task<GuessResult> NotifyTimeoutAsync(string partieId, string dresseurId);

    /// <summary>
    /// Utilise un indice pour le Pokémon en cours.
    /// </summary>
    Task<Partie> UseHintAsync(string partieId, string dresseurId, string hintType);

    /// <summary>
    /// Récupère l'état actuel de la partie.
    /// </summary>
    Task<Partie> GetGameAsync(string partieId);

    /// <summary>
    /// Met à jour les paramètres de la partie (nombre de Pokémon, générations et durée du timer). Réservé à l'hôte.
    /// </summary>
    Task<Partie> UpdateGameSettingsAsync(string partieId, string dresseurId, int nbPokemons, List<int>? generations, int? timerDuration);

    /// <summary>
    /// Expulse un joueur de la partie. Réservé à l'hôte (ne peut pas s'expulser lui-même).
    /// </summary>
    Task<Partie> KickPlayerAsync(string partieId, string hostId, string targetId);

    /// <summary>
    /// Retire un joueur de la partie. Si l'hôte quitte, un nouvel hôte est promu automatiquement.
    /// </summary>
    Task<Partie> LeaveGameAsync(string partieId, string dresseurId);

    /// <summary>
    /// Marque un joueur comme prêt pour une revanche. Si tous les joueurs sont prêts, crée et démarre une nouvelle partie.
    /// </summary>
    Task<RematchStatusDto> MarkRematchReadyAsync(string partieId, string dresseurId);
}
