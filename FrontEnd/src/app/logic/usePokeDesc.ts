import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { useChenStore } from '../store/chenStore'
import { getAllPokemons, getHints } from '../services/pokemonService'
import { submitGuess, useHint, resetTimer } from '../services/partieService'
import { useTimer } from '../hooks/useTimer'
import { useGameState } from '../hooks/useGameState'
import type { PartieDto } from '../types/partie'
import type { PokemonDto } from '../types/pokemon'
import type { GuessResultDto } from '../types/partie'
import type { RevealedHints } from '../hooks/useGameState'
import { HINT_PENALTIES } from '../utils/pokedescConstants'
import { isHintLocked as checkHintLocked, filterHintPokemons, filterSearchPokemons } from '../utils/pokedescLogic'

export interface UsePokeDescReturn {
  // État de la partie
  partie: PartieDto | null
  isLoading: boolean
  errorMessage: string
  descriptions: string[]
  descriptionIndex: number
  setDescriptionIndex: React.Dispatch<React.SetStateAction<number>>
  currentPokemonId: string
  currentScore: number
  attemptsUsed: number
  usedHints: string[]
  revealedHints: RevealedHints
  // Timer
  timeRemaining: number
  timerShake: boolean
  timerFlash: boolean
  showTimePenalty: boolean
  currentTimePenalty: number
  hintAnimations: Record<string, number>
  // Recherche & liste
  allPokemons: PokemonDto[]
  filteredPokemons: PokemonDto[]
  searchTerm: string
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>
  selectedPokemonName: string
  setSelectedPokemonName: React.Dispatch<React.SetStateAction<string>>
  // Résultat de la tentative
  isSubmitting: boolean
  guessResultMessage: string
  lastGuessCorrect: boolean
  proximityResult: {
    hasOneTypeInCommon?: boolean
    hasPerfectTypeMatch?: boolean
    hasSameGeneration?: boolean
    isInSameEvolutionChain?: boolean
  }
  // Modales
  showSuccessModal: boolean
  showFailureModal: boolean
  showDescriptionModal: boolean
  setShowDescriptionModal: React.Dispatch<React.SetStateAction<boolean>>
  revealedPokemonSprite: string
  isFinalPokemon: boolean
  isTimeout: boolean
  // Handlers
  handleSubmitGuess: () => Promise<void>
  handleRequestHint: (hintKey: string) => Promise<void>
  proceedAfterModal: () => Promise<void>
  isHintLocked: (hintKey: string) => boolean
}

