using System.Collections.Concurrent;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain.Interfaces;

namespace PokéDesc.Business.Services;

/// <summary>
/// Implémentation in-memory de <see cref="IMiniGameStore{TState}"/>.
/// Thread-safe via <see cref="ConcurrentDictionary{TKey,TValue}"/>.
/// Enregistré comme Singleton dans le DI (open-generic).
/// </summary>
public class MiniGameStore<TState> : IMiniGameStore<TState> where TState : class, IMiniGameState
{
    private readonly ConcurrentDictionary<string, TState> _store = new();

    public TState? Get(string partieId)
        => _store.TryGetValue(partieId, out var state) ? state : null;

    public void Set(string partieId, TState state)
        => _store[partieId] = state;

    public void Cleanup(TimeSpan ttl)
    {
        var cutoff = DateTime.UtcNow - ttl;
        foreach (var key in _store.Keys)
        {
            if (_store.TryGetValue(key, out var s) && s.CreatedAt < cutoff)
                _store.TryRemove(key, out _);
        }
    }
}
