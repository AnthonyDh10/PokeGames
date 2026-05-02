using System.Text.Json.Serialization;

namespace PokéDesc.Domain.Models;

public class Stats
{
    [JsonPropertyName("PV")]
    public Stat PV { get; set; }

    [JsonPropertyName("Attaque")]
    public Stat Attaque { get; set; }

    [JsonPropertyName("Défense")]
    public Stat Defense { get; set; }

    [JsonPropertyName("Attaque Spé.")]
    public Stat AttaqueSpe { get; set; }

    [JsonPropertyName("Défense Spé.")]
    public Stat DefenseSpe { get; set; }

    [JsonPropertyName("Vitesse")]
    public Stat Vitesse { get; set; }
}
