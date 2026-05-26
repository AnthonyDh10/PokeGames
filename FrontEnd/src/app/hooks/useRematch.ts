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
 * Nombre maximal de tentatives de poll avant d'abandonner (~60 secondes).
 * Évite un polling infini si l'adversaire ne clique jamais sur Revanche.
 */
const MAX_POLL_ATTEMPTS = 60

/**
 * Gère le flow de revanche :
 * 1. Marque le joueur prêt via `markReadyFn` (appel unique)
 * 2. Si `rematchPartieId` est immédiatement disponible, navigue
 * 3. Sinon, poll toutes les secondes via `markReadyFn`.
 *    Note : `markReadyFn` est idempotent côté serveur (guard sur RematchPartieId),
 *    donc le rappeler en polling est équivalent à un GET de statut jusqu'à ce qu'un
 *    endpoint dédié soit ajouté au backend.
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
  const pollAttemptsRef = useRef(0)
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

      pollAttemptsRef.current = 0
      rematchPollRef.current = setInterval(async () => {
        pollAttemptsRef.current += 1

        if (pollAttemptsRef.current > MAX_POLL_ATTEMPTS) {
          clearInterval(rematchPollRef.current!)
          onError?.("L'adversaire n'a pas répondu à la demande de revanche.")
          setRematchRequested(false)
          return
        }

        try {
          // markReadyFn est idempotent : ré-appeler marque toujours le même joueur
          // prêt (no-op si déjà fait) et retourne le statut courant.
          const fresh = await markReadyFn(partieId, sessionId)
          if (fresh.rematchPartieId) {
            clearInterval(rematchPollRef.current!)
            navigate(`${gameRoute}/${fresh.rematchPartieId}`)
          }
        } catch {
          // Erreur réseau transitoire — on continue à poller
        }
      }, 1000)
    } catch {
      onError?.('Erreur lors de la demande de revanche.')
      setRematchRequested(false)
    }
  }

  return { rematchRequested, handleRematch }
}
