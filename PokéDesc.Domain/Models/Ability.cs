namespace PokéDesc.Domain.Models;

public class Ability
{
    public string Name { get; set; }
    public string NameEn { get; set; }
    public bool IsHidden { get; set; }
    public int Slot { get; set; }
}
