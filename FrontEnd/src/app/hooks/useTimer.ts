import { useState, useRef, useEffect } from 'react'
import { getTimer } from '../services/partieService'

/** Valeurs et actions exposées par le hook `useTimer`. */
export interface UseTimerReturn {
  /** Temps restant en secondes, synchronisé depuis le serveur. */
  timeRemaining: number
  /** `true` pendant l'animation de secousse du timer (utilisé en cas de pénalité). */
  timerShake: boolean
  /** `true` pendant l'animation de clignotement rouge du timer. */
  timerFlash: boolean
  /** `true` lorsque la pénalité de temps flottante doit être affichée. */
  showTimePenalty: boolean
  /** Valeur en secondes de la pénalité actuellement affichée. */
  currentTimePenalty: number
  /** Animations d'indice en cours : `{ [hintKey]: penaltySeconds }`. */
  hintAnimations: Record<string, number>
  /** Ref vers la durée totale du timer (en secondes), mise à jour depuis le serveur. */
  timerDurationRef: React.MutableRefObject<number>
  /** Démarre le polling serveur (à appeler après le chargement initial des données de jeu). */
  startTimer: () => void
  /** Arrête le polling serveur (ex : fin de partie, démontage). */
  stopTimer: () => void
  /** Déclenche l'animation flottante sur un indice et attend sa fin (1,5 s). */
  triggerHintAnimation: (hintKey: string, penalty: number) => Promise<void>
  /** Déclenche les animations shake + flash du timer et affiche la pénalité (≈ 1,5 s au total). */
  triggerTimerAnimation: (penalty: number) => Promise<void>
}

/**
 * Hook gérant le timer de jeu côté client.
 *
 * **Architecture** : le timer est entièrement piloté par le serveur.
 * Le client interroge `GET /api/partie/:id/timer/:sessionId` toutes les **secondes**
 * pour synchroniser `timeRemaining`. Il n'y a pas de décompte local.
 *
 * **Gestion du timeout** : quand `timeRemaining` atteint 0 (et que la partie n'est pas
 * en mode chronomètre, i.e. `timerDurationSeconds !== -1`), le callback `onTimeout` est
 * déclenché une seule fois via `isTimeoutRef`, puis le polling est stoppé.
 *
 * **Animations** : les fonctions `triggerHintAnimation` et `triggerTimerAnimation`
 * pilotent les états visuels (shake, flash, pénalité flottante) via des délais async.
 *
 * @param partieId - Identifiant de la partie courante. Si `undefined`, le polling ne démarre pas.
 * @param sessionId - UUID de session du joueur (transmis au serveur pour le timer individuel).
 * @param onTimeout - Callback appelé une seule fois quand le temps est écoulé.
 */
export function useTimer({
  partieId,
  sessionId,
  onTimeout,
}: {
  partieId: string | undefined
  sessionId: string
  onTimeout: () => void
}): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [timerShake, setTimerShake] = useState(false)
  const [timerFlash, setTimerFlash] = useState(false)
  const [showTimePenalty, setShowTimePenalty] = useState(false)
  const [currentTimePenalty, setCurrentTimePenalty] = useState(0)
  const [hintAnimations, setHintAnimations] = useState<Record<string, number>>({})

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isTimeoutRef = useRef(false)
  const timerDurationRef = useRef<number>(60)
  // Stable ref to always call the latest onTimeout without stale closures
  const onTimeoutRef = useRef(onTimeout)
  useEffect(() => { onTimeoutRef.current = onTimeout }, [onTimeout])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  function startTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
    isTimeoutRef.current = false
    intervalRef.current = setInterval(async () => {
      if (!partieId) return
      try {
        const result = await getTimer(partieId, sessionId)
        setTimeRemaining(result.timeRemaining)
        // Synchronise timerDurationRef avec la valeur serveur pour garantir
        // que les animations affichent les secondes exactes mêmes si la partie
        // a été reconfigurée après le premier chargement.
        if (result.timerDurationSeconds !== undefined) {
          timerDurationRef.current = result.timerDurationSeconds
        }
        if (result.timeRemaining <= 0 && !isTimeoutRef.current && timerDurationRef.current !== -1) {
          isTimeoutRef.current = true
          clearInterval(intervalRef.current!)
          onTimeoutRef.current()
        }
      } catch (err) {
        console.warn('[Timer] Erreur lors de la récupération du timer :', err)
      }
    }, 1000)
  }

  function stopTimer() {
    if (intervalRef.current) clearInterval(intervalRef.current)
  }

  async function triggerHintAnimation(hintKey: string, penalty: number) {
    setHintAnimations((prev) => ({ ...prev, [hintKey]: penalty }))
    await new Promise((r) => setTimeout(r, 1500))
    setHintAnimations((prev) => {
      const next = { ...prev }
      delete next[hintKey]
      return next
    })
  }

  async function triggerTimerAnimation(penalty: number) {
    setCurrentTimePenalty(penalty)
    setShowTimePenalty(true)
    setTimerFlash(true)
    setTimerShake(true)
    await new Promise((r) => setTimeout(r, 300))
    setTimerFlash(false)
    await new Promise((r) => setTimeout(r, 200))
    setTimerShake(false)
    await new Promise((r) => setTimeout(r, 1000))
    setShowTimePenalty(false)
  }

  return {
    timeRemaining,
    timerShake,
    timerFlash,
    showTimePenalty,
    currentTimePenalty,
    hintAnimations,
    timerDurationRef,
    startTimer,
    stopTimer,
    triggerHintAnimation,
    triggerTimerAnimation,
  }
}
