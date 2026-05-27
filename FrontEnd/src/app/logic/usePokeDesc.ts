import { useState, useEffect, useMemo } from 'react'
import { useGameSession } from '../hooks/useGameSession'
import { getAllPokemons, getHints } from '../services/pokemonService'
import { submitGuess, useHint, resetTimer, notifyTimeout } from '../services/partieService'
import { useTimer } from '../hooks/useTimer'
import { useGameState } from '../hooks/useGameState'
import { computeRevealedHints } from '../utils/pokedescLogic'
import type { PartieDto, GuessResultDto, ProximityResult } from '../types/partie'
import type { PokemonDto, RevealedHints } from '../types/pokemon'
import { HINTS_DATA } from '../utils/pokedescConstants'
import { isHintLocked as checkHintLocked, filterHintPokemons, filterSearchPokemons } from '../utils/pokedescLogic'

/** Interface publique du hook `usePokeDesc` — toutes les valeurs et actions nécessaires à la page de jeu. */
export interface UsePokeDescReturn {
  // --- État de la partie ---
  partie: PartieDto | null
  isLoading: boolean
  errorMessage: string
  /** Descriptions censurées disponibles pour le Pokémon en cours. */
  descriptions: string[]
  /** Index de la description actuellement affichée. */
  descriptionIndex: number
  currentPokemonId: string
  currentScore: number
  attemptsUsed: number
  /** Clés des indices déjà utilisés (ex : `['type', 'generation']`). */
  usedHints: string[]
  /** Valeurs révélées des indices déjà débloqués. */
  revealedHints: RevealedHints
  // --- Timer ---
  /** Temps restant en secondes (synchronisé depuis le serveur). */
  timeRemaining: number
  timerShake: boolean
  timerFlash: boolean
  showTimePenalty: boolean
  currentTimePenalty: number
  /** Animations d'indices en cours : `{ [hintKey]: penaltySeconds }`. */
  hintAnimations: Record<string, number>
  // --- Recherche & liste de Pokémon ---
  allPokemons: PokemonDto[]
  /** Liste filtrée par indices révélés et par le terme de recherche. */
  filteredPokemons: PokemonDto[]
  searchTerm: string
  selectedPokemonName: string
  // --- Résultat de la tentative ---
  isSubmitting: boolean
  guessResultMessage: string
  lastGuessCorrect: boolean
  proximityResult: ProximityResult
  // --- Modales ---
  showSuccessModal: boolean
  showFailureModal: boolean
  showDescriptionModal: boolean
  /** Sprite du Pokémon révélé à l'issue d'une tentative (correcte ou échouée). */
  revealedPokemonSprite: string
  /** Nom français du Pokémon révélé à l'issue d'un échec. */
  revealedPokemonName: string
  /** `true` si le Pokémon en cours est le dernier de la liste. */
  isFinalPokemon: boolean
  /** `true` si la tentative a été conclue par un dépassement de temps. */
  isTimeout: boolean
  // --- Actions (remplacent les setters React.Dispatch) ---
  changeDescriptionIndex: (index: number) => void
  updateSearch: (term: string) => void
  selectPokemon: (name: string) => void
  clearSelection: () => void
  openDescriptionModal: () => void
  closeDescriptionModal: () => void
  // --- Handlers métier ---
  handleSubmitGuess: () => Promise<void>
  handleRequestHint: (hintKey: string) => Promise<void>
  proceedAfterModal: () => Promise<void>
  isHintLocked: (hintKey: string) => boolean
}

/**
 * Hook orchestrateur du jeu PokéDesc.
 *
 * Agrège `useGameState` (données de partie), `useTimer` (chrono serveur)
 * et `useGameSession` (navigation, chat, Prof. Chen) en une surface d'API unique
 * exposée à `PokeDescPage`.
 *
 * **Flux principal :**
 * 1. Au montage : chargement de la liste complète des Pokémon (`getAllPokemons`)
 *    et des données de la partie en cours (`loadGameData`), puis démarrage du timer.
 * 2. Le joueur choisit un Pokémon via la recherche et soumet sa réponse (`handleSubmitGuess`).
 * 3. En cas de succès, une modale de victoire s'affiche. En cas d'échec (mauvaise réponse
 *    ou timeout), une modale d'échec s'affiche.
 * 4. `proceedAfterModal` reset le timer, recharge les données et relance le timer
 *    pour le Pokémon suivant. Si c'était le dernier, navigue vers la page de résultats.
 *
 * @param partieId - Identifiant de la partie, extrait des paramètres d'URL.
 */
