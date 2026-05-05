import * as signalR from '@microsoft/signalr'
import { useChatStore } from '../store/chatStore'

const HUB_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5122'}/chatHub`

class ChatService {
  private connection: signalR.HubConnection | null = null
  private currentRoom: string | null = null

  private buildConnection(): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()
  }

  async connect(partieId: string, playerName: string): Promise<void> {
    // Already connected to this room — nothing to do
    if (this.connection && this.currentRoom === partieId) return

    // Connected to a different room — leave it first
    await this.disconnect()

    this.connection = this.buildConnection()

    this.connection.on('ReceiveMessage', (senderName: string, text: string, timestamp: string) => {
      const { addMessage, sessionCode: _sc } = useChatStore.getState()
      // We mark as "own" if this sender matches the current player name
      // (best-effort; use sessionId comparison if name collisions are a concern)
      const isOwn = senderName === playerName
      addMessage({ senderName, text, timestamp, isOwn })
    })

    try {
      await this.connection.start()
      await this.connection.invoke('JoinRoom', partieId)
      this.currentRoom = partieId
    } catch (err) {
      console.error('[ChatService] Connection failed:', err)
      this.connection = null
      this.currentRoom = null
    }
  }

  async sendMessage(partieId: string, senderName: string, text: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return
    try {
      await this.connection.invoke('SendMessage', partieId, senderName, text)
    } catch (err) {
      console.error('[ChatService] SendMessage failed:', err)
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return
    try {
      if (this.currentRoom) {
        await this.connection.invoke('LeaveRoom', this.currentRoom).catch(() => {})
      }
      await this.connection.stop()
    } catch {
      // ignore disconnect errors
    } finally {
      this.connection = null
      this.currentRoom = null
    }
  }

  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

// Singleton
export const chatService = new ChatService()
