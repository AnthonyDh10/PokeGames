import { useState, useRef, useEffect } from 'react'
import { getTimer } from '../services/partieService'

export interface UseTimerReturn {
  timeRemaining: number
  timerShake: boolean
  timerFlash: boolean
  showTimePenalty: boolean
  currentTimePenalty: number
  hintAnimations: Record<string, number>
  timerDurationRef: React.MutableRefObject<number>
  startTimer: () => void
  stopTimer: () => void
  triggerHintAnimation: (hintKey: string, penalty: number) => Promise<void>
  triggerTimerAnimation: (penalty: number) => Promise<void>
}

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
    }, 100)
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
