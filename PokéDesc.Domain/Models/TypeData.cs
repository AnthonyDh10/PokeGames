using System.Text.Json.Serialization;

namespace PokéDesc.Domain.Models;

public class TypeDamageRef
{
    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;
}

public class TypeDamageRelations
{
    [JsonPropertyName("double_damage_from")]
    public List<TypeDamageRef> DoubleDamageFrom { get; set; } = new();

    [JsonPropertyName("half_damage_from")]
    public List<TypeDamageRef> HalfDamageFrom { get; set; } = new();

    [JsonPropertyName("no_damage_from")]
    public List<TypeDamageRef> NoDamageFrom { get; set; } = new();
}

public class TypeData
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("name_fr")]
    public string NameFr { get; set; } = string.Empty;

    [JsonPropertyName("name_en")]
    public string NameEn { get; set; } = string.Empty;

    [JsonPropertyName("damage_relations")]
    public TypeDamageRelations DamageRelations { get; set; } = new();
}
