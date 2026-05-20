import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { useChenStore } from '../store/chenStore'
import { getAllTypes, getTypesGame, submitTypesGuess } from '../services/typesGameService'
import { getPartie } from '../services/partieService'
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
  setSelectedType1: React.Dispatch<React.SetStateAction<TypeSimpleDto | null>>
  setSearchTerm1: React.Dispatch<React.SetStateAction<string>>
  setSelectedType2: React.Dispatch<React.SetStateAction<TypeSimpleDto | null>>
  setSearchTerm2: React.Dispatch<React.SetStateAction<string>>
}

export function useTypesGame(partieId: string | undefined): UseTypesGameReturn {
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()
  const addChenMessage = useChenStore((state) => state.addMessage)
  const clearChenMessages = useChenStore((state) => state.clearMessages)

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

  const filteredTypes1 = types.filter((t) =>
    !searchTerm1.trim() || t.nameFr.toLowerCase().includes(searchTerm1.toLowerCase())
  )
  const filteredTypes2 = types.filter((t) =>
    !searchTerm2.trim() || t.nameFr.toLowerCase().includes(searchTerm2.toLowerCase())
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
        // getPartie peut échouer en cas de rematch — ne pas bloquer le jeu si c'est le cas
        try {
          const p = await getPartie(partieId)
          setSessionCode(p.codeSession ?? 'N/A')
          setChatContext({
            partieId,
            sessionCode: p.codeSession ?? '',
            isSolo: !p.dresseur2Id,
          })
        } catch {
          setSessionCode('N/A')
        }
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
    setSelectedType1,
    setSearchTerm1,
    setSelectedType2,
    setSearchTerm2,
  }
}
