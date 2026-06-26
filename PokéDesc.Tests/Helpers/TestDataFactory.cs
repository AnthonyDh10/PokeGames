using PokéDesc.Domain.Models;
using PokéDesc.Domain;

namespace PokéDesc.Tests.Helpers;

/// <summary>
/// Fournit des objets de test préconstruits pour les tests unitaires.
/// </summary>
public static class TestDataFactory
{
    public static string TestDataPath =>
        Path.Combine(AppContext.BaseDirectory, "TestData");

    public static Pokemon CreateBulbizarre() => new()
    {
        Id = "1",
        NumericId = 1,
        NameFr = "Bulbizarre",
        NameEn = "Bulbasaur",
        Category = "Pokémon Graine",
        PokedexNumber = 1,
        Generation = new Generation { NameFr = "Génération I", NameEn = "generation-i" },
        Status = new Status { IsLegendary = false, IsMythical = false, CaptureRate = 45 },
        Physical = new Physical { HeightM = 0.7, WeightKg = 6.9 },
        Types = new List<PokemonType>
        {
            new() { Name = "Plante", NameEn = "grass", Slot = 1 },
            new() { Name = "Poison", NameEn = "poison", Slot = 2 }
        },
        Abilities = new List<Ability> { new() { Name = "Engrais", NameEn = "overgrow", IsHidden = false } },
        Description = new List<string> { "Bulbizarre a une graine sur le dos depuis sa naissance." },
        Sprites = new Sprites { FrontDefault = "https://example.com/bulbasaur.png" },
        EvolutionChain = new EvolutionChain { Count = 3, BasePokemon = "Bulbizarre", Chain = new() }
    };

    public static Pokemon CreateSalamèche() => new()
    {
        Id = "4",
        NumericId = 4,
        NameFr = "Salamèche",
        NameEn = "Charmander",
        Category = "Pokémon Lézard",
        PokedexNumber = 4,
        Generation = new Generation { NameFr = "Génération I", NameEn = "generation-i" },
        Status = new Status { IsLegendary = false, IsMythical = false, CaptureRate = 45 },
        Physical = new Physical { HeightM = 0.6, WeightKg = 8.5 },
        Types = new List<PokemonType>
        {
            new() { Name = "Feu", NameEn = "fire", Slot = 1 }
        },
        Abilities = new List<Ability> { new() { Name = "Brasier", NameEn = "blaze", IsHidden = false } },
        Description = new List<string> { "La flamme à l'extrémité de sa queue indique son état de santé." },
        Sprites = new Sprites { FrontDefault = "https://example.com/charmander.png" },
        EvolutionChain = new EvolutionChain { Count = 3, BasePokemon = "Salamèche", Chain = new() }
    };

    public static Pokemon CreateMewtwo() => new()
    {
        Id = "150",
        NumericId = 150,
        NameFr = "Mewtwo",
        NameEn = "Mewtwo",
        Category = "Pokémon Génétique",
        PokedexNumber = 150,
        Generation = new Generation { NameFr = "Génération I", NameEn = "generation-i" },
        Status = new Status { IsLegendary = true, IsMythical = false, CaptureRate = 3 },
        Physical = new Physical { HeightM = 2.0, WeightKg = 122.0 },
        Types = new List<PokemonType>
        {
            new() { Name = "Psy", NameEn = "psychic", Slot = 1 }
        },
        Abilities = new List<Ability> { new() { Name = "Pression", NameEn = "pressure", IsHidden = false } },
        Description = new List<string> { "Mewtwo est un Pokémon qui a été créé par génie génétique." },
        Sprites = new Sprites { FrontDefault = "https://example.com/mewtwo.png" },
        EvolutionChain = new EvolutionChain { Count = 1, BasePokemon = "Mewtwo", Chain = new() }
    };

    public static Pokemon CreateMew() => new()
    {
        Id = "151",
        NumericId = 151,
        NameFr = "Mew",
        NameEn = "Mew",
        Category = "Pokémon Nouvelle Espèce",
        PokedexNumber = 151,
        Generation = new Generation { NameFr = "Génération I", NameEn = "generation-i" },
        Status = new Status { IsLegendary = false, IsMythical = true, CaptureRate = 45 },
        Physical = new Physical { HeightM = 0.4, WeightKg = 4.0 },
        Types = new List<PokemonType>
        {
            new() { Name = "Psy", NameEn = "psychic", Slot = 1 }
        },
        Abilities = new List<Ability> { new() { Name = "Synchronie", NameEn = "synchronize", IsHidden = false } },
        Description = new List<string> { "Mew est décrit dans le livre Pokémon rare." },
        Sprites = new Sprites { FrontDefault = "https://example.com/mew.png" },
        EvolutionChain = new EvolutionChain { Count = 1, BasePokemon = "Mew", Chain = new() }
    };

    public static List<Pokemon> CreateAllPokemons() => new()
    {
        CreateBulbizarre(),
        CreateSalamèche(),
        CreateMewtwo(),
        CreateMew(),
    };

    /// <summary>
    /// Crée une Partie "EnCours" avec un Pokémon à deviner et un hôte unique (mode solo).
    /// </summary>
    public static Partie CreateActivePartie(string hostId, Pokemon pokemon)
    {
        var partie = new Partie
        {
            Id = Guid.NewGuid().ToString(),
            CodeSession = "TEST01",
            Statut = PokéDesc.Domain.PartieStatut.EnCours,
            NbPokemons = 1,
            TimerDurationSeconds = 60,
            PokemonsToGuess = new List<Pokemon> { pokemon },
        };
        partie.InitHost(hostId, "Hôte");
        partie.GetPlayer(hostId)!.State.TimerStart = DateTime.UtcNow;
        partie.GetPlayer(hostId)!.State.TimeRemaining = 60.0;
        return partie;
    }
}
