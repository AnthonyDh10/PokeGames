using System.Text.Json;
using PokéDesc.Domain.Interfaces;
using PokéDesc.Domain.Models;

namespace PokéDesc.Data.Repositories;

public class TypesRepository : ITypesRepository
{
    private readonly List<TypeData> _types;

    public TypesRepository(string dataPath)
    {
        var json = File.ReadAllText(Path.Combine(dataPath, "all_types.json"));
        _types = JsonSerializer.Deserialize<List<TypeData>>(json) ?? new();

        if (_types.Count < 2)
            throw new InvalidOperationException("Au moins 2 types sont nécessaires pour le jeu.");
    }

    public Task<List<TypeData>> GetAllAsync() => Task.FromResult(_types.ToList());
}
