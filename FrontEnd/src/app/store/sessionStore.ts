import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SessionStore {
  sessionId: string
  playerName: string
  setPlayerName: (name: string) => void
}

function generateSessionId(): string {
  return crypto.randomUUID()
}

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
