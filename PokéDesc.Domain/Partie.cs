#nullable enable
using System.Collections.Generic;
using PokéDesc.Domain.Models;

namespace PokéDesc.Domain;

public class Partie
{
    public string Id { get; set; } = null!;

    // Le code unique pour rejoindre (ex: "AB12CD")
    public string CodeSession { get; set; } = string.Empty;

    // L'ID du créateur de la partie
    public string Dresseur1Id { get; set; } = string.Empty;

    // L'ID du joueur qui rejoint (peut être null au début)
    public string? Dresseur2Id { get; set; }

    public PartieStatut Statut { get; set; } = PartieStatut.EnAttente;

    // Mode de jeu : true si solo (1 joueur), false si multijoueur (2 joueurs)
    public bool ModeSolo { get; set; } = false;

    // Paramètres choisis par l'hôte
    public int NbPokemons { get; set; } = 3;
    public List<int> SelectedGenerations { get; set; } = new() { 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    public int TimerDurationSeconds { get; set; } = 60; // Durée du timer en secondes (-1 = infini)

    // La liste des Pokémon à deviner, commune aux deux joueurs
    public List<Pokemon> PokemonsToGuess { get; set; } = new List<Pokemon>();

    // État de jeu par joueur — remplace les paires de champs J1/J2 dupliqués
    public PlayerGameState StateJ1 { get; set; } = new();
    public PlayerGameState StateJ2 { get; set; } = new();

    // Revanche
    public string? RematchPartieId { get; set; }

    // Métadonnées
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ─────────────────────────────────────────────
    // Méthodes domaine — invariants centralisés ici
    // ─────────────────────────────────────────────

    /// <summary>Retourne l'état du joueur demandé.</summary>
    public PlayerGameState GetState(bool isJ1) => isJ1 ? StateJ1 : StateJ2;

    /// <summary>
    /// Fait rejoindre un deuxième joueur. Lève une exception si la partie est déjà pleine.
    /// Doit être appelé dans une section critique (lock) pour garantir l'atomicité.
    /// </summary>
    public void Join(string dresseurId)
    {
        if (!string.IsNullOrEmpty(Dresseur2Id))
            throw new ArgumentException("Cette partie a déjà deux joueurs.");

        Dresseur2Id = dresseurId;
        Statut = PartieStatut.Pret;
    }
}

public class CompletedPokemon
{
    public string PokemonId { get; set; } = string.Empty;
    public string PokemonName { get; set; } = string.Empty;
    public bool WasGuessed { get; set; } // true si deviné, false si raté
    public int AttemptsUsed { get; set; }
    public List<string> HintsUsed { get; set; } = new List<string>();
    public int PointsEarned { get; set; }
}
