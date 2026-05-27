using PokéDesc.Data.Models;

namespace PokéDesc.Data.Repositories;

public interface ITypesRepository
{
    Task<List<TypeData>> GetAllAsync();
}
