import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getPartie, markRematchReady, createPartie, startPartie } from '../services/partieService'
import { getHints } from '../services/pokemonService'
import Card from '../components/Card'
import GameResultsLayout from '../components/GameResultsLayout'
import ResultsActions from '../components/ResultsActions'
import { colors } from '../design/colors'
import type { PartieDto, CompletedPokemonDto } from '../types/partie'

const HINT_LABELS: Record<string, string> = {
  Type1: 'Type 1',
  Type2: 'Type 2',
  Generation: 'Génération',
  Category: 'Catégorie',
  Stats: 'Statistiques',
  Height: 'Taille',
  Weight: 'Poids',
  Abilities: 'Talents',
  Sprite: 'Silhouette',
}

export default function ResultatsPage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { sessionCode?: string } | null
  const { sessionId, playerName } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()

  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [partie, setPartie] = useState<PartieDto | null>(null)
  const [sprites, setSprites] = useState<Record<string, string>>({})
  const [gameFullyComplete, setGameFullyComplete] = useState(false)
  const [rematchRequested, setRematchRequested] = useState(false)
  const [isRelaunching, setIsRelaunching] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rematchPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Détermine si le joueur courant est J1
  const isPlayer1 = partie?.dresseur1Id === sessionId
  const myName = playerName || 'Joueur 1'
  const opponentName = 'Adversaire'
  const player1Name = isPlayer1 ? myName : opponentName
  const player2Name = isPlayer1 ? opponentName : myName

  async function loadSprites(p: PartieDto) {
    // N'afficher les sprites des deux joueurs que si la partie est terminée (ou en solo).
    let all: CompletedPokemonDto[] = []
    if (p.modeSolo || (p.statut ?? '').toLowerCase() === 'termine') {
      all = [...(p.completedPokemonsJ1 ?? []), ...(p.completedPokemonsJ2 ?? [])]
    } else {
      // Sinon, ne charger que les sprites du joueur courant
      if (p.dresseur1Id === sessionId) {
        all = [...(p.completedPokemonsJ1 ?? [])]
      } else {
        all = [...(p.completedPokemonsJ2 ?? [])]
      }
    }
    const newSprites: Record<string, string> = {}
    await Promise.all(
      all.map(async (cp) => {
        if (!newSprites[cp.pokemonId]) {
          try {
            const hints = await getHints(cp.pokemonId)
            if (hints.sprites?.frontDefault) {
              newSprites[cp.pokemonId] = hints.sprites.frontDefault
            }
          } catch {
            // ignore
          }
        }
      })
    )
    setSprites((prev) => ({ ...prev, ...newSprites }))
  }

  function isComplete(p: PartieDto): boolean {
    if (p.modeSolo) return (p.completedPokemonsJ1?.length ?? 0) > 0
    return (p.statut ?? '').toLowerCase() === 'termine'
  }

  async function load() {
    if (!partieId) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      const p = await getPartie(partieId)
      // Si la partie n'est pas marquée 'Termine' côté backend et qu'il s'agit d'un multijoueur,
      // masquer les données de l'adversaire pour ne pas dévoiler ses résultats avant qu'il ait cliqué sur "Terminer la partie".
      if (!p.modeSolo && (p.statut ?? '').toLowerCase() !== 'termine') {
        const isJ1 = p.dresseur1Id === sessionId
        const masked: PartieDto = {
          id: p.id,
          codeSession: p.codeSession,
          statut: p.statut,
          dresseur1Id: p.dresseur1Id,
          dresseur2Id: p.dresseur2Id,
          modeSolo: p.modeSolo,
          nbPokemons: p.nbPokemons,
          selectedGenerations: p.selectedGenerations,
          timerDurationSeconds: p.timerDurationSeconds,
          pokemonsToGuess: p.pokemonsToGuess,
          currentIndexJ1: p.currentIndexJ1,
          currentIndexJ2: p.currentIndexJ2,
          scoreJ1: p.scoreJ1,
          scoreJ2: 0,
          attemptsUsedJ1: p.attemptsUsedJ1,
          attemptsUsedJ2: 0,
          usedHintsJ1: p.usedHintsJ1,
          usedHintsJ2: [],
          completedPokemonsJ1: p.completedPokemonsJ1,
          completedPokemonsJ2: [],
        }
        setPartie(masked)
      } else {
        setPartie(p)
      }
      setChatContext({
        partieId,
        sessionCode: p.codeSession ?? '',
        isSolo: p.modeSolo || !p.dresseur2Id,
      })
      const complete = isComplete(p)
      setGameFullyComplete(complete)
      await loadSprites(p)
    } catch (err: any) {
      setErrorMessage(err?.message ?? 'Erreur inconnue')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh en multijoueur tant que la partie n'est pas complète
  useEffect(() => {
    if (!partie || gameFullyComplete || partie.modeSolo) return
    autoRefreshRef.current = setInterval(async () => {
      try {
        const p = await getPartie(partieId!)
        // Si la partie est terminée côté backend, afficher tout et arrêter le poll
        if ((p.statut ?? '').toLowerCase() === 'termine') {
          setGameFullyComplete(true)
          setPartie(p)
          await loadSprites(p)
          clearInterval(autoRefreshRef.current!)
          return
        }

        // Sinon, ne mettre à jour que les données du joueur courant (évite de dévoiler l'adversaire)
        setPartie((prev) => {
          if (!prev) return p
          if (prev.dresseur1Id === sessionId) {
            return {
              ...prev,
              scoreJ1: p.scoreJ1,
              attemptsUsedJ1: p.attemptsUsedJ1,
              usedHintsJ1: p.usedHintsJ1,
              completedPokemonsJ1: p.completedPokemonsJ1,
              currentIndexJ1: p.currentIndexJ1,
            }
          }
          return {
            ...prev,
            scoreJ2: p.scoreJ2,
            attemptsUsedJ2: p.attemptsUsedJ2,
            usedHintsJ2: p.usedHintsJ2,
            completedPokemonsJ2: p.completedPokemonsJ2,
            currentIndexJ2: p.currentIndexJ2,
          }
        })
        await loadSprites(p)
      } catch {
        // silent
      }
    }, 2000)
    return () => { if (autoRefreshRef.current) clearInterval(autoRefreshRef.current) }
  }, [partie, gameFullyComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  

  useEffect(() => {
    return () => { if (rematchPollRef.current) clearInterval(rematchPollRef.current) }
  }, [])

  async function handleRematchClick() {
    if (!partieId) return
    setRematchRequested(true)
    try {
      const status = await markRematchReady(partieId, sessionId)
      if (status.rematchPartieId) {
        navigate(`/pokedesc/${status.rematchPartieId}`)
        return
      }
      rematchPollRef.current = setInterval(async () => {
        try {
          const fresh = await markRematchReady(partieId, sessionId)
          if (fresh.rematchPartieId) {
            clearInterval(rematchPollRef.current!)
            navigate(`/pokedesc/${fresh.rematchPartieId}`)
          }
        } catch {
          // silent
        }
      }, 1000)
    } catch {
      setRematchRequested(false)
    }
  }

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
          },
        },
      })
    } catch {
      setIsCreatingNew(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card className="text-center text-gray-500">
          <div className="p-12">Chargement des résultats...</div>
        </Card>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card 
          headerColor={colors.game.error}
          headerClassName="py-3"
          header={<h3 className="font-display text-xl tracking-wide text-white">Erreur</h3>}
          className="border-red-500 text-center"
        >
          <div className="p-12">
            <p className="text-red-600 font-medium mb-4">❌ {errorMessage}</p>
            <button onClick={() => navigate('/home')} className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:-translate-y-0.5 transition">
              Retour au menu
            </button>
          </div>
        </Card>
      </div>
    )
  }

  if (!partie) return null

  const isSolo = partie.modeSolo
  const j1Won = partie.scoreJ1 > partie.scoreJ2
  const j2Won = partie.scoreJ2 > partie.scoreJ1
  const isDraw = !isSolo && gameFullyComplete && partie.scoreJ1 === partie.scoreJ2

  function PlayerCard({
    name,
    score,
    pokemons,
    isWinner,
    pending = false,
  }: {
    name: string
    score: number
    pokemons: CompletedPokemonDto[]
    isWinner: boolean
    pending?: boolean
  }) {
    return (
      <Card
        headerColor={isWinner ? colors.brand.yellow : colors.brand.blue}
        pokeballColor={isWinner ? colors.brand.yellow : colors.brand.blue}
        headerClassName="py-3"
        cardSize={{ width: 300, height: 250 }}
        animation={false}
        pokeballSize={150}
        header={
          <h2 className="font-display text-xl tracking-wide" style={{ color: colors.ui.textOnColor }}>
            {name} {isWinner && <span style={{ filter: 'grayscale(1)', marginLeft: '0.5rem' }}>👑</span>}
          </h2>
        }
        className="flex-1 transition-all"
        style={{
          borderColor: isWinner ? colors.brand.yellow : undefined,
          boxShadow: isWinner ? `0 8px 24px ${colors.brand.yellow}40` : undefined,
        }}
      >
        <div className="p-6 flex flex-col h-full text-center rounded-b-xl">
          {pending && (
            <span
              className="mx-auto inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 animate-pulse border"
              style={{
                backgroundColor: `${colors.game.hint}1A`,
                color: colors.brand.yellowWarm,
                borderColor: colors.game.hint,
              }}
            >
              ⏳ En cours...
            </span>
          )}
          <div className="text-5xl font-bold my-3" style={{ color: colors.brand.blue }}>
            {score}
          </div>
          <p className="text-sm mb-4" style={{ color: colors.ui.textMuted }}>points</p>
          <div className="flex gap-3 justify-center text-sm flex-wrap mt-auto" style={{ color: colors.ui.textMuted }}>
            <span className="px-2 py-1 rounded-md shadow-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
              ✅ {pokemons.filter(p => p.wasGuessed).length} devinés
            </span>
            <span className="px-2 py-1 rounded-md shadow-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
              ❌ {pokemons.filter(p => !p.wasGuessed).length} ratés
            </span>
          </div>
        </div>
      </Card>
    )
  }

  const scoresSection = (
    <div className={`flex flex-col md:flex-row items-stretch gap-4 ${isSolo ? 'justify-center' : ''}`}>
      <PlayerCard
        name={player1Name}
        score={partie.scoreJ1}
        pokemons={partie.completedPokemonsJ1 ?? []}
        isWinner={!isSolo && j1Won}
      />
      {!isSolo && (
        <>
          <div
            className="flex items-center justify-center text-2xl font-bold px-2 py-4 md:py-0"
            style={{ color: colors.ui.textMuted }}
          >
            VS
          </div>
          <PlayerCard
            name={player2Name}
            score={partie.scoreJ2}
            pokemons={partie.completedPokemonsJ2 ?? []}
            isWinner={j2Won}
            pending={!gameFullyComplete && (partie.completedPokemonsJ2?.length ?? 0) === 0}
          />
        </>
      )}
    </div>
  )

  const detailsSection = (
    <>
      {isDraw && (
        <Card className="bg-orange-50 border-2 border-orange-400">
          <div className="p-4 text-center text-orange-600 font-semibold text-lg">
            🤝 Match nul ! Les deux joueurs sont à égalité !
          </div>
        </Card>
      )}

      <Card headerClassName="py-4" pokeballOpacity={0}>
        <div className="p-6">
          <h2
            className="font-display text-2xl md:text-3xl tracking-wide text-center mb-6"
            style={{ color: colors.ui.textPrimary }}
          >
            Détails des Pokémon
          </h2>
          <div className={`grid gap-6 ${isSolo ? 'grid-cols-1 max-w-2xl mx-auto' : 'md:grid-cols-2'}`}>
            <PokemonColumn
              title={player1Name}
              pokemons={partie.completedPokemonsJ1 ?? []}
              sprites={sprites}
            />
            {!isSolo && (
              <PokemonColumn
                title={player2Name}
                pokemons={partie.completedPokemonsJ2 ?? []}
                sprites={sprites}
                loading={!gameFullyComplete && (partie.completedPokemonsJ2?.length ?? 0) === 0}
              />
            )}
          </div>
        </div>
      </Card>
    </>
  )

  return (
    <GameResultsLayout
      title="Résultats de la partie"
      sessionCode={state?.sessionCode ?? partie.codeSession}
      topAlert={
        !gameFullyComplete && !isSolo ? (
          <p className="text-orange-500 font-medium mt-2 animate-pulse">
            ⏳ En attente de la fin de partie du deuxième joueur...
          </p>
        ) : undefined
      }
      scores={scoresSection}
      details={detailsSection}
      actions={
        <ResultsActions
          isSolo={isSolo}
          bothFinished={gameFullyComplete}
          onNouvelle={handleNewGame}
          isCreatingNew={isCreatingNew}
          onRelancer={handleRelaunchClick}
          isRelaunching={isRelaunching}
          onRematch={handleRematchClick}
          rematchRequested={rematchRequested}
          relancerColor={colors.brand.blue}
          nouvellePartieColor={colors.brand.blue}
          requireFinishedForNewGame
        />
      }
    />
  )
}

