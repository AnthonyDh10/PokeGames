import { useState, useRef, useEffect, useMemo } from 'react'
import { useGameSession } from '../hooks/useGameSession'
import { getDeZoomGame, submitDeZoomGuess } from '../services/dezoomService'
import { getAllPokemons } from '../services/pokemonService'
import { generationToNumber } from '../utils/pokedescLogic'
import { normalizeString } from '../utils/normalize'
import type { PokemonDto } from '../types/pokemon'
import type { DeZoomGameDto } from '../types/dezoom'
import type { ProximityResult } from '../types/partie'

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
  filteredTypes1: { id: number; nameFr: string }[]
  filteredTypes2: { id: number; nameFr: string }[]
  filteredPokemons: PokemonDto[]
  windowSpritePx: number
  windowDisplayPx: number
  windowOffset: number
  handleSubmit: (e: React.FormEvent) => Promise<void>
  clearPokemonSelection: () => void
  selectPokemonResult: (p: PokemonDto) => void
  updateSearch: (term: string) => void
  updateFilterType1: (type: string) => void
  updateFilterType2: (type: string) => void
  selectFilterType1: (typeName: string) => void
  selectFilterType2: (typeName: string) => void
  clearFilters: () => void
}

export function useDeZoomGame(partieId: string | undefined): UseDeZoomGameReturn {
  const { sessionId, navigate, addChenMessage, clearChenMessages, loadSessionInfo } = useGameSession()

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
  const generationFilteredPokemons = useMemo(
    () => selectedGenerations.length > 0
      ? pokemons.filter((p) => {
          const genNumber = p.generation?.nameEn ? generationToNumber(p.generation.nameEn) : null
          return genNumber !== null && selectedGenerations.includes(genNumber)
        })
      : pokemons,
    [pokemons, selectedGenerations],
  )

  // Listes dédupliquées pour les filtres de type
  const allTypes = useMemo(
    () => [...new Set(
      generationFilteredPokemons.flatMap(p => p.types ?? []).map(t => t.name)
    )].sort((a, b) => a.localeCompare(b)).map((t, i) => ({ id: i, nameFr: t })),
    [generationFilteredPokemons],
  )

  // Filtrer les types basés sur la saisie de l'utilisateur (commence par, insensible aux accents)
  const filteredTypes1 = useMemo(
    () => allTypes.filter((t) => {
      if (!filterType1.trim()) return true
      const normalizedSearch = normalizeString(filterType1)
      const normalizedName = normalizeString(t.nameFr)
      return normalizedName.startsWith(normalizedSearch)
    }),
    [allTypes, filterType1],
  )

  const filteredTypes2 = useMemo(
    () => allTypes.filter((t) => {
      if (!filterType2.trim()) return true
      const normalizedSearch = normalizeString(filterType2)
      const normalizedName = normalizeString(t.nameFr)
      return normalizedName.startsWith(normalizedSearch)
    }),
    [allTypes, filterType2],
  )

  // Filtrer les pokémons par nom (commence par, insensible aux accents) et par type
  const filteredPokemons = useMemo(
    () => generationFilteredPokemons.filter((p) => {
      if (searchTerm.trim()) {
        const normalizedSearch = normalizeString(searchTerm)
        const normalizedName = normalizeString(p.nameFr)
        if (!normalizedName.startsWith(normalizedSearch)) return false
      }
      if (filterType1 && p.types?.find(t => t.slot === 1)?.name !== filterType1) return false
      if (filterType2) {
        const slot2 = p.types?.find(t => t.slot === 2)?.name
        if (slot2 !== filterType2) return false
      }
      return true
    }),
    [generationFilteredPokemons, searchTerm, filterType1, filterType2],
  )

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
        const { sessionCode: code, selectedGenerations: gens } = await loadSessionInfo(partieId)
        setSessionCode(code)
        if (gens.length > 0) setSelectedGenerations(gens)
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
    filteredTypes1,
    filteredTypes2,
    filteredPokemons,
    windowSpritePx,
    windowDisplayPx,
    windowOffset,
    handleSubmit,
    clearPokemonSelection: () => { setSelectedPokemon(null); setSearchTerm('') },
    selectPokemonResult: (p: PokemonDto) => { setSelectedPokemon(p); setSearchTerm(p.nameFr) },
    updateSearch: (term: string) => setSearchTerm(term),
    updateFilterType1: (type: string) => setFilterType1(type),
    updateFilterType2: (type: string) => setFilterType2(type),
    selectFilterType1: (typeName: string) => { setFilterType1(typeName); setSelectedPokemon(null); setSearchTerm('') },
    selectFilterType2: (typeName: string) => { setFilterType2(typeName); setSelectedPokemon(null); setSearchTerm('') },
    clearFilters: () => { setFilterType1(''); setFilterType2('') },
  }
}
