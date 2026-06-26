using Microsoft.AspNetCore.SignalR;
using PokéDesc.API.DTOs;
using PokéDesc.API.Hubs;
using PokéDesc.Business.Interfaces;

namespace PokéDesc.API.Services;

/// <summary>
/// Implémentation de <see cref="ILobbyNotifier"/> via <see cref="IHubContext{GameHub}"/>.
/// Sérialise la partie en <see cref="PartieResponseDto"/> (même contrat que les réponses REST)
/// et la diffuse au groupe SignalR identifié par le partieId.
/// </summary>
public class LobbyNotifier : ILobbyNotifier
{
    private readonly IHubContext<GameHub> _hub;
    private readonly IGameSessionStore _sessionStore;

    public LobbyNotifier(IHubContext<GameHub> hub, IGameSessionStore sessionStore)
    {
        _hub = hub;
        _sessionStore = sessionStore;
    }

    public Task NotifyLobbyUpdated(string partieId) => Broadcast(partieId, "LobbyUpdated");

    public Task NotifyGameStarted(string partieId) => Broadcast(partieId, "GameStarted");

    public Task NotifyPlayerKicked(string partieId, string targetId)
        => _hub.Clients.Group(partieId).SendAsync("PlayerKicked", targetId);

    private async Task Broadcast(string partieId, string eventName)
    {
        // La partie peut avoir été nettoyée entre-temps : on ignore silencieusement.
        Domain.Partie partie;
        try
        {
            partie = _sessionStore.Get(partieId);
        }
        catch (KeyNotFoundException)
        {
            return;
        }

        var dto = PartieResponseDto.FromPartie(partie);
        await _hub.Clients.Group(partieId).SendAsync(eventName, dto);
    }
}
