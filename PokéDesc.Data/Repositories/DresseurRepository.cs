using PokéDesc.Domain;

namespace PokéDesc.Data.Repositories;

// DresseurRepository — stub sans base de données.
// Les comptes utilisateurs ont été abandonnés (pas d'authentification dans ce projet).
public class DresseurRepository
{
    public Task<Dresseur> GetByEmailAsync(string email) => Task.FromResult<Dresseur>(null!);
    public Task<Dresseur> GetByPseudoAsync(string pseudo) => Task.FromResult<Dresseur>(null!);
    public Task<Dresseur> GetByIdAsync(string id) => Task.FromResult<Dresseur>(null!);
    public Task CreateAsync(Dresseur dresseur) => Task.CompletedTask;
    public Task UpdateAsync(Dresseur dresseur) => Task.CompletedTask;
    public Task UpdatePokemonLevelAsync(string dresseurId, int pokemonId, int newLevel) => Task.CompletedTask;
}
