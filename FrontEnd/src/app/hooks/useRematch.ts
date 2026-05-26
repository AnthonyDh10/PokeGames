import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

type MarkReadyFn = (
  partieId: string,
  sessionId: string,
) => Promise<{ rematchPartieId?: string }>

interface UseRematchOptions {
  partieId: string | undefined
  sessionId: string
  /** Fonction propre à chaque jeu (markRematchReady, markDeZoomRematchReady…). */
  markReadyFn: MarkReadyFn
  /** Route de base du jeu (ex: "/pokedesc", "/types", "/dezoom"). */
  gameRoute: string
  /** Appelé avec un message d'erreur si la demande de revanche échoue. */
  onError?: (message: string) => void
}

interface UseRematchReturn {
  rematchRequested: boolean
  handleRematch: () => Promise<void>
}

/**
 * Gère le flow de revanche :
 * 1. Marque le joueur prêt via `markReadyFn`
 * 2. Si `rematchPartieId` est immédiatement disponible, navigue
 * 3. Sinon, lance un poll toutes les secondes jusqu'à l'obtenir
 */
export function useRematch({
  partieId,
  sessionId,
  markReadyFn,
  gameRoute,
  onError,
}: UseRematchOptions): UseRematchReturn {
  const navigate = useNavigate()
  const rematchPollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [rematchRequested, setRematchRequested] = useState(false)

  // Nettoyage du poll au démontage du composant
  useEffect(() => {
    return () => {
      if (rematchPollRef.current) clearInterval(rematchPollRef.current)
    }
  }, [])

  async function handleRematch() {
    if (!partieId) return
    setRematchRequested(true)
    try {
      const status = await markReadyFn(partieId, sessionId)
      if (status.rematchPartieId) {
        navigate(`${gameRoute}/${status.rematchPartieId}`)
        return
      }
      rematchPollRef.current = setInterval(async () => {
        try {
          const fresh = await markReadyFn(partieId, sessionId)
          if (fresh.rematchPartieId) {
            clearInterval(rematchPollRef.current!)
            navigate(`${gameRoute}/${fresh.rematchPartieId}`)
          }
        } catch {
          // silent — on continue à poller
        }
      }, 1000)
    } catch {
      onError?.('Erreur lors de la demande de revanche.')
      setRematchRequested(false)
    }
  }

  return { rematchRequested, handleRematch }
}
