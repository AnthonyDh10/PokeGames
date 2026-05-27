using PokéDesc.Domain.Models;

namespace PokéDesc.Domain.Interfaces;

public interface ITypesRepository
{
    Task<List<TypeData>> GetAllAsync();
}
