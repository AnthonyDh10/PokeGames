using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace PokéDesc.API.Hubs;

public record ChatMessage(string SenderName, string Text, string Timestamp);

public class ChatHub : Hub
{
    private static readonly ConcurrentDictionary<string, List<ChatMessage>> _history = new();
    private const int MaxHistoryPerRoom = 50;

    public async Task JoinRoom(string partieId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, partieId);

        // Send message history to the joining client
        if (_history.TryGetValue(partieId, out var history))
        {
            foreach (var msg in history)
            {
                await Clients.Caller.SendAsync("ReceiveMessage", msg.SenderName, msg.Text, msg.Timestamp);
            }
        }
    }

    public async Task LeaveRoom(string partieId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, partieId);
    }

    public async Task SendMessage(string partieId, string senderName, string text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length > 500) return;

        var timestamp = DateTime.UtcNow.ToString("HH:mm");
        var message = new ChatMessage(senderName, text.Trim(), timestamp);

        var roomHistory = _history.GetOrAdd(partieId, _ => new List<ChatMessage>());
        lock (roomHistory)
        {
            roomHistory.Add(message);
            if (roomHistory.Count > MaxHistoryPerRoom)
                roomHistory.RemoveAt(0);
        }

        await Clients.Group(partieId).SendAsync("ReceiveMessage", senderName, text.Trim(), timestamp);
    }
}
