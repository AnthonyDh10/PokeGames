namespace PokéDesc.Domain.Models;

public class PokeApiReference
{
    public string Name { get; set; }
    public string Url { get; set; }
}

public class EvolutionDetail
{
    public PokeApiReference? BaseForm { get; set; }
    public int? Gender { get; set; }
    public PokeApiReference? HeldItem { get; set; }
    public PokeApiReference? Item { get; set; }
    public PokeApiReference? KnownMove { get; set; }
    public PokeApiReference? KnownMoveType { get; set; }
    public PokeApiReference? Location { get; set; }
    public int? MinAffection { get; set; }
    public int? MinBeauty { get; set; }
    public int? MinDamageTaken { get; set; }
    public int? MinHappiness { get; set; }
    public int? MinLevel { get; set; }
    public int? MinMoveCount { get; set; }
    public int? MinSteps { get; set; }
    public bool NeedsMultiplayer { get; set; }
    public bool NeedsOverworldRain { get; set; }
    public PokeApiReference? PartySpecies { get; set; }
    public PokeApiReference? PartyType { get; set; }
    public PokeApiReference? Region { get; set; }
    public int? RelativePhysicalStats { get; set; }
    public string? TimeOfDay { get; set; }
    public PokeApiReference? TradeSpecies { get; set; }
    public EvolutionTrigger? Trigger { get; set; }
    public bool TurnUpsideDown { get; set; }
    public PokeApiReference? UsedMove { get; set; }
}

public class EvolutionTrigger
{
    public string Name { get; set; }
    public string Url { get; set; }
}

