using Microsoft.AspNetCore.SignalR;

namespace PokéDesc.API.Hubs;

/// <summary>
/// Hub temps réel du lobby et du gameplay PokéDesc.
/// Calqué sur <see cref="ChatHub"/> : chaque partie est un groupe SignalR identifié par son partieId.
/// Le serveur pousse l'état de la partie au groupe via <c>LobbyUpdated</c> / <c>GameStarted</c>
/// (envoyés depuis LobbyNotifier), remplaçant le polling HTTP du lobby.
/// </summary>
public class GameHub : Hub
{
    /// <summary>Inscrit la connexion appelante au groupe de la partie pour recevoir ses mises à jour.</summary>
    public async Task JoinRoom(string partieId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, partieId);
    }

    /// <summary>Retire la connexion appelante du groupe de la partie.</summary>
    public async Task LeaveRoom(string partieId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, partieId);
    }
}
