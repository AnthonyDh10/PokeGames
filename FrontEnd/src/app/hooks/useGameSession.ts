import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { useChenStore } from '../store/chenStore'
import { getPartie } from '../services/partieService'
import type { ChenMessage } from '../store/chenStore'

interface ChatContext {
  partieId: string
  sessionCode: string
  isSolo: boolean
}

export interface UseGameSessionReturn {
  sessionId: string
  navigate: ReturnType<typeof useNavigate>
  setChatContext: (ctx: ChatContext) => void
  addChenMessage: (msg: ChenMessage) => void
  clearChenMessages: () => void
  /** Appelle getPartie, configure le contexte chat et retourne le sessionCode + les générations. */
  loadSessionInfo: (partieId: string) => Promise<{ sessionCode: string; selectedGenerations: number[] }>
}

/**
 * Hook partagé qui encapsule le boilerplate commun aux 3 jeux :
 * navigate, sessionId, setChatContext, addChenMessage, clearChenMessages
 * et le chargement du contexte de session (getPartie → setChatContext).
 */
export function useGameSession(): UseGameSessionReturn {
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()
  const addChenMessage = useChenStore((state) => state.addMessage)
  const clearChenMessages = useChenStore((state) => state.clearMessages)

  async function loadSessionInfo(
    partieId: string,
  ): Promise<{ sessionCode: string; selectedGenerations: number[] }> {
    try {
      const p = await getPartie(partieId)
      setChatContext({
        partieId,
        sessionCode: p.codeSession ?? '',
        isSolo: !p.dresseur2Id,
      })
      return {
        sessionCode: p.codeSession ?? 'N/A',
        selectedGenerations: p.selectedGenerations ?? [],
      }
    } catch {
      return { sessionCode: 'N/A', selectedGenerations: [] }
    }
  }

  return { sessionId, navigate, setChatContext, addChenMessage, clearChenMessages, loadSessionInfo }
}
