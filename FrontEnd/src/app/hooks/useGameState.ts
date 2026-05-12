import { useState, useRef, useCallback, useEffect } from 'react'
import { getCensoredDescription, getHints } from '../services/pokemonService'
import { getPartie } from '../services/partieService'
import type { PartieDto } from '../types/partie'
import type { PokemonHintsDto } from '../types/pokemon'

export interface RevealedHints {
  'Type 1'?: string
  'Type 2'?: string
  'Génération'?: string
  'Catégorie'?: string
  'Statistiques'?: string
  'Taille'?: string
  'Poids'?: string
  'Talents'?: string
  'Silhouette'?: string
}

interface ChatContext {
  partieId: string
  sessionCode: string
  isSolo: boolean
}

export interface UseGameStateReturn {
  partie: PartieDto | null
  isLoading: boolean
  errorMessage: string
  setErrorMessage: React.Dispatch<React.SetStateAction<string>>
  descriptions: string[]
  descriptionIndex: number
  setDescriptionIndex: React.Dispatch<React.SetStateAction<number>>
  currentPokemonId: string
  currentPokemonSprite: string
  currentScore: number
  setCurrentScore: React.Dispatch<React.SetStateAction<number>>
  attemptsUsed: number
  setAttemptsUsed: React.Dispatch<React.SetStateAction<number>>
  usedHints: string[]
  setUsedHints: React.Dispatch<React.SetStateAction<string[]>>
  revealedHints: RevealedHints
  sessionCode: string
  isPlayer1: boolean
  currentPokemonIdRef: React.MutableRefObject<string>
  loadGameData: () => Promise<void>
  processRevealedHints: (hints: PokemonHintsDto, used: string[]) => void
}

export function useGameState({
  partieId,
  sessionId,
  setChatContext,
  timerDurationRef,
  onSkip,
}: {
  partieId: string | undefined
  sessionId: string
  setChatContext: (ctx: ChatContext) => void
  timerDurationRef: React.MutableRefObject<number>
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

  const loadGameData = useCallback(async () => {
    if (!partieId) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      const p = await getPartie(partieId)
      setPartie(p)
      timerDurationRef.current = p.timerDurationSeconds
      setSessionCode(p.codeSession ?? 'N/A')
      setChatContext({
        partieId,
        sessionCode: p.codeSession ?? '',
        isSolo: !p.dresseur2Id,
      })

      const player1 = p.dresseur1Id === sessionId
      setIsPlayer1(player1)

      const currentIndex = player1 ? p.currentIndexJ1 : p.currentIndexJ2
      const pokemonId = p.pokemonsToGuess?.[currentIndex]?.id ?? ''

      if (!pokemonId) {
        setErrorMessage('Aucun Pokémon à deviner')
        setIsLoading(false)
        return
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
        return
      }

      setDescriptions(desc.descriptions)
      setDescriptionIndex(0)
      processRevealedHints(hintData, hints)

      if (hintData.sprites?.frontDefault) {
        setCurrentPokemonSprite(hintData.sprites.frontDefault)
      }
      setIsLoading(false)
    } catch (err: any) {
      setErrorMessage(`Erreur : ${err?.message ?? 'Inconnue'}`)
      setIsLoading(false)
    }
  }, [partieId, sessionId, setChatContext, timerDurationRef])

  function processRevealedHints(hints: PokemonHintsDto, used: string[]) {
    const revealed: RevealedHints = {}
    if (used.includes('Sprite') && hints.sprites?.frontDefault) {
      revealed['Silhouette'] = hints.sprites.frontDefault
    }
    if (used.includes('Type1') && hints.types) {
      const t = hints.types.find((t) => t.slot === 1)
      if (t) revealed['Type 1'] = t.name
    }
    if (used.includes('Type2') && hints.types) {
      const t = hints.types.find((t) => t.slot === 2)
      revealed['Type 2'] = t ? t.name : 'Pas de second type'
    }
    if (used.includes('Generation') && hints.generation) {
      revealed['Génération'] = hints.generation.nameFr
    }
    if (used.includes('Category') && hints.category) {
      revealed['Catégorie'] = hints.category
    }
    if (used.includes('Stats') && hints.stats) {
      const s = hints.stats
      revealed['Statistiques'] =
        `PV: ${s.PV?.value ?? '?'}, Atk: ${s.Attaque?.value ?? '?'}, Déf: ${s['Défense']?.value ?? '?'}, ` +
        `SpA: ${s['Attaque Spé.']?.value ?? '?'}, SpD: ${s['Défense Spé.']?.value ?? '?'}, Spe: ${s.Vitesse?.value ?? '?'}`
    }
    if (used.includes('Height') && hints.physical) {
      revealed['Taille'] = `${hints.physical.heightM}m`
    }
    if (used.includes('Weight') && hints.physical) {
      revealed['Poids'] = `${hints.physical.weightKg}kg`
    }
    if (used.includes('Abilities') && hints.abilities?.length) {
      revealed['Talents'] = hints.abilities.map((a) => a.name).join(', ')
    }
    setRevealedHints(revealed)
  }

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
    sessionCode,
    isPlayer1,
    currentPokemonIdRef,
    loadGameData,
    processRevealedHints,
  }
}
