import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Interface du store de session joueur.
 * Ces données sont persistées dans le `localStorage` et surviennent aux rechargements de page.
 */
interface SessionStore {
  /** UUID unique généré automatiquement à la première visite. Sert d'identifiant joueur. */
  sessionId: string
  /** Pseudo saisi par le joueur dans le lobby avant d'entrer en partie. */
  playerName: string
  /** Met à jour le pseudo du joueur. */
  setPlayerName: (name: string) => void
}

/**
 * Génère un identifiant de session unique via l'API Web Crypto.
 * Appelé une seule fois à la création du store si aucune valeur persistée n'existe.
 */
function generateSessionId(): string {
  return crypto.randomUUID()
}

/**
 * Store Zustand de session joueur, persisté dans le `localStorage`.
 *
 * Ce store gère :
 * - `sessionId` : un UUID généré une fois et conservé indéfiniment (remplace un compte utilisateur).
 * - `playerName` : le pseudo entré par le joueur, réutilisé à chaque session.
 *
 * Clé localStorage : `pokegames-session`.
 */
export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      playerName: '',
      setPlayerName: (name) => set({ playerName: name }),
    }),
    {
      name: 'pokegames-session',
    }
  )
)
