using System.Collections.Concurrent;
using PokéDesc.Business.Interfaces;
using PokéDesc.Domain;

namespace PokéDesc.Business.Services;

/// <summary>
/// Stockage in-memory des parties actives.
/// Thread-safe via ConcurrentDictionary + SemaphoreSlim par partie.
/// </summary>
public class GameSessionStore : IGameSessionStore
{
    private readonly ConcurrentDictionary<string, Partie> _gameStore = new();
    private readonly ConcurrentDictionary<string, SemaphoreSlim> _gameLocks = new();

    public void Add(Partie partie)
        => _gameStore.TryAdd(partie.Id, partie);

    public Partie Get(string partieId)
    {
        if (!_gameStore.TryGetValue(partieId, out var partie))
            throw new KeyNotFoundException("Partie introuvable.");
        return partie;
    }

    public Partie? FindByCode(string codeSession)
    {
        var normalized = codeSession?.Trim().ToUpper();
        return _gameStore.Values.FirstOrDefault(p =>
            p.CodeSession?.Trim().ToUpper() == normalized);
    }

    public SemaphoreSlim GetOrCreateLock(string partieId)
        => _gameLocks.GetOrAdd(partieId, _ => new SemaphoreSlim(1, 1));

    public void Cleanup(TimeSpan ttl)
    {
        var cutoff = DateTime.UtcNow - ttl;
        foreach (var key in _gameStore.Keys)
        {
            if (_gameStore.TryGetValue(key, out var p) && p.CreatedAt < cutoff)
            {
                if (_gameStore.TryRemove(key, out _))
                    _gameLocks.TryRemove(key, out _);
            }
        }
    }
}
