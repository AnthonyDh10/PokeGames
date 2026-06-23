import * as signalR from '@microsoft/signalr'
import type { PartieDto } from '../types/partie'

/** URL du hub SignalR du lobby/jeu, construite à partir de la variable d'environnement `VITE_API_URL`. */
const HUB_URL = `${import.meta.env.VITE_API_URL ?? 'http://localhost:5122'}/gameHub`

/** Callbacks fournis par le composant pour réagir aux événements poussés par le serveur. */
export interface LobbyHandlers {
  /** Appelé à chaque mise à jour d'état de la partie (arrivée d'un joueur, settings, guess…). */
  onLobbyUpdated?: (partie: PartieDto) => void
  /** Appelé quand la partie démarre — sert à rediriger vers l'écran de jeu. */
  onGameStarted?: (partie: PartieDto) => void
}

/**
 * Service temps réel du lobby basé sur SignalR (GameHub).
 *
 * Remplace le polling HTTP du lobby : le serveur pousse l'état de la partie
 * via les événements `LobbyUpdated` et `GameStarted`. Calqué sur `chatService`.
 *
 * Exposé comme singleton (`lobbyService`) — ne pas instancier directement.
 */
class LobbyService {
  private connection: signalR.HubConnection | null = null
  private currentRoom: string | null = null
  private handlers: LobbyHandlers = {}

  /** Construit une connexion SignalR avec reconnexion automatique. */
  private buildConnection(): signalR.HubConnection {
    return new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { withCredentials: true })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build()
  }

  /**
   * Connecte le joueur au groupe SignalR d'une partie et s'abonne à ses mises à jour.
   * Si une connexion à la même salle est déjà active, seuls les handlers sont rafraîchis.
   * Si une connexion à une autre salle existe, elle est préalablement fermée.
   *
   * @param partieId - Identifiant de la partie (= identifiant du groupe).
   * @param handlers - Callbacks à invoquer sur les événements serveur.
   */
  async connect(partieId: string, handlers: LobbyHandlers): Promise<void> {
    this.handlers = handlers

    // Déjà connecté à cette salle — on a juste mis à jour les handlers.
    if (this.connection && this.currentRoom === partieId) return

    // Connecté à une autre salle — on la quitte proprement avant de rejoindre.
    await this.disconnect()
    this.handlers = handlers

    this.connection = this.buildConnection()

    this.connection.on('LobbyUpdated', (partie: PartieDto) => {
      this.handlers.onLobbyUpdated?.(partie)
    })
    this.connection.on('GameStarted', (partie: PartieDto) => {
      this.handlers.onGameStarted?.(partie)
    })

    try {
      await this.connection.start()
      await this.connection.invoke('JoinRoom', partieId)
      this.currentRoom = partieId
    } catch (err) {
      console.error('[LobbyService] Échec de la connexion au hub :', err)
      this.connection = null
      this.currentRoom = null
    }
  }

  /**
   * Quitte la salle courante et ferme la connexion SignalR proprement.
   * Les erreurs de déconnexion sont silencieuses.
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
      this.handlers = {}
    }
  }

  /** `true` si la connexion SignalR est dans l'état `Connected`. */
  get isConnected(): boolean {
    return this.connection?.state === signalR.HubConnectionState.Connected
  }
}

/** Instance singleton du service de lobby — à importer directement dans les composants. */
export const lobbyService = new LobbyService()
