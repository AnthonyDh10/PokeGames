namespace PokéDesc.Domain.Models;

public class EvolutionChain
{
    public int Count { get; set; }
    public string BasePokemon { get; set; }
    public List<EvolutionMember> Chain { get; set; }
}
