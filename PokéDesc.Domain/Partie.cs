#nullable enable
using System.Collections.Generic;
using System.Linq;
using PokéDesc.Domain.Models;

namespace PokéDesc.Domain;

public class Partie
{
    public string Id { get; set; } = null!;

    // Le code unique pour rejoindre (ex: "AB12CD")
    public string CodeSession { get; set; } = string.Empty;

    public PartieStatut Statut { get; set; } = PartieStatut.EnAttente;

    // L'ID de l'hôte (créateur). Remplace l'ancien "Dresseur1 = hôte".
    public string HostId { get; set; } = string.Empty;

    // Capacité maximale du lobby.
    public int MaxPlayers { get; set; } = 8;

    // Liste dynamique des joueurs — remplace Dresseur1/2Id + StateJ1/J2.
    public List<Player> Players { get; set; } = new();

    // Mode de jeu : true si solo (1 joueur), false si multijoueur
    public bool ModeSolo { get; set; } = false;

    // Paramètres choisis par l'hôte
    public int NbPokemons { get; set; } = 3;
    public List<int> SelectedGenerations { get; set; } = new() { 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    public int TimerDurationSeconds { get; set; } = 60; // Durée du timer en secondes (-1 = infini)

    // La liste des Pokémon à deviner, commune à tous les joueurs
    public List<Pokemon> PokemonsToGuess { get; set; } = new List<Pokemon>();

    // Revanche
    public string? RematchPartieId { get; set; }

    // Métadonnées
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // ─────────────────────────────────────────────
    // Méthodes domaine — invariants centralisés ici
    // ─────────────────────────────────────────────

    /// <summary>Retourne le joueur correspondant à l'identité donnée, ou null s'il n'est pas dans la partie.</summary>
    public Player? GetPlayer(string dresseurId) => Players.FirstOrDefault(p => p.DresseurId == dresseurId);

    /// <summary>Vrai si l'identité donnée est celle de l'hôte.</summary>
    public bool IsHost(string dresseurId) => !string.IsNullOrEmpty(dresseurId) && dresseurId == HostId;

    /// <summary>Vrai si la partie accepte encore un nouveau joueur (lobby ouvert et non plein).</summary>
    public bool CanJoin() => Statut == PartieStatut.EnAttente && Players.Count < MaxPlayers;

    /// <summary>
    /// Ajoute l'hôte initial (créateur de la partie) et positionne <see cref="HostId"/>.
    /// </summary>
    public void InitHost(string dresseurId, string name)
    {
        HostId = dresseurId;
        Players.Add(new Player
        {
            DresseurId = dresseurId,
            Name = name,
            Role = PlayerRole.Host,
            IsConnected = true,
        });
    }

    /// <summary>
    /// Fait rejoindre un joueur en tant qu'invité. Idempotent si le joueur est déjà présent.
    /// Lève <see cref="InvalidOperationException"/> si la partie est pleine ou déjà démarrée.
    /// Doit être appelé dans une section critique (lock) pour garantir l'atomicité.
    /// </summary>
    public void Join(string dresseurId, string name)
    {
        // Idempotent : un joueur déjà présent ne crée pas de doublon.
        if (GetPlayer(dresseurId) != null)
            return;

        if (!CanJoin())
            throw new InvalidOperationException("Impossible de rejoindre : la partie est pleine ou déjà démarrée.");

        Players.Add(new Player
        {
            DresseurId = dresseurId,
            Name = name,
            Role = PlayerRole.Guest,
            IsConnected = true,
        });
    }

    /// <summary>
    /// Retire un joueur de la partie. Si le joueur retiré était l'hôte, promeut automatiquement
    /// le joueur suivant en hôte (cf. <see cref="PromoteNewHost"/>).
    /// </summary>
    public void Remove(string dresseurId)
    {
        var player = GetPlayer(dresseurId);
        if (player == null)
            return;

        bool wasHost = player.DresseurId == HostId;
        Players.Remove(player);

        if (wasHost)
            PromoteNewHost();
    }

    /// <summary>
    /// Promeut le premier joueur restant au rôle d'hôte. Si plus aucun joueur, l'hôte est vidé.
    /// </summary>
    public void PromoteNewHost()
    {
        var next = Players.FirstOrDefault();
        if (next != null)
        {
            next.Role = PlayerRole.Host;
            HostId = next.DresseurId;
        }
        else
        {
            HostId = string.Empty;
        }
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
