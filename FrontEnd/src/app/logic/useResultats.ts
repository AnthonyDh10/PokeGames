import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getPartie, markRematchReady, createPartie, startPartie } from '../services/partieService'
import { useRematch } from '../hooks/useRematch'
import { getHints } from '../services/pokemonService'
import type { PartieDto } from '../types/partie'

export interface UseResultatsReturn {
  // --- État ---
  isLoading: boolean
  errorMessage: string
  partie: PartieDto | null
  sprites: Record<string, string>
  gameFullyComplete: boolean
  isRelaunching: boolean
  isCreatingNew: boolean
  // --- Dérivés ---
  isPlayer1: boolean
  player1Name: string
  player2Name: string
  isSolo: boolean
  j1Wins: boolean
  j2Wins: boolean
  winnerName: string | null
  // --- Actions ---
  rematchRequested: boolean
  handleRematchClick: () => void
  handleRelaunchClick: () => Promise<void>
  handleNewGame: () => Promise<void>
}

/**
 * Hook orchestrateur de la page de résultats PokéDesc.
 *
 * Gère le chargement de la partie, le chargement des sprites, l'auto-refresh
 * en mode multijoueur (polling toutes les 2s jusqu'à ce que les 2 joueurs aient terminé),
 * et les actions de relance / nouvelle partie / revanche.
 *
 * @param partieId - Identifiant de la partie, extrait des paramètres d'URL.
 */
export function useResultats(partieId: string | undefined): UseResultatsReturn {
  const navigate = useNavigate()
  const { sessionId, playerName } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [partie, setPartie] = useState<PartieDto | null>(null)
  const [sprites, setSprites] = useState<Record<string, string>>({})
  const [gameFullyComplete, setGameFullyComplete] = useState(false)
  const [isRelaunching, setIsRelaunching] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)

  const { rematchRequested, handleRematch: handleRematchClick } = useRematch({
    partieId,
    sessionId,
    markReadyFn: markRematchReady,
    gameRoute: '/pokedesc',
  })

  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // --- Fonctions internes ---

  async function loadSprites(p: PartieDto) {
    const all = [...(p.completedPokemonsJ1 ?? []), ...(p.completedPokemonsJ2 ?? [])]
    const newSprites: Record<string, string> = {}
    await Promise.all(
      all.map(async (cp) => {
        if (!newSprites[cp.pokemonId]) {
          try {
            const hints = await getHints(cp.pokemonId)
            if (hints.sprites?.frontDefault) newSprites[cp.pokemonId] = hints.sprites.frontDefault
          } catch {
            // sprite indisponible — on ignore silencieusement
          }
        }
      }),
    )
    setSprites((prev) => ({ ...prev, ...newSprites }))
  }

  function isComplete(p: PartieDto): boolean {
    if (p.modeSolo) return (p.completedPokemonsJ1?.length ?? 0) >= p.nbPokemons
    return (
      (p.completedPokemonsJ1?.length ?? 0) >= p.nbPokemons &&
      (p.completedPokemonsJ2?.length ?? 0) >= p.nbPokemons
    )
  }

  async function load() {
    if (!partieId) return
    setIsLoading(true)
    try {
      const p = await getPartie(partieId)
      setPartie(p)
      setChatContext({
        partieId,
        sessionCode: p.codeSession ?? '',
        isSolo: p.modeSolo || !p.dresseur2Id,
      })
      setGameFullyComplete(isComplete(p))
      await loadSprites(p)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Erreur de chargement')
    } finally {
      setIsLoading(false)
    }
  }

  // Chargement initial
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [partieId])

  // Auto-refresh multijoueur : attend que les 2 joueurs aient terminé tous leurs Pokémon
  useEffect(() => {
    if (!partie || gameFullyComplete || partie.modeSolo) return
    autoRefreshRef.current = setInterval(async () => {
      try {
        const p = await getPartie(partieId!)
        if (isComplete(p)) {
          setGameFullyComplete(true)
          setPartie(p)
          await loadSprites(p)
          clearInterval(autoRefreshRef.current!)
        }
      } catch {
        // silent
      }
    }, 2000)
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partie, gameFullyComplete])

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [])

  // --- Actions ---

  async function handleRelaunchClick() {
    if (!partie) return
    setIsRelaunching(true)
    try {
      const newPartie = await createPartie(sessionId)
      await startPartie(newPartie.id, true, {
        nbPokemons: partie.nbPokemons,
        generations: partie.selectedGenerations,
        timerDuration: partie.timerDurationSeconds,
      })
      navigate(`/pokedesc/${newPartie.id}`)
    } catch {
      setIsRelaunching(false)
    }
  }

  async function handleNewGame() {
    if (!partie) return
    setIsCreatingNew(true)
    try {
      const newPartie = await createPartie(sessionId)
      navigate('/pokedesc', {
        state: {
          existingPartieId: newPartie.id,
          previousSettings: {
            nbPokemons: partie.nbPokemons,
            generations: partie.selectedGenerations,
            timerDuration: partie.timerDurationSeconds,
          },
        },
      })
    } catch {
      setIsCreatingNew(false)
    }
  }

  // --- Valeurs dérivées ---
  const isPlayer1 = partie?.dresseur1Id === sessionId
  const player1Name = isPlayer1 ? (playerName || 'Joueur 1') : 'Adversaire'
  const player2Name = isPlayer1 ? 'Adversaire' : (playerName || 'Joueur 2')
  const isSolo = partie?.modeSolo ?? true
  const j1Wins = !isSolo && !!partie && partie.scoreJ1 > partie.scoreJ2
  const j2Wins = !isSolo && !!partie && partie.scoreJ2 > partie.scoreJ1
  const winnerName = j1Wins ? player1Name : j2Wins ? player2Name : null

  return {
    isLoading,
    errorMessage,
    partie,
    sprites,
    gameFullyComplete,
    isRelaunching,
    isCreatingNew,
    isPlayer1,
    player1Name,
    player2Name,
    isSolo,
    j1Wins,
    j2Wins,
    winnerName,
    rematchRequested,
    handleRematchClick,
    handleRelaunchClick,
    handleNewGame,
  }
}
