import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getPartie, markRematchReady, createPartie, startPartie } from '../services/partieService'
import { useRematch } from '../hooks/useRematch'
import { getHints } from '../services/pokemonService'
import type { PartieDto, PlayerDto } from '../types/partie'

export interface UseResultatsReturn {
  // --- État ---
  isLoading: boolean
  errorMessage: string
  partie: PartieDto | null
  sprites: Record<string, string>
  gameFullyComplete: boolean
  isRelaunching: boolean
  isCreatingNew: boolean
  // --- Dérivés N joueurs ---
  /** Joueurs triés par score décroissant. */
  sortedPlayers: PlayerDto[]
  /** Le joueur local. */
  me: PlayerDto | undefined
  /** Vainqueur unique, `null` en cas d'égalité ou partie solo. */
  winner: PlayerDto | null
  /** `true` si plusieurs joueurs partagent le score le plus élevé. */
  isTie: boolean
  isSolo: boolean
  // --- Actions ---
  rematchRequested: boolean
  handleRematchClick: () => void
  handleRelaunchClick: () => Promise<void>
  handleNewGame: () => Promise<void>
}

/**
 * Hook orchestrateur de la page de résultats PokéDesc.
 *
 * Gère le chargement de la partie, les sprites, l'auto-refresh en multijoueur
 * (polling 2 s jusqu'à ce que tous les joueurs aient terminé), et les actions
 * de relance / nouvelle partie / revanche.
 *
 * @param partieId - Identifiant de la partie, extrait des paramètres d'URL.
 */
export function useResultats(partieId: string | undefined): UseResultatsReturn {
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
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
    const seen = new Set<string>()
    const toFetch = p.players
      .flatMap((pl) => pl.completedPokemons)
      .filter((cp) => { if (seen.has(cp.pokemonId)) return false; seen.add(cp.pokemonId); return true })

    const newSprites: Record<string, string> = {}
    await Promise.all(
      toFetch.map(async (cp) => {
        try {
          const hints = await getHints(cp.pokemonId)
          if (hints.sprites?.frontDefault) newSprites[cp.pokemonId] = hints.sprites.frontDefault
        } catch {
          // sprite indisponible — on ignore silencieusement
        }
      }),
    )
    setSprites((prev) => ({ ...prev, ...newSprites }))
  }

  function isComplete(p: PartieDto): boolean {
    const nbPkm = p.settings?.nbPokemons ?? 0
    if (p.modeSolo) return (p.players[0]?.completedPokemons.length ?? 0) >= nbPkm
    return p.players.length > 0 && p.players.every((pl) => pl.completedPokemons.length >= nbPkm)
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
        isSolo: p.modeSolo || p.players.length <= 1,
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

  // Auto-refresh multijoueur : attend que tous les joueurs aient terminé
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
        nbPokemons: partie.settings?.nbPokemons ?? 1,
        generations: partie.settings?.generations ?? [],
        timerDuration: partie.settings?.timerDuration ?? 60,
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
            nbPokemons: partie.settings?.nbPokemons ?? 1,
            generations: partie.settings?.generations ?? [],
            timerDuration: partie.settings?.timerDuration ?? 60,
          },
        },
      })
    } catch {
      setIsCreatingNew(false)
    }
  }

  // --- Valeurs dérivées ---
  const isSolo = partie?.modeSolo ?? true
  const sortedPlayers = [...(partie?.players ?? [])].sort((a, b) => b.score - a.score)
  const me = partie?.players.find((p) => p.dresseurId === sessionId)
  const topScore = sortedPlayers[0]?.score ?? 0
  const isTie = !isSolo && sortedPlayers.length > 1 &&
    sortedPlayers.filter((p) => p.score === topScore).length > 1
  const winner = !isSolo && !isTie && sortedPlayers.length > 0 ? sortedPlayers[0] : null

  return {
    isLoading,
    errorMessage,
    partie,
    sprites,
    gameFullyComplete,
    isRelaunching,
    isCreatingNew,
    sortedPlayers,
    me,
    winner,
    isTie,
    isSolo,
    rematchRequested,
    handleRematchClick,
    handleRelaunchClick,
    handleNewGame,
  }
}
