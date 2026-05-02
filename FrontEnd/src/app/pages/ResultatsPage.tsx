import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
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
  const { sessionId, playerName } = useSessionStore()

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
    const all = [...(p.completedPokemonsJ1 ?? []), ...(p.completedPokemonsJ2 ?? [])]
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
    return (p.completedPokemonsJ1?.length ?? 0) > 0 && (p.completedPokemonsJ2?.length ?? 0) > 0
  }

  async function load() {
    if (!partieId) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      const p = await getPartie(partieId)
      setPartie(p)
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
        const prevJ2Count = partie.completedPokemonsJ2?.length ?? 0
        const newJ2Count = p.completedPokemonsJ2?.length ?? 0
        if (newJ2Count !== prevJ2Count) {
          setPartie(p)
          await loadSprites(p)
        }
        if (isComplete(p)) {
          setGameFullyComplete(true)
          setPartie(p)
          clearInterval(autoRefreshRef.current!)
        }
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

  const scoresSection = (
    <div className={`flex flex-col md:flex-row items-stretch gap-4 ${isSolo ? 'justify-center' : ''}`}>

      {/* J1 */}
      <Card
        headerColor={!isSolo && j1Won ? colors.brand.yellow : colors.brand.blue}
        pokeballColor={!isSolo && j1Won ? colors.brand.yellow : colors.brand.blue}
        headerClassName="py-3"
        header={
          <h2 className="font-display text-xl tracking-wide" style={{ color: colors.ui.textOnColor }}>
            {player1Name} {!isSolo && j1Won && '👑'}
          </h2>
        }
        className={`flex-1 transition-all ${!isSolo && j1Won ? 'border' : ''}`}
        style={{
          borderColor: !isSolo && j1Won ? colors.brand.yellow : undefined,
          boxShadow: !isSolo && j1Won ? `0 8px 24px ${colors.brand.yellow}40` : undefined,
        }}
      >
        <div className="p-6 flex flex-col h-full text-center rounded-b-xl">
          <div className="text-5xl font-bold my-3" style={{ color: colors.brand.blue }}>
            {partie.scoreJ1}
          </div>
          <p className="text-sm mb-4" style={{ color: colors.ui.textMuted }}>points</p>
          <div className="flex gap-3 justify-center text-sm flex-wrap mt-auto" style={{ color: colors.ui.textMuted }}>
            <span className="px-2 py-1 rounded-md shadow-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
              ✅ {partie.completedPokemonsJ1?.filter(p => p.wasGuessed).length ?? 0} devinés
            </span>
            <span className="px-2 py-1 rounded-md shadow-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
              ❌ {partie.completedPokemonsJ1?.filter(p => !p.wasGuessed).length ?? 0} ratés
            </span>
          </div>
        </div>
      </Card>

      {/* VS divider */}
      {!isSolo && (
        <div
          className="flex items-center justify-center text-2xl font-bold px-2 py-4 md:py-0"
          style={{ color: colors.ui.textMuted }}
        >
          VS
        </div>
      )}

      {/* J2 */}
      {!isSolo && (
        <Card
          headerColor={j2Won ? colors.brand.yellow : colors.brand.blue}
          headerClassName="py-3"
          pokeballColor={j2Won ? colors.brand.yellow : colors.brand.blue}
          header={
            <h2 className="font-display text-xl tracking-wide" style={{ color: colors.ui.textOnColor }}>
              {player2Name} {j2Won && '👑'}
            </h2>
          }
          className={`flex-1 transition-all ${j2Won ? 'border' : ''}`}
          style={{
            borderColor: j2Won ? colors.brand.yellow : undefined,
            boxShadow: j2Won ? `0 8px 24px ${colors.brand.yellow}40` : undefined,
          }}
        >
          <div className="p-6 flex flex-col h-full text-center rounded-b-xl">
            {!gameFullyComplete && (partie.completedPokemonsJ2?.length ?? 0) === 0 && (
              <span
                className="mx-auto inline-block text-xs font-medium px-2 py-1 rounded-full mb-2 animate-pulse border"
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
              {partie.scoreJ2}
            </div>
            <p className="text-sm mb-4" style={{ color: colors.ui.textMuted }}>points</p>
            <div className="flex gap-3 justify-center text-sm flex-wrap mt-auto" style={{ color: colors.ui.textMuted }}>
              <span className="px-2 py-1 rounded-md shadow-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
                ✅ {partie.completedPokemonsJ2?.filter(p => p.wasGuessed).length ?? 0} devinés
              </span>
              <span className="px-2 py-1 rounded-md shadow-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
                ❌ {partie.completedPokemonsJ2?.filter(p => !p.wasGuessed).length ?? 0} ratés
              </span>
            </div>
          </div>
        </Card>
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
      sessionCode={partie.codeSession}
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