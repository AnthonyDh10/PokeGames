using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Models;

public class PokemonHints
{
    public string? Category { get; set; }
    public Generation? Generation { get; set; }
    public Region? Region { get; set; }
    public List<PokemonType>? Types { get; set; }
    public Status? Status { get; set; }
    public Breeding? Breeding { get; set; }
    public Physical? Physical { get; set; }
    public List<Ability>? Abilities { get; set; }
    public Stats? Stats { get; set; }
    public Sprites? Sprites { get; set; }
    public Cries? Cries { get; set; }
    public int EvolutionChainCount { get; set; }
}