function PokemonColumn({
  title,
  pokemons,
  sprites,
  loading = false,
}: {
  title: string
  pokemons: CompletedPokemonDto[]
  sprites: Record<string, string>
  loading?: boolean
}) {
  return (
    <Card
      headerColor={colors.brand.blueDark} // blue-900 equivalent
      headerClassName="py-3"
      pokeballColor={colors.brand.blueDark}
      header={<h3 className="font-display text-lg tracking-wide text-white">{title}</h3>}
      className="h-full"
    >
      <div className="p-4 flex flex-col gap-3">
        {loading && (
          <p className="text-orange-500 italic text-center animate-pulse py-8">
            ⏳ Résultats en cours de chargement...
          </p>
        )}

        {!loading && pokemons.length === 0 && (
          <p className="text-gray-400 italic text-center py-8">Aucun Pokémon complété</p>
        )}

        {pokemons.map((cp) => (
          <div
            key={cp.pokemonId}
            className={`rounded-xl border-2 p-4 transition hover:-translate-y-0.5 hover:shadow-sm bg-white
              ${cp.wasGuessed
                ? 'border-green-400'
                : 'border-red-300'}`}
          >
            {/* En-tête pokémon */}
            <div className="flex items-center gap-3 pb-3 mb-3 border-b border-gray-100">
              <img
                src={sprites[cp.pokemonId] ?? ''}
                alt={cp.pokemonName}
                className={`w-16 h-16 rounded-lg p-1 ${cp.wasGuessed ? 'bg-green-50' : 'bg-red-50'}`}
                style={{ imageRendering: 'pixelated' }}
              />
              <div>
                <h4 className="font-bold text-gray-800 text-base">{cp.pokemonName}</h4>
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full border mt-1
                  ${cp.wasGuessed
                    ? 'bg-green-50 text-green-700 border-green-400'
                    : 'bg-red-50 text-red-600 border-red-300'}`}>
                  {cp.wasGuessed ? '✅ Deviné' : '❌ Raté'}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Tentatives</span>
                <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{cp.attemptsUsed} / 3</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Indices utilisés</span>
                <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{cp.hintsUsed.length}</span>
              </div>

              {cp.hintsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {cp.hintsUsed.map((h) => (
                    <span key={h} className="bg-blue-50 text-blue-700 border border-blue-200 text-xs px-2 py-1 rounded-md font-medium">
                      {HINT_LABELS[h] ?? h}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between pt-3 border-t border-gray-100 mt-2 items-center">
                <span className="text-gray-500 font-medium">Points obtenus</span>
                <span className="font-bold text-blue-600 text-lg">{cp.pointsEarned} pts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}