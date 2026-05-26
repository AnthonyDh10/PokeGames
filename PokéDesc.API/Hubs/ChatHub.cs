using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;

namespace PokéDesc.API.Hubs;

public record ChatMessage(string SenderName, string Text, string Timestamp);

public class ChatHub : Hub
{
    private static readonly ConcurrentDictionary<string, List<ChatMessage>> _history = new();
    private static readonly ConcurrentDictionary<string, DateTime> _roomLastActivity = new();
    private const int MaxHistoryPerRoom = 50;
    private static readonly TimeSpan RoomTtl = TimeSpan.FromHours(24);

    public async Task JoinRoom(string partieId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, partieId);
        _roomLastActivity[partieId] = DateTime.UtcNow;

        // Snapshot la liste pendant le lock pour ne pas await à l'intérieur
        List<ChatMessage>? snapshot = null;
        if (_history.TryGetValue(partieId, out var history))
        {
            lock (history)
            {
                snapshot = history.ToList();
            }
        }

        if (snapshot != null)
        {
            foreach (var msg in snapshot)
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

        _roomLastActivity[partieId] = DateTime.UtcNow;
        CleanupExpiredRooms();

        await Clients.Group(partieId).SendAsync("ReceiveMessage", senderName, text.Trim(), timestamp);
    }

    private static void CleanupExpiredRooms()
    {
        var cutoff = DateTime.UtcNow - RoomTtl;
        foreach (var (key, lastActivity) in _roomLastActivity)
        {
            if (lastActivity < cutoff)
            {
                _history.TryRemove(key, out _);
                _roomLastActivity.TryRemove(key, out _);
            }
        }
    }
}