export function usePokeDesc(partieId: string | undefined): UsePokeDescReturn {
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()
  const addChenMessage = useChenStore((state) => state.addMessage)
  const clearChenMessages = useChenStore((state) => state.clearMessages)

  // --- État propre à l'orchestration ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [guessResultMessage, setGuessResultMessage] = useState('')
  const [lastGuessCorrect, setLastGuessCorrect] = useState(false)
  const [proximityResult, setProximityResult] = useState<{
    hasOneTypeInCommon?: boolean
    hasPerfectTypeMatch?: boolean
    hasSameGeneration?: boolean
    isInSameEvolutionChain?: boolean
  }>({})

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFailureModal, setShowFailureModal] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [revealedPokemonSprite, setRevealedPokemonSprite] = useState('')
  const [isFinalPokemon, setIsFinalPokemon] = useState(false)
  const [isTimeout, setIsTimeout] = useState(false)

  const [allPokemons, setAllPokemons] = useState<PokemonDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPokemonName, setSelectedPokemonName] = useState('')

  // --- Hooks internes ---
  // handleTimeout et skipPokemonWithoutDescription sont des déclarations de fonction
  // hoistées (function declarations), donc accessibles avant leur position dans le code.
  const timer = useTimer({ partieId, sessionId, onTimeout: handleTimeout })
  const game = useGameState({
    partieId,
    sessionId,
    setChatContext,
    timerDurationRef: timer.timerDurationRef,
    onSkip: skipPokemonWithoutDescription,
  })

  const {
    partie, isLoading, errorMessage, setErrorMessage,
    descriptions, descriptionIndex, setDescriptionIndex,
    currentPokemonId, currentPokemonSprite,
    currentScore, setCurrentScore,
    attemptsUsed, setAttemptsUsed,
    usedHints, setUsedHints,
    revealedHints, currentPokemonIdRef,
    loadGameData, processRevealedHints,
  } = game

  const {
    timeRemaining, timerShake, timerFlash, showTimePenalty,
    currentTimePenalty, hintAnimations, timerDurationRef,
    startTimer, stopTimer, triggerHintAnimation, triggerTimerAnimation,
  } = timer

  // --- Chargement initial ---
  useEffect(() => {
    getAllPokemons().then(setAllPokemons).catch((err) =>
      console.error('[usePokeDesc] Échec du chargement de la liste des Pokémon :', err)
    )
  }, [])

  useEffect(() => {
    loadGameData().then(() => startTimer())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Valeurs calculées ---
  const hintFilteredPokemons = filterHintPokemons(
    allPokemons,
    revealedHints,
    partie?.selectedGenerations ?? [],
  )
  const filteredPokemons = filterSearchPokemons(hintFilteredPokemons, searchTerm)

  function isHintLocked(hintKey: string): boolean {
    return checkHintLocked(hintKey, usedHints, timeRemaining, partie?.timerDurationSeconds ?? -1)
  }

  // --- Fonctions d'orchestration ---
  // Ces fonctions coordonnent useTimer et useGameState.
  // Elles sont déclarées comme `function` (hoistées) afin d'être passées
  // aux hooks avant d'être définies dans le code.

  async function handleTimeout() {
    try {
      const result = await submitGuess(partieId!, sessionId, '__TIMEOUT__')
      setIsFinalPokemon(result.isGameFinished)
      try {
        const hints = await getHints(currentPokemonIdRef.current)
        if (hints.sprites?.frontDefault) {
          setRevealedPokemonSprite(hints.sprites.frontDefault)
        } else {
          setRevealedPokemonSprite(currentPokemonSprite)
        }
      } catch (err) {
        console.warn('[Timeout] Impossible de charger le sprite du Pokémon, utilisation du sprite courant :', err)
        setRevealedPokemonSprite(currentPokemonSprite)
      }
    } catch (err) {
      console.error('[Timeout] Échec de la soumission du timeout :', err)
    }
    setIsTimeout(true)
    setShowFailureModal(true)
  }

  async function skipPokemonWithoutDescription() {
    try {
      await resetTimer(partieId!, sessionId)
    } catch (err) {
      console.warn('[Skip] Erreur lors du reset du timer (normal si le timer n\'avait pas démarré) :', err)
    }
    resetGuessState()
    setErrorMessage('')
    await loadGameData()
    startTimer()
  }

  async function handleRequestHint(hintKey: string) {
    if (usedHints.includes(hintKey) || isHintLocked(hintKey)) return
    try {
      await useHint(partieId!, sessionId, hintKey)
      const newUsed = [...usedHints, hintKey]
      setUsedHints(newUsed)

      const penalty = HINT_PENALTIES[hintKey]
      if (penalty && timerDurationRef.current !== -1) {
        const penaltySeconds = Math.round((penalty * timerDurationRef.current) / 100)
        triggerHintAnimation(hintKey, penaltySeconds)
        triggerTimerAnimation(penaltySeconds)
      }

      const hintData = await getHints(currentPokemonId)
      processRevealedHints(hintData, newUsed)
    } catch (err: any) {
      setErrorMessage(`Erreur lors de la demande d'indice : ${err?.message ?? ''}`)
    }
  }

  async function handleSubmitGuess() {
    if (!selectedPokemonName || isSubmitting) return
    setIsSubmitting(true)
    setGuessResultMessage('')
    try {
      const result: GuessResultDto = await submitGuess(partieId!, sessionId, selectedPokemonName)
      setLastGuessCorrect(result.isCorrect)
      setGuessResultMessage(result.message)
      setProximityResult({
        hasOneTypeInCommon: result.hasOneTypeInCommon,
        hasPerfectTypeMatch: result.hasPerfectTypeMatch,
        hasSameGeneration: result.hasSameGeneration,
        isInSameEvolutionChain: result.isInSameEvolutionChain,
      })
      if (result.isCorrect) {
        setCurrentScore((prev) => prev + result.pointsEarned)
        stopTimer()
        setRevealedPokemonSprite(currentPokemonSprite)
        setIsFinalPokemon(result.isGameFinished)
        setShowSuccessModal(true)
      } else if (result.isTurnFinished || result.isTimeout) {
        stopTimer()
        setRevealedPokemonSprite(currentPokemonSprite)
        setIsFinalPokemon(result.isGameFinished)
        setIsTimeout(result.isTimeout)
        setShowFailureModal(true)
      } else {
        addChenMessage({
          text: result.message,
          timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          proximityResult: {
            hasOneTypeInCommon: result.hasOneTypeInCommon,
            hasPerfectTypeMatch: result.hasPerfectTypeMatch,
            hasSameGeneration: result.hasSameGeneration,
            isInSameEvolutionChain: result.isInSameEvolutionChain,
          },
        })
        setAttemptsUsed((prev) => prev + 1)
      }
    } catch (err) {
      console.error('[Guess] Échec de l\'envoi de la réponse :', err)
      setGuessResultMessage("Erreur lors de l'envoi de la réponse")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function proceedAfterModal() {
    setShowSuccessModal(false)
    setShowFailureModal(false)
    setIsTimeout(false)
    setLastGuessCorrect(false)
    setGuessResultMessage('')
    setIsFinalPokemon(false)
    clearChenMessages()
    if (isFinalPokemon) {
      navigate(`/resultats/${partieId}`)
      return
    }
    await resetTimer(partieId!, sessionId)
    resetGuessState()
    await loadGameData()
    startTimer()
  }

  function resetGuessState() {
    setSearchTerm('')
    setSelectedPokemonName('')
    setGuessResultMessage('')
    setProximityResult({})
    setDescriptionIndex(0)
  }

  return {
    partie,
    isLoading,
    errorMessage,
    descriptions,
    descriptionIndex,
    setDescriptionIndex,
    currentPokemonId,
    currentScore,
    attemptsUsed,
    usedHints,
    revealedHints,
    timeRemaining,
    timerShake,
    timerFlash,
    showTimePenalty,
    currentTimePenalty,
    hintAnimations,
    allPokemons,
    filteredPokemons,
    searchTerm,
    setSearchTerm,
    selectedPokemonName,
    setSelectedPokemonName,
    isSubmitting,
    guessResultMessage,
    lastGuessCorrect,
    proximityResult,
    showSuccessModal,
    showFailureModal,
    showDescriptionModal,
    setShowDescriptionModal,
    revealedPokemonSprite,
    isFinalPokemon,
    isTimeout,
    handleSubmitGuess,
    handleRequestHint,
    proceedAfterModal,
    isHintLocked,
  }
}
