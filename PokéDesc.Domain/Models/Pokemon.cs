using System.Text.Json.Serialization;

namespace PokéDesc.Domain.Models;

public class Pokemon
{
    // Rempli par le repository après désérialisation (= PokedexNumber.ToString())
    [JsonIgnore]
    public string Id { get; set; }

    [JsonPropertyName("id")]
    public int NumericId { get; set; }

    public string NameFr { get; set; }
    public string NameEn { get; set; }
    public string Category { get; set; }
    public int PokedexNumber { get; set; }
    public Generation Generation { get; set; }
    public Region Region { get; set; }
    public Status Status { get; set; }
    public Breeding Breeding { get; set; }
    public Physical Physical { get; set; }
    public List<PokemonType> Types { get; set; }
    public List<Ability> Abilities { get; set; }
    public int FormsCount { get; set; }
    public Stats Stats { get; set; }
    public Sprites Sprites { get; set; }
    public Cries Cries { get; set; }
    public List<string> Moves { get; set; }
    public int MovesCount { get; set; }
    public string Description { get; set; }
    public EvolutionChain EvolutionChain { get; set; }
}
