import { useState, useRef, useCallback, useEffect } from 'react'
import { getCensoredDescription, getHints } from '../services/pokemonService'
import { getPartie } from '../services/partieService'
import { computeRevealedHints } from '../utils/pokedescLogic'
import type { PartieDto } from '../types/partie'
import type { RevealedHints } from '../types/pokemon'

// Re-export pour la rétro-compatibilité des imports existants.
export type { RevealedHints } from '../types/pokemon'

/** Données retournées par `loadGameData`, à consommer par le hook orchestrateur. */
export interface GameLoadResult {
  /** Durée du timer en secondes (`-1` pour le mode chronomètre sans limite). */
  timerDurationSeconds: number
  /** Code de session à afficher dans l'UI. */
  sessionCode: string
  /** `true` si la partie est solo (un seul dresseur). */
  isSolo: boolean
}

/** État et actions exposés par le hook `useGameState`. */
export interface UseGameStateReturn {
  /** État complet de la partie retourné par le serveur. `null` tant que le chargement n'est pas terminé. */
  partie: PartieDto | null
  /** `true` pendant le chargement des données (getPartie + getCensoredDescription + getHints). */
  isLoading: boolean
  errorMessage: string
  setErrorMessage: (msg: string) => void
  /** Liste des descriptions censurées disponibles pour le Pokémon en cours. */
  descriptions: string[]
  /** Index de la description actuellement affichée (changeable par le joueur). */
  descriptionIndex: number
  setDescriptionIndex: (index: number) => void
  /** Identifiant du Pokémon en cours (numéro Pokédex en string). */
  currentPokemonId: string
  /** URL du sprite front du Pokémon en cours (révélé en cas d'échec). */
  currentPokemonSprite: string
  currentScore: number
  setCurrentScore: (score: number) => void
  /** Nombre de tentatives utilisées pour le Pokémon en cours. */
  attemptsUsed: number
  setAttemptsUsed: (attempts: number) => void
  /** Clés des indices déjà utilisés (ex : `['type', 'generation']`). */
  usedHints: string[]
  setUsedHints: (hints: string[]) => void
  /** Valeurs révélées des indices déjà débloqués. */
  revealedHints: RevealedHints
  setRevealedHints: (hints: RevealedHints) => void
  sessionCode: string
  /** Ref stable vers l'ID du Pokémon en cours (accessible sans re-render dans les callbacks async). */
  currentPokemonIdRef: React.MutableRefObject<string>
  /**
   * Charge (ou recharge) les données de jeu depuis le serveur :
   * état de la partie, description censurée et indices du Pokémon courant.
   * Appelé au montage du composant et après chaque passage au Pokémon suivant.
   */
  loadGameData: () => Promise<GameLoadResult | null>
}

/**
 * Hook gérant les données de jeu PokéDesc : état de la partie, Pokémon en cours,
 * descriptions censurées, indices révélés, score et tentatives.
 *
 * Ce hook est consommé exclusivement par `usePokeDesc` (hook orchestrateur).
 * Il ne gère ni le timer ni la soumission de réponses — ces responsabilités
 * appartiennent à `useTimer` et aux handlers de `usePokeDesc`.
 *
 * @param partieId - Identifiant de la partie. Si `undefined`, le chargement ne démarre pas.
 * @param sessionId - UUID de session du joueur, utilisé pour retrouver le joueur dans players[].
 * @param onSkip - Callback déclenché quand un Pokémon sans description est détecté.
 */
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

  const currentPokemonIdRef = useRef<string>('')
  // Ref stable vers onSkip pour éviter les closures périmées dans les callbacks async
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

      const me = p.players?.find((pl) => pl.dresseurId === sessionId)
      const pokemonId = me?.currentPokemonId ?? ''

      if (!pokemonId) {
        const debugInfo = [
          `sessionId=${sessionId}`,
          `players=[${p.players?.map((pl) => pl.dresseurId).join(', ') ?? 'aucun'}]`,
          me
            ? `me.currentPokemonId=${me.currentPokemonId ?? 'null'}`
            : 'joueur introuvable dans players[]',
          `statut=${p.statut}`,
        ].join(', ')
        setErrorMessage(`Aucun Pokémon à deviner (${debugInfo})`)
        setIsLoading(false)
        return null
      }

      setCurrentPokemonId(pokemonId)
      currentPokemonIdRef.current = pokemonId
      setCurrentScore(me?.score ?? 0)
      setAttemptsUsed(me?.attemptsUsed ?? 0)
      const hints = me?.usedHints ?? []
      setUsedHints(hints)

      // Chargement parallèle : description censurée + données d'indices
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
        timerDurationSeconds: p.settings?.timerDuration ?? 60,
        sessionCode: p.codeSession ?? '',
        isSolo: p.modeSolo || (p.players?.length ?? 0) <= 1,
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
    currentPokemonIdRef,
    loadGameData,
  }
}
