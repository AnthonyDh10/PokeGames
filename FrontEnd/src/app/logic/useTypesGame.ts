import { useState, useRef, useEffect, useMemo } from 'react'
import { useGameSession } from '../hooks/useGameSession'
import { getAllTypes, getTypesGame, submitTypesGuess } from '../services/typesGameService'
import { normalizeString } from '../utils/normalize'
import type { TypeSimpleDto, TypesGameDto } from '../types/typesGame'

export interface UseTypesGameReturn {
  types: TypeSimpleDto[]
  game: TypesGameDto | null
  isLoading: boolean
  errorMessage: string
  sessionCode: string
  selectedType1: TypeSimpleDto | null
  searchTerm1: string
  selectedType2: TypeSimpleDto | null
  searchTerm2: string
  isSubmitting: boolean
  elapsed: number
  attemptCount: number
  filteredTypes1: TypeSimpleDto[]
  filteredTypes2: TypeSimpleDto[]
  handleSubmit: (e: React.FormEvent) => Promise<void>
  selectType1: (t: TypeSimpleDto) => void
  clearType1: () => void
  updateSearchTerm1: (term: string) => void
  selectType2: (t: TypeSimpleDto) => void
  clearType2: () => void
  updateSearchTerm2: (term: string) => void
}

export function useTypesGame(partieId: string | undefined): UseTypesGameReturn {
  const { sessionId, navigate, addChenMessage, clearChenMessages, loadSessionInfo } = useGameSession()

  const [types, setTypes] = useState<TypeSimpleDto[]>([])
  const [game, setGame] = useState<TypesGameDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionCode, setSessionCode] = useState('')

  const [selectedType1, setSelectedType1] = useState<TypeSimpleDto | null>(null)
  const [searchTerm1, setSearchTerm1] = useState('')
  const [selectedType2, setSelectedType2] = useState<TypeSimpleDto | null>(null)
  const [searchTerm2, setSearchTerm2] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const filteredTypes1 = useMemo(
    () => types.filter((t) => {
      if (!searchTerm1.trim()) return true
      const normalizedSearch = normalizeString(searchTerm1)
      const normalizedName = normalizeString(t.nameFr)
      return normalizedName.startsWith(normalizedSearch)
    }),
    [types, searchTerm1],
  )
  const filteredTypes2 = useMemo(
    () => types.filter((t) => {
      if (!searchTerm2.trim()) return true
      const normalizedSearch = normalizeString(searchTerm2)
      const normalizedName = normalizeString(t.nameFr)
      return normalizedName.startsWith(normalizedSearch)
    }),
    [types, searchTerm2],
  )

  useEffect(() => {
    if (!partieId) return
    clearChenMessages()
    setIsLoading(true)
    ;(async () => {
      try {
        const [t, g] = await Promise.all([getAllTypes(), getTypesGame(partieId, sessionId)])
        setTypes(t.sort((a, b) => a.nameFr.localeCompare(b.nameFr)))
        setGame(g)
        const { sessionCode: code } = await loadSessionInfo(partieId)
        setSessionCode(code)
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
    if (!selectedType1 || !selectedType2 || isSubmitting) return

    setIsSubmitting(true)
    try {
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)
      const res = await submitTypesGuess(
        partieId!,
        sessionId,
        selectedType1.id,
        selectedType2.id,
        elapsed,
        newAttemptCount,
      )
      if (res.isCorrect) {
        if (timerRef.current) clearInterval(timerRef.current)
        navigate(`/resultats-types/${partieId}`, { state: { sessionCode } })
        return
      }
      addChenMessage({
        text: res.message,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        partialMatchTypeFr: res.partialMatchTypeFr,
      })
      if (newAttemptCount >= 3) {
        if (timerRef.current) clearInterval(timerRef.current)
        navigate(`/resultats-types/${partieId}`, { state: { sessionCode } })
      }
    } catch {
      setErrorMessage("Erreur lors de l'envoi de la réponse.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return {
    types,
    game,
    isLoading,
    errorMessage,
    sessionCode,
    selectedType1,
    searchTerm1,
    selectedType2,
    searchTerm2,
    isSubmitting,
    elapsed,
    attemptCount,
    filteredTypes1,
    filteredTypes2,
    handleSubmit,
    selectType1: (t: TypeSimpleDto) => { setSelectedType1(t); setSearchTerm1(t.nameFr) },
    clearType1: () => { setSelectedType1(null); setSearchTerm1('') },
    updateSearchTerm1: (term: string) => setSearchTerm1(term),
    selectType2: (t: TypeSimpleDto) => { setSelectedType2(t); setSearchTerm2(t.nameFr) },
    clearType2: () => { setSelectedType2(null); setSearchTerm2('') },
    updateSearchTerm2: (term: string) => setSearchTerm2(term),
  }
}
