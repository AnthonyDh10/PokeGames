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

    // Statut : "EnAttente", "EnCours", "Termine"
    public string Statut { get; set; } = "EnAttente";

    // Mode de jeu : true si solo (1 joueur), false si multijoueur (2 joueurs)
    public bool ModeSolo { get; set; } = false;

    // Paramètres choisis par l'hôte
    public int NbPokemons { get; set; } = 3;
    public List<int> SelectedGenerations { get; set; } = new() { 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    public int TimerDurationSeconds { get; set; } = 60; // Durée du timer en secondes (-1 = infini)

    // --- Logique du Jeu ---

    // La liste des Pokémon à deviner, commune aux deux joueurs
    public List<Pokemon> PokemonsToGuess { get; set; } = new List<Pokemon>();

    // Progression Joueur 1
    public int CurrentIndexJ1 { get; set; } = 0;
    public int ScoreJ1 { get; set; } = 0;

    // État du tour actuel (Joueur 1)
    public int AttemptsUsedJ1 { get; set; } = 0;
    public List<string> UsedHintsJ1 { get; set; } = new List<string>();

    // Timer Joueur 1
    public DateTime? TimerStartJ1 { get; set; }
    public double TimeRemainingJ1 { get; set; } = 60.0; // secondes

    // Progression Joueur 2
    public int CurrentIndexJ2 { get; set; } = 0;
    public int ScoreJ2 { get; set; } = 0;

    // État du tour actuel (Joueur 2)
    public int AttemptsUsedJ2 { get; set; } = 0;
    public List<string> UsedHintsJ2 { get; set; } = new List<string>();

    // Timer Joueur 2
    public DateTime? TimerStartJ2 { get; set; }
    public double TimeRemainingJ2 { get; set; } = 60.0; // secondes

    // Historique des Pokémons complétés
    public List<CompletedPokemon> CompletedPokemonsJ1 { get; set; } = new List<CompletedPokemon>();
    public List<CompletedPokemon> CompletedPokemonsJ2 { get; set; } = new List<CompletedPokemon>();

    // Revanche
    public bool RematchReadyJ1 { get; set; }
    public bool RematchReadyJ2 { get; set; }
    public string? RematchPartieId { get; set; }

    // Métadonnées
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
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
