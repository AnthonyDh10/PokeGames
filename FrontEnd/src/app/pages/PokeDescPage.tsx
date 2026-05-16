import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { colors } from '../design/colors'
import { getAllPokemons, getHints } from '../services/pokemonService'
import { submitGuess, useHint, resetTimer } from '../services/partieService'
import type { PokemonDto } from '../types/pokemon'
import type { GuessResultDto } from '../types/partie'
import { useTimer } from '../hooks/useTimer'
import { useGameState } from '../hooks/useGameState'
import GameLayout from '../components/GameLayout'
import PokeDescHeader from '../components/PokeDescHeader'
import DescriptionCard from '../components/DescriptionCard'
import AnswerCard from '../components/AnswerCard'
import HintsGrid from '../components/HintsGrid'
import SuccessModal from '../components/modals/SuccessModal'
import FailureModal from '../components/modals/FailureModal'
import ZoomDescriptionModal from '../components/modals/ZoomDescriptionModal'
import { HINT_PENALTIES } from '../utils/pokedescConstants'
import { isHintLocked as checkHintLocked, filterHintPokemons, filterSearchPokemons } from '../utils/pokedescLogic'

export default function PokeDescPage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const { sessionId, playerName } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()

  // --- State résiduel (orchestration + UI) ---
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

  // --- Hooks ---
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
      console.error('[PokeDescPage] Échec du chargement de la liste des Pokémon :', err)
    )
  }, [])

  useEffect(() => {
    loadGameData().then(() => startTimer())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Computed values ---
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
        triggerHintAnimation(hintKey, penalty)
        triggerTimerAnimation(penalty)
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
        setCurrentScore(result.pointsEarned)
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

  // --- États d'affichage ---
  return (
    <GameLayout
      columns="1+1"
      isLoading={isLoading}
      error={errorMessage}
      onErrorBack={() => navigate('/pokedesc')}
      errorBackLabel="Retour au menu"
      errorBackColor={colors.brand.blue}
      header={
        <PokeDescHeader
          playerName={playerName}
          currentScore={currentScore}
          nbPokemons={partie?.nbPokemons ?? 1}
          attemptsUsed={attemptsUsed}
          selectedGenerations={partie?.selectedGenerations}
          timeRemaining={timeRemaining}
          timerDurationSeconds={partie?.timerDurationSeconds}
          timerShake={timerShake}
          timerFlash={timerFlash}
          showTimePenalty={showTimePenalty}
          currentTimePenalty={currentTimePenalty}
        />
      }
      left={
        <div className="relative z-10 flex flex-col gap-4">
          <DescriptionCard
            descriptions={descriptions}
            descriptionIndex={descriptionIndex}
            onChangeIndex={setDescriptionIndex}
            onZoom={() => setShowDescriptionModal(true)}
          />
          <AnswerCard
            filteredPokemons={filteredPokemons}
            searchTerm={searchTerm}
            selectedPokemonName={selectedPokemonName}
            isSubmitting={isSubmitting}
            guessResultMessage={guessResultMessage}
            lastGuessCorrect={lastGuessCorrect}
            proximityResult={proximityResult}
            onSearchChange={setSearchTerm}
            onSelectPokemon={(name) => { setSelectedPokemonName(name); setSearchTerm(name) }}
            onClearSelection={() => { setSelectedPokemonName(''); setSearchTerm('') }}
            onSubmit={handleSubmitGuess}
          />
        </div>
      }
      right={
        <HintsGrid
          usedHints={usedHints}
          revealedHints={revealedHints}
          hintAnimations={hintAnimations}
          timeRemaining={timeRemaining}
          timerDurationSeconds={partie?.timerDurationSeconds}
          onRequestHint={handleRequestHint}
          isHintLocked={isHintLocked}
        />
      }
      modals={
        <>
          <SuccessModal
            show={showSuccessModal}
            sprite={revealedPokemonSprite}
            pokemonName={selectedPokemonName}
            isFinalPokemon={isFinalPokemon}
            onProceed={proceedAfterModal}
          />
          <FailureModal
            show={showFailureModal}
            sprite={revealedPokemonSprite}
            pokemonName={allPokemons.find((p) => p.id === currentPokemonId)?.nameFr ?? 'Pokémon inconnu'}
            isFinalPokemon={isFinalPokemon}
            isTimeout={isTimeout}
            onProceed={proceedAfterModal}
          />
          <ZoomDescriptionModal
            show={showDescriptionModal}
            descriptions={descriptions}
            descriptionIndex={descriptionIndex}
            onChangeIndex={setDescriptionIndex}
            onClose={() => setShowDescriptionModal(false)}
          />
        </>
      }
    />
  )
}
