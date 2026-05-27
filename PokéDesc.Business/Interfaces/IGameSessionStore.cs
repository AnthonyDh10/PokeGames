using PokéDesc.Domain;

namespace PokéDesc.Business.Interfaces;

/// <summary>
/// Responsabilité unique : stocker et retrouver les Partie en mémoire.
/// Isole l'infrastructure in-memory de la logique de jeu dans PartieService.
/// </summary>
public interface IGameSessionStore
{
    void Add(Partie partie);
    Partie Get(string partieId);
    Partie? FindByCode(string codeSession);
    SemaphoreSlim GetOrCreateLock(string partieId);
    void Cleanup(TimeSpan ttl);
}