export function usePokeDesc(partieId: string | undefined): UsePokeDescReturn {
  const { sessionId, navigate, setChatContext, addChenMessage, clearChenMessages } = useGameSession()

  // --- État propre à l'orchestration ---
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [guessResultMessage, setGuessResultMessage] = useState('')
  const [lastGuessCorrect, setLastGuessCorrect] = useState(false)
  const [proximityResult, setProximityResult] = useState<ProximityResult>({})

  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [showFailureModal, setShowFailureModal] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [revealedPokemonSprite, setRevealedPokemonSprite] = useState('')
  const [revealedPokemonName, setRevealedPokemonName] = useState('')
  const [isFinalPokemon, setIsFinalPokemon] = useState(false)
  const [isTimeout, setIsTimeout] = useState(false)

  const [allPokemons, setAllPokemons] = useState<PokemonDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPokemonName, setSelectedPokemonName] = useState('')

  // --- Hooks internes ---
  // handleTimeout et skipPokemonWithoutDescription sont des `function declarations`
  // (hoistées), donc accessibles avant leur position dans le fichier.
  const timer = useTimer({ partieId, sessionId, onTimeout: handleTimeout })
  const game = useGameState({
    partieId,
    sessionId,
    onSkip: skipPokemonWithoutDescription,
  })

  const {
    partie, isLoading, errorMessage, setErrorMessage,
    descriptions, descriptionIndex, setDescriptionIndex,
    currentPokemonId, currentPokemonSprite,
    currentScore, setCurrentScore,
    attemptsUsed, setAttemptsUsed,
    usedHints, setUsedHints,
    revealedHints, setRevealedHints, currentPokemonIdRef,
    loadGameData,
  } = game

  const {
    timeRemaining, timerShake, timerFlash, showTimePenalty,
    currentTimePenalty, hintAnimations, timerDurationRef,
    startTimer, stopTimer, triggerHintAnimation, triggerTimerAnimation,
  } = timer

  // --- Chargement initial ---
  // Chargement de la liste complète des Pokémon pour alimenter l'autocomplétion.
  useEffect(() => {
    getAllPokemons().then(setAllPokemons).catch((err) =>
      console.error('[usePokeDesc] Échec du chargement de la liste des Pokémon :', err)
    )
  }, [])

  // Chargement des données de la partie puis démarrage du timer.
  useEffect(() => {
    loadGameData().then((result) => {
      if (!result) return
      timerDurationRef.current = result.timerDurationSeconds
      setChatContext({ partieId: partieId!, sessionCode: result.sessionCode, isSolo: result.isSolo })
      startTimer()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Intentionnellement vide : cet effet est run-once au montage.
    // loadGameData et startTimer ne peuvent pas être stabilisés sans refonte
    // de useGameState et useTimer — accepté jusqu'à la migration vers useReducer.
  }, [])

  // --- Valeurs calculées ---
  // useMemo évite de re-filtrer 1000+ Pokémon à chaque tick du timer (toutes les secondes).
  const hintFilteredPokemons = useMemo(
    () => filterHintPokemons(allPokemons, revealedHints, partie?.selectedGenerations ?? []),
    [allPokemons, revealedHints, partie?.selectedGenerations],
  )
  const filteredPokemons = useMemo(
    () => filterSearchPokemons(hintFilteredPokemons, searchTerm),
    [hintFilteredPokemons, searchTerm],
  )

  function isHintLocked(hintKey: string): boolean {
    return checkHintLocked(hintKey, usedHints, timeRemaining, partie?.timerDurationSeconds ?? -1)
  }

  // --- Fonctions d'orchestration ---
  // Déclarées comme `function` (hoistées) afin d'être passées aux hooks
  // (`useTimer`, `useGameState`) avant leur définition dans le fichier.

  /**
   * Appelé par `useTimer` quand le temps est écoulé.
   * Soumet automatiquement `__TIMEOUT__` au serveur, puis affiche la modale d'échec.
   */
  async function handleTimeout() {
    try {
      const result = await notifyTimeout(partieId!, sessionId)
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
    const timeoutPokemon = allPokemons.find(p => p.pokedexNumber === Number(currentPokemonIdRef.current))
    setRevealedPokemonName(timeoutPokemon?.nameFr ?? '')
    setIsTimeout(true)
    setShowFailureModal(true)
  }

  /**
   * Déclenché par `useGameState` quand un Pokémon sans description est détecté.
   * Remet le timer à zéro puis relance le chargement pour passer au Pokémon suivant.
   */
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

      const penalty = HINTS_DATA[hintKey]?.timePenaltyPct ?? 0
      if (penalty && timerDurationRef.current !== -1) {
        const penaltySeconds = Math.round((penalty * timerDurationRef.current) / 100)
        triggerHintAnimation(hintKey, penaltySeconds)
        triggerTimerAnimation(penaltySeconds)
      }

      const hintData = await getHints(currentPokemonId)
      setRevealedHints(computeRevealedHints(hintData, newUsed))
    } catch (err: any) {
      setErrorMessage(`Erreur lors de la demande d'indice : ${err?.message ?? ''}`)
    }
  }

  /**
   * Soumet la réponse du joueur au serveur.
   * - Réponse correcte → stop timer, ouvre la modale de succès.
   * - Tour terminé (3 tentatives épuisées ou timeout) → stop timer, ouvre la modale d'échec.
   * - Mauvaise réponse sans fin de tour → ajoute un message dans le panneau du Prof. Chen.
   */
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
        setCurrentScore(currentScore + result.pointsEarned)
        stopTimer()
        setRevealedPokemonSprite(currentPokemonSprite)
        setIsFinalPokemon(result.isGameFinished)
        setShowSuccessModal(true)
      } else if (result.isTurnFinished || result.isTimeout) {
        stopTimer()
        setRevealedPokemonSprite(currentPokemonSprite)
        const failedPokemon = allPokemons.find(p => p.pokedexNumber === Number(currentPokemonId))
        setRevealedPokemonName(failedPokemon?.nameFr ?? '')
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
        setAttemptsUsed(attemptsUsed + 1)
      }
    } catch (err) {
      console.error('[Guess] Échec de l\'envoi de la réponse :', err)
      setGuessResultMessage("Erreur lors de l'envoi de la réponse")
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Ferme la modale ouverte et prépare le tour suivant.
   * Si c'était le dernier Pokémon, navigue vers la page de résultats.
   * Sinon, remet le timer à zéro et recharge les données du prochain Pokémon.
   */
  async function proceedAfterModal() {
    setShowSuccessModal(false)
    setShowFailureModal(false)
    setIsTimeout(false)
    setLastGuessCorrect(false)
    setGuessResultMessage('')
    setIsFinalPokemon(false)
    setRevealedPokemonName('')
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

  /** Réinitialise les états liés à la saisie entre deux Pokémon. */
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
    selectedPokemonName,
    isSubmitting,
    guessResultMessage,
    lastGuessCorrect,
    proximityResult,
    showSuccessModal,
    showFailureModal,
    showDescriptionModal,
    revealedPokemonSprite,
    revealedPokemonName,
    isFinalPokemon,
    isTimeout,
    // Actions nommées
    changeDescriptionIndex: (index: number) => setDescriptionIndex(index),
    updateSearch: (term: string) => setSearchTerm(term),
    selectPokemon: (name: string) => { setSelectedPokemonName(name); setSearchTerm(name) },
    clearSelection: () => { setSelectedPokemonName(''); setSearchTerm('') },
    openDescriptionModal: () => setShowDescriptionModal(true),
    closeDescriptionModal: () => setShowDescriptionModal(false),
    handleSubmitGuess,
    handleRequestHint,
    proceedAfterModal,
    isHintLocked,
  }
}
