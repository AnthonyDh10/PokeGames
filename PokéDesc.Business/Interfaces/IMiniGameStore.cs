namespace PokéDesc.Business.Interfaces;

/// <summary>
/// Stockage in-memory générique pour les mini-jeux (DeZoom, TypesGame).
/// Remplace les <c>static Dictionary</c> internes à chaque service par une
/// abstraction injectable, testable et sans état global.
/// </summary>
public interface IMiniGameStore<TState> where TState : class, PokéDesc.Domain.Interfaces.IMiniGameState
{
    TState? Get(string partieId);
    void Set(string partieId, TState state);
    /// <summary>Supprime les états plus vieux que <paramref name="ttl"/>.</summary>
    void Cleanup(TimeSpan ttl);
}
