import { useState, useRef, useCallback, useEffect } from 'react'
import { getCensoredDescription, getHints } from '../services/pokemonService'
import { getPartie } from '../services/partieService'
import { computeRevealedHints } from '../utils/pokedescLogic'
import type { PartieDto } from '../types/partie'
import type { RevealedHints } from '../types/pokemon'

// Re-export pour la rétro-compatibilité des imports existants.
export type { RevealedHints } from '../types/pokemon'

/** Données retournées par loadGameData, à consommer par le hook orchestrateur. */
export interface GameLoadResult {
  timerDurationSeconds: number
  sessionCode: string
  isSolo: boolean
}

export interface UseGameStateReturn {
  partie: PartieDto | null
  isLoading: boolean
  errorMessage: string
  setErrorMessage: (msg: string) => void
  descriptions: string[]
  descriptionIndex: number
  setDescriptionIndex: (index: number) => void
  currentPokemonId: string
  currentPokemonSprite: string
  currentScore: number
  setCurrentScore: (score: number) => void
  attemptsUsed: number
  setAttemptsUsed: (attempts: number) => void
  usedHints: string[]
  setUsedHints: (hints: string[]) => void
  revealedHints: RevealedHints
  setRevealedHints: (hints: RevealedHints) => void
  sessionCode: string
  isPlayer1: boolean
  currentPokemonIdRef: React.MutableRefObject<string>
  loadGameData: () => Promise<GameLoadResult | null>
}

export function useGameState({
  partieId,
  sessionId,
  onSkip,
}: {
  partieId: string | undefined
  sessionId: string
  onSkip: () => void
}): UseGameStateReturn {
  const [partie, setPartie] = useState<PartieDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [descriptionIndex, setDescriptionIndex] = useState(0)
  const [currentPokemonId, setCurrentPokemonId] = useState('')
  const [currentPokemonSprite, setCurrentPokemonSprite] = useState('')
  const [currentScore, setCurrentScore] = useState(0)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [usedHints, setUsedHints] = useState<string[]>([])
  const [revealedHints, setRevealedHints] = useState<RevealedHints>({})
  const [sessionCode, setSessionCode] = useState('')
  const [isPlayer1, setIsPlayer1] = useState(true)

  const currentPokemonIdRef = useRef<string>('')
  // Stable ref to always call the latest onSkip without stale closures
  const onSkipRef = useRef(onSkip)
  useEffect(() => { onSkipRef.current = onSkip }, [onSkip])

  const loadGameData = useCallback(async (): Promise<GameLoadResult | null> => {
    if (!partieId) return null
    setIsLoading(true)
    setErrorMessage('')
    try {
      const p = await getPartie(partieId)
      setPartie(p)
      setSessionCode(p.codeSession ?? 'N/A')

      const player1 = p.dresseur1Id === sessionId
      setIsPlayer1(player1)

      const currentIndex = player1 ? p.currentIndexJ1 : p.currentIndexJ2
      const pokemonId = p.pokemonsToGuess?.[currentIndex]?.id ?? ''

      if (!pokemonId) {
        setErrorMessage('Aucun Pokémon à deviner')
        setIsLoading(false)
        return null
      }

      setCurrentPokemonId(pokemonId)
      currentPokemonIdRef.current = pokemonId
      setCurrentScore(player1 ? p.scoreJ1 : p.scoreJ2)
      setAttemptsUsed(player1 ? p.attemptsUsedJ1 : p.attemptsUsedJ2)
      const hints = player1 ? p.usedHintsJ1 : p.usedHintsJ2
      setUsedHints(hints)

      const [desc, hintData] = await Promise.all([
        getCensoredDescription(pokemonId),
        getHints(pokemonId),
      ])

      if (!desc.descriptions?.length) {
        setIsLoading(false)
        setErrorMessage('Pokémon sans description — passage au suivant...')
        setTimeout(() => { onSkipRef.current() }, 1500)
        return null
      }

      setDescriptions(desc.descriptions)
      setDescriptionIndex(0)
      setRevealedHints(computeRevealedHints(hintData, hints))

      if (hintData.sprites?.frontDefault) {
        setCurrentPokemonSprite(hintData.sprites.frontDefault)
      }
      setIsLoading(false)

      return {
        timerDurationSeconds: p.timerDurationSeconds,
        sessionCode: p.codeSession ?? '',
        isSolo: !p.dresseur2Id,
      }
    } catch (err: any) {
      setErrorMessage(`Erreur : ${err?.message ?? 'Inconnue'}`)
      setIsLoading(false)
      return null
    }
  }, [partieId, sessionId])

  return {
    partie,
    isLoading,
    errorMessage,
    setErrorMessage,
    descriptions,
    descriptionIndex,
    setDescriptionIndex,
    currentPokemonId,
    currentPokemonSprite,
    currentScore,
    setCurrentScore,
    attemptsUsed,
    setAttemptsUsed,
    usedHints,
    setUsedHints,
    revealedHints,
    setRevealedHints,
    sessionCode,
    isPlayer1,
    currentPokemonIdRef,
    loadGameData,
  }
}
