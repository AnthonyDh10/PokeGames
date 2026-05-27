using PokéDesc.Domain;
using PokéDesc.Domain.Models;
using PokéDesc.Business.Models;

namespace PokéDesc.Business.Interfaces;

public interface IPartieService
{
    /// <summary>
    /// Crée une nouvelle partie et génère les Pokémon à deviner.
    /// </summary>
    Task<Partie> CreateGameAsync(string dresseurId);

    /// <summary>
    /// Lance la partie avec le mode de jeu choisi.
    /// </summary>
    Task<Partie> StartGameAsync(string partieId, string mode, bool isSolo = false,
        int nbPokemons = 1, List<int>? generations = null, int timerDuration = 60);

    /// <summary>
    /// Permet à un deuxième joueur de rejoindre une partie existante via son code.
    /// </summary>
    Task<Partie> JoinGameAsync(string codeSession, string dresseurId);

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
    /// Récupère le temps restant pour un joueur.
    /// </summary>
    double GetRemainingTime(string partieId, string dresseurId);

    /// <summary>
    /// Récupère la durée totale du timer de la partie (telle que configurée au démarrage).
    /// </summary>
    int GetTimerDuration(string partieId);

    /// <summary>
    /// Réinitialise le timer pour un joueur.
    /// </summary>
    void ResetTimer(string partieId, string dresseurId);

    /// <summary>
    /// Met à jour les paramètres de la partie (nombre de Pokémon, générations sélectionnées et durée du timer).
    /// </summary>
    Task<Partie> UpdateGameSettingsAsync(string partieId, int nbPokemons, List<int>? generations, int? timerDuration);

    /// <summary>
    /// Marque un joueur comme prêt pour une revanche. Si les deux sont prêts, crée et démarre une nouvelle partie.
    /// </summary>
    Task<RematchStatusDto> MarkRematchReadyAsync(string partieId, string dresseurId);
}
