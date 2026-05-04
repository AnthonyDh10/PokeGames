namespace PokéDesc.Domain.Models;

public class EvolutionMember
{
    public string Name { get; set; }
    public int Level { get; set; }
    public bool IsBaby { get; set; }
    public List<EvolutionDetail> EvolutionDetails { get; set; } = new();
}
