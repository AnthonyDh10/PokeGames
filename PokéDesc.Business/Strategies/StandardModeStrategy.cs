using PokéDesc.Business.Constants;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain;
using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Strategies;

/// <summary>
/// Mode Standard : tire aléatoirement <c>NbPokemons</c> Pokémon parmi les générations
/// sélectionnées, avec 1 % de chances d'obtenir un légendaire/mythique à chaque position.
/// </summary>
public class StandardModeStrategy : IGameModeStrategy
{
    private readonly IPokemonService _pokemonService;

    public StandardModeStrategy(IPokemonService pokemonService)
    {
        _pokemonService = pokemonService;
    }

    public string Mode => "Standard";

    public async Task ExecuteAsync(Partie partie, StartGameParams parameters)
    {
        partie.NbPokemons = parameters.NbPokemons;
        partie.SelectedGenerations = parameters.Generations ?? Enumerable.Range(1, 8).ToList();
        partie.TimerDurationSeconds = parameters.TimerDuration;

        var basePokemons = await _pokemonService.GetAllPokemonsAsync();
        var legendaryMythicalPokemons = await _pokemonService.GetLegendaryOrMythicalPokemonsAsync();

        // Filtrer par génération si nécessaire
        var genNames = partie.SelectedGenerations
            .Where(g => GameConstants.GenerationNames.ContainsKey(g))
            .Select(g => GameConstants.GenerationNames[g])
            .ToHashSet();

        if (genNames.Count < GameConstants.GenerationNames.Count)
        {
            basePokemons = basePokemons
                .Where(p => genNames.Contains(p.Generation?.NameEn ?? ""))
                .ToList();
            legendaryMythicalPokemons = legendaryMythicalPokemons
                .Where(p => genNames.Contains(p.Generation?.NameEn ?? ""))
                .ToList();
        }

        // Exclure les Pokémon sans description
        basePokemons = basePokemons
            .Where(p => p.Description != null && p.Description.Any())
            .ToList();
        legendaryMythicalPokemons = legendaryMythicalPokemons
            .Where(p => p.Description != null && p.Description.Any())
            .ToList();

        if (basePokemons.Count == 0)
            throw new ArgumentException("Aucun Pokémon de base trouvé pour les générations sélectionnées.");

        var random = Random.Shared;
        var rarityDraws = new bool[parameters.NbPokemons];
        for (int i = 0; i < parameters.NbPokemons; i++)
            rarityDraws[i] = legendaryMythicalPokemons.Count > 0 && random.Next(100) == 0;

        partie.PokemonsToGuess = SelectPokemons(rarityDraws, basePokemons, legendaryMythicalPokemons, random);
        partie.Statut = PartieStatut.EnCours;

        double initialTime = parameters.TimerDuration >= 0 ? parameters.TimerDuration : -1.0;
        foreach (var player in partie.Players)
        {
            player.State.TimerStart = DateTime.UtcNow;
            player.State.TimeRemaining = initialTime;
        }
    }

    private static List<Pokemon> SelectPokemons(
        bool[] rarityDraws,
        List<Pokemon> basePokemons,
        List<Pokemon> legendaryMythicalPokemons,
        Random random)
    {
        var selectedPokemons = new List<Pokemon>();
        var selectedIds = new HashSet<string>();

        foreach (var isRare in rarityDraws)
        {
            var sourceList = isRare ? legendaryMythicalPokemons : basePokemons;
            var validPokemons = sourceList
                .Where(p => p.Description != null && p.Description.Any() && !selectedIds.Contains(p.Id))
                .ToList();

            // Fallback sur la liste de base si le pool rare est épuisé ou vide
            if (validPokemons.Count == 0)
                validPokemons = basePokemons
                    .Where(p => p.Description != null && p.Description.Any() && !selectedIds.Contains(p.Id))
                    .ToList();

            if (validPokemons.Count == 0)
                throw new ArgumentException("Aucun Pokémon valide (avec description) trouvé pour la sélection.");

            var selected = validPokemons[random.Next(validPokemons.Count)];
            selectedIds.Add(selected.Id);
            selectedPokemons.Add(selected);
        }

        return selectedPokemons;
    }
}
