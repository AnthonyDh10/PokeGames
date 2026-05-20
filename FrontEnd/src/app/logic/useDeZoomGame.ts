import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { useChenStore } from '../store/chenStore'
import { getDeZoomGame, submitDeZoomGuess } from '../services/dezoomService'
import { getAllPokemons } from '../services/pokemonService'
import { getPartie } from '../services/partieService'
import { generationToNumber } from '../utils/pokedescLogic'
import type { PokemonDto } from '../types/pokemon'
import type { DeZoomGameDto } from '../types/dezoom'

export const DISPLAY_SCALE = 4
export const SPRITE_DISPLAY = 96 * DISPLAY_SCALE // 384px
const WINDOW_STEPS = [16, 24, 32, 96] // tailles en px sprite (3 étapes = 3 tentatives)

export interface UseDeZoomGameReturn {
  game: DeZoomGameDto | null
  isLoading: boolean
  errorMessage: string
  sessionCode: string
  selectedGenerations: number[]
  stepIndex: number
  selectedPokemon: PokemonDto | null
  searchTerm: string
  filterType1: string
  filterType2: string
  isSubmitting: boolean
  wrongMessage: string
  elapsed: number
  attemptCount: number
  allTypes: { id: number; nameFr: string }[]
  filteredPokemons: PokemonDto[]
  windowSpritePx: number
  windowDisplayPx: number
  windowOffset: number
  handleSubmit: (e: React.FormEvent) => Promise<void>
  setSelectedPokemon: React.Dispatch<React.SetStateAction<PokemonDto | null>>
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>
  setFilterType1: React.Dispatch<React.SetStateAction<string>>
  setFilterType2: React.Dispatch<React.SetStateAction<string>>
}

export function useDeZoomGame(partieId: string | undefined): UseDeZoomGameReturn {
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()
  const addChenMessage = useChenStore((state) => state.addMessage)
  const clearChenMessages = useChenStore((state) => state.clearMessages)

  const [game, setGame] = useState<DeZoomGameDto | null>(null)
  const [pokemons, setPokemons] = useState<PokemonDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([])

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType1, setFilterType1] = useState('')
  const [filterType2, setFilterType2] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wrongMessage, setWrongMessage] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pokémons filtrés par générations actives (lobby settings)
  const generationFilteredPokemons = selectedGenerations.length > 0
    ? pokemons.filter((p) => {
        const genNumber = p.generation?.nameEn ? generationToNumber(p.generation.nameEn) : null
        return genNumber !== null && selectedGenerations.includes(genNumber)
      })
    : pokemons

  // Listes dédupliquées pour les filtres de type
  const allTypes = [...new Set(
    generationFilteredPokemons.flatMap(p => p.types ?? []).map(t => t.name)
  )].sort((a, b) => a.localeCompare(b)).map((t, i) => ({ id: i, nameFr: t }))

  const filteredPokemons = generationFilteredPokemons.filter((p) => {
    if (searchTerm.trim() && !p.nameFr.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterType1 && p.types?.find(t => t.slot === 1)?.name !== filterType1) return false
    if (filterType2) {
      const slot2 = p.types?.find(t => t.slot === 2)?.name
      if (slot2 !== filterType2) return false
    }
    return true
  })

  // Calculs d'affichage pour l'effet de zoom pixelisé
  const windowSpritePx = WINDOW_STEPS[stepIndex]
  const windowDisplayPx = windowSpritePx * DISPLAY_SCALE
  const windowOffset = ((96 - windowSpritePx) / 2) * DISPLAY_SCALE

  useEffect(() => {
    if (!partieId) return
    setIsLoading(true)
    ;(async () => {
      try {
        const [g, pkms] = await Promise.all([getDeZoomGame(partieId, sessionId), getAllPokemons()])
        setGame(g)
        setAttemptCount(g.attemptCount)
        setPokemons(pkms.sort((a, b) => a.nameFr.localeCompare(b.nameFr)))
        try {
          const p = await getPartie(partieId)
          setSessionCode(p.codeSession ?? 'N/A')
          if (p.selectedGenerations?.length > 0) {
            setSelectedGenerations(p.selectedGenerations)
          }
          setChatContext({
            partieId,
            sessionCode: p.codeSession ?? '',
            isSolo: !p.dresseur2Id,
          })
        } catch {
          setSessionCode('N/A')
        }
        clearChenMessages()
        timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000)
      } catch {
        setErrorMessage('Impossible de charger la partie.')
      } finally {
        setIsLoading(false)
      }
    })()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [partieId, sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPokemon || isSubmitting || !game) return

    setIsSubmitting(true)
    setWrongMessage('')
    try {
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)
      const res = await submitDeZoomGuess(
        partieId!,
        sessionId,
        selectedPokemon.nameFr,
        elapsed,
        newAttemptCount,
      )

      if (res.isCorrect) {
        if (timerRef.current) clearInterval(timerRef.current)
        navigate(`/resultats-dezoom/${partieId}`, { state: { sessionCode } })
        return
      }

      const newStepIndex = Math.min(stepIndex + 1, WINDOW_STEPS.length - 1)
      setStepIndex(newStepIndex)
      setWrongMessage(res.message)
      setSelectedPokemon(null)
      setSearchTerm('')

      // Ajouter un message Chen avec proximité (sauf au game over)
      if (newAttemptCount < 3) {
        addChenMessage({
          text: res.message,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          proximityResult: {
            hasOneTypeInCommon: res.hasOneTypeInCommon,
            hasPerfectTypeMatch: res.hasPerfectTypeMatch,
            hasSameGeneration: res.hasSameGeneration,
            isInSameEvolutionChain: res.isInSameEvolutionChain,
          },
        })
      }

      // 3ème mauvaise tentative → naviguer après l'animation
      if (newAttemptCount >= 3) {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeout(() => {
          navigate(`/resultats-dezoom/${partieId}`, { state: { sessionCode } })
        }, 800)
      }
    } catch {
      setErrorMessage("Erreur lors de l'envoi de la réponse.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    game,
    isLoading,
    errorMessage,
    sessionCode,
    selectedGenerations,
    stepIndex,
    selectedPokemon,
    searchTerm,
    filterType1,
    filterType2,
    isSubmitting,
    wrongMessage,
    elapsed,
    attemptCount,
    allTypes,
    filteredPokemons,
    windowSpritePx,
    windowDisplayPx,
    windowOffset,
    handleSubmit,
    setSelectedPokemon,
    setSearchTerm,
    setFilterType1,
    setFilterType2,
  }
}
