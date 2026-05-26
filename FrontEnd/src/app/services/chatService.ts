import * as signalR from '@microsoft/signalr'
import { useChatStore } from '../store/chatStore'

/** URL du hub SignalR, construite à partir de la variable d'environnement `VITE_API_URL`. */
const HUB_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5122'}/chatHub`

/**
 * Service de chat en temps réel basé sur SignalR.
 *
 * Gère le cycle de vie d'une connexion WebSocket vers le ChatHub :
 * connexion à une salle, réception et envoi de messages, déconnexion propre.
 *
 * Ce service est exposé comme un singleton (`chatService`).
 * Ne pas instancier directement — utiliser `chatService` importé depuis ce module.
 */
class ChatService {
  private connection: signalR.HubConnection | null = null
  private currentRoom: string | null = null

  /**
   * Construit une nouvelle connexion SignalR avec reconnexion automatique
   * et journalisation limitée aux avertissements.
   */
  private buildConnection(): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()
  }

  /**
   * Connecte le joueur à la salle de chat d'une partie.
   * Si une connexion à la même salle est déjà active, l'appel est ignoré.
   * Si une connexion à une autre salle existe, elle est préalablement fermée.
   *
   * @param partieId - Identifiant de la salle (= identifiant de la partie).
   * @param playerName - Nom du joueur, utilisé pour marquer ses propres messages.
   */
  async connect(partieId: string, playerName: string): Promise<void> {
    // Déjà connecté à cette salle — rien à faire.
    if (this.connection && this.currentRoom === partieId) return

    // Connecté à une autre salle — on la quitte proprement avant de rejoindre.
    await this.disconnect()

    this.connection = this.buildConnection()

    this.connection.on('ReceiveMessage', (senderName: string, text: string, timestamp: string) => {
      const { addMessage, sessionCode: _sc } = useChatStore.getState()
      // On marque le message comme "le sien" si le nom de l'expéditeur correspond
      // au nom du joueur local (approximation — préférer une comparaison par sessionId
      // si les collisions de pseudo sont un risque accepté).
      const isOwn = senderName === playerName
      addMessage({ senderName, text, timestamp, isOwn })
    })

    try {
      await this.connection.start()
      await this.connection.invoke('JoinRoom', partieId)
      this.currentRoom = partieId
    } catch (err) {
      console.error('[ChatService] Échec de la connexion au hub :', err)
      this.connection = null
      this.currentRoom = null
    }
  }

  /**
   * Envoie un message dans la salle de chat de la partie.
   * Sans effet si la connexion est absente ou dans un état non connecté.
   *
   * @param partieId - Identifiant de la salle destinataire.
   * @param senderName - Nom affiché de l'expéditeur.
   * @param text - Contenu du message.
   */
  async sendMessage(partieId: string, senderName: string, text: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return
    try {
      await this.connection.invoke('SendMessage', partieId, senderName, text)
    } catch (err) {
      console.error('[ChatService] Échec de l\'envoi du message :', err)
    }
  }

  /**
   * Quitte la salle courante et ferme la connexion SignalR proprement.
   * Les erreurs de déconnexion sont silencieuses (elles ne bloquent pas le flux applicatif).
   */
  async disconnect(): Promise<void> {
    if (!this.connection) return
    try {
      if (this.currentRoom) {
        await this.connection.invoke('LeaveRoom', this.currentRoom).catch(() => {})
      }
      await this.connection.stop()
    } catch {
      // Erreurs de déconnexion ignorées volontairement.
    } finally {
      this.connection = null
      this.currentRoom = null
    }
  }

  /** `true` si la connexion SignalR est dans l'état `Connected`. */
  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

/** Instance singleton du service de chat — à importer directement dans les composants. */
export const chatService = new ChatService()
