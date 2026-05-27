using PokéDesc.Domain.Models;

namespace PokéDesc.Business.Interfaces;

public interface ITypesRepository
{
    Task<List<TypeData>> GetAllAsync();
}
