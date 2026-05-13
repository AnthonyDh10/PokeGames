import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getPartie, markRematchReady, createPartie, startPartie } from '../services/partieService'
import { getHints } from '../services/pokemonService'
import Card from '../components/Card'
import GameResultsLayout from '../components/GameResultsLayout'
import ResultsActions from '../components/ResultsActions'
import HPBar from '../components/HPBar'
import { colors } from '../design/colors'
import type { PartieDto, CompletedPokemonDto } from '../types/partie'

const HINT_LABELS: Record<string, string> = {
  Type1: 'Type 1', Type2: 'Type 2', Generation: 'Génération', Category: 'Catégorie',
  Stats: 'Statistiques', Height: 'Taille', Weight: 'Poids', Abilities: 'Talents', Sprite: 'Silhouette',
}

export default function ResultatsPage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
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

  const isPlayer1 = partie?.dresseur1Id === sessionId
  const player1Name = isPlayer1 ? (playerName || 'Joueur 1') : 'Adversaire'
  const player2Name = isPlayer1 ? 'Adversaire' : (playerName || 'Joueur 2')

  // --- LOGIQUE DE CHARGEMENT ---
  async function loadSprites(p: PartieDto) {
    const all = [...(p.completedPokemonsJ1 ?? []), ...(p.completedPokemonsJ2 ?? [])]
    const newSprites: Record<string, string> = {}
    await Promise.all(all.map(async (cp) => {
      if (!newSprites[cp.pokemonId]) {
        try {
          const hints = await getHints(cp.pokemonId)
          if (hints.sprites?.frontDefault) newSprites[cp.pokemonId] = hints.sprites.frontDefault
        } catch {}
      }
    }))
    setSprites((prev) => ({ ...prev, ...newSprites }))
  }

  function isComplete(p: PartieDto): boolean {
    if (p.modeSolo) return (p.completedPokemonsJ1?.length ?? 0) > 0
    return (p.completedPokemonsJ1?.length ?? 0) > 0 && (p.completedPokemonsJ2?.length ?? 0) > 0
  }

  async function load() {
    if (!partieId) return
    setIsLoading(true)
    try {
      const p = await getPartie(partieId)
      setPartie(p)
      setChatContext({ partieId, sessionCode: p.codeSession ?? '', isSolo: p.modeSolo || !p.dresseur2Id })
      const complete = isComplete(p)
      setGameFullyComplete(complete)
      await loadSprites(p)
    } catch (err: any) { setErrorMessage(err?.message ?? 'Erreur') } 
    finally { setIsLoading(false) }
  }

  useEffect(() => { load() }, [partieId])

  // --- AUTO-REFRESH MULTIJOUEUR ---
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
  }, [partie, gameFullyComplete])

  useEffect(() => {
    return () => { 
      if (rematchPollRef.current) clearInterval(rematchPollRef.current)
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
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
            timerDuration: partie.timerDurationSeconds,
          },
        },
      })
    } catch {
      setIsCreatingNew(false)
    }
  }

  if (isLoading) return <div className="p-12 text-center">Chargement...</div>
  if (!partie) return null

  const isSolo = partie.modeSolo

  // --- RENDU DES SECTIONS ---

  const scoresSection = (
    <FinalScoreBars 
      partie={partie} 
      player1Name={player1Name} 
      player2Name={player2Name} 
      isSolo={isSolo} 
    />
  )

  return (
    <GameResultsLayout
      title="Résultats"
      bodyColor={colors.brand.blue}
      sessionCode={partie.codeSession}
      scores={scoresSection}
      details={
        !isSolo && !gameFullyComplete ? (
          <Card 
            pokeballOpacity={0} 
            className="overflow-hidden bg-slate-50 border-4 flex items-center justify-center min-h-[300px]" 
            borderColor={colors.brand.blueDeep}
          >
            <div className="p-10 text-center">
              <h3 className="font-heading text-xl uppercase tracking-widest text-orange-500 animate-pulse">
                ⏳ En attente que le second joueur finisse...
              </h3>
            </div>
          </Card>
        ) : (
          <PokemonCarouselSection 
            partie={partie} 
            sprites={sprites} 
            isSolo={isSolo} 
            player1Name={player1Name} 
            player2Name={player2Name} 
            gameFullyComplete={gameFullyComplete} 
          />
        )
      }
      actions={
        <ResultsActions
          isSolo={isSolo} bothFinished={gameFullyComplete}
          onNouvelle={handleNewGame} isCreatingNew={isCreatingNew}
          onRelancer={handleRelaunchClick} isRelaunching={isRelaunching}
          onRematch={handleRematchClick} rematchRequested={rematchRequested}
          buttonColor={colors.brand.blue} buttonColorDark={colors.brand.blueDark}
          buttonColorLight={colors.brand.blueLight} buttonColorBorder={colors.brand.blueDeep}
          requireFinishedForNewGame
        />
      }
    />
  )
}

// --- SOUS-COMPOSANTS LOCAUX ---

interface PokemonCarouselSectionProps {
  partie: PartieDto
  sprites: Record<string, string>
  isSolo: boolean
  player1Name: string
  player2Name: string
  gameFullyComplete: boolean
}

function PokemonCarouselSection({ partie, sprites, isSolo, player1Name, player2Name, gameFullyComplete }: PokemonCarouselSectionProps) {
  const [index, setIndex] = useState(0)
  
  if (!partie) return null
  
  const list = partie.completedPokemonsJ1 ?? []
  const total = list.length
  if (total === 0) return null

  const pJ1 = list[index]
  const pJ2 = partie.completedPokemonsJ2?.[index]

  const next = () => setIndex((i) => (i + 1) % total)
  const prev = () => setIndex((i) => (i - 1 + total) % total)

  return (
    <Card 
      pokeballOpacity={0} 
      className="overflow-hidden bg-slate-50 border-4" 
      borderColor={colors.brand.blueDeep}
    >
      <div className="p-6">
        {/* TITRE DU MENU */}
        <h3 className="font-heading text-center text-xl mb-8 uppercase tracking-tighter" style={{ color: colors.brand.blueDark }}>
          RÉCAPITULATIF DE LA PARTIE
        </h3>

        {/* PARTIE CARROUSEL (HAUT) */}
        <div className="relative flex items-center justify-center min-h-[180px] mb-8" style={{backgroundColor: colors.brand.white}}>
           <button onClick={prev} className="absolute left-4 z-10 text-3xl hover:scale-125 transition-transform select-none" style={{ color: colors.brand.blueDark }}>◀</button>
           
           <div className="relative w-64 h-40 flex items-center justify-center">
              {list.map((p: any, i: number) => {
                const isMain = i === index
                const isPrev = i === (index - 1 + total) % total
                const isNext = i === (index + 1) % total
                if (!isMain && !isPrev && !isNext) return null
                
                return (
                  <motion.div
                    key={p.pokemonId}
                    className="absolute text-center"
                    initial={false}
                    animate={{
                      x: isMain ? 0 : isPrev ? -120 : 120,
                      scale: isMain ? 1.3 : 0.7,
                      opacity: isMain ? 1 : 0.2,
                      filter: isMain ? "blur(0px)" : "blur(2px)",
                      zIndex: isMain ? 10 : 5
                    }}
                    transition={{ duration: 0.4 }}
                  >
                    <img 
                      src={sprites[p.pokemonId]} 
                      alt={p.pokemonName}
                      className="w-32 h-32 mx-auto drop-shadow-md" 
                      style={{ imageRendering: 'pixelated' }} 
                    />
                    {isMain && (
                      <div className="font-display uppercase mt-2 text-lg tracking-widest" style={{ color: colors.brand.blueDark }}>
                        {p.pokemonName}
                      </div>
                    )}
                  </motion.div>
                )
              })}
           </div>
           
           <button onClick={next} className="absolute right-4 z-10 text-3xl hover:scale-125 transition-transform select-none" style={{ color: colors.brand.blueDark }}>▶</button>
        </div>

        {/* LIGNE DE SÉPARATION STYLE RPG */}
        <div className="h-1 w-full bg-slate-200 mb-8" />

        {/* PARTIE STATISTIQUES (BAS) */}
        <div className={`grid gap-6 ${isSolo ? 'max-w-md mx-auto' : 'grid-cols-2'}`}>
          
          {/* Stats Joueur 1 */}
          <div className="flex flex-col space-y-3">
            <div className="font-display text-xs py-1 px-3 self-start uppercase tracking-wider" style={{ color: colors.brand.blueDark}}>
              {player1Name}
            </div>
            <StatDetails data={pJ1} color={colors.brand.blue} />
          </div>

          {/* Stats Joueur 2 (si multi) */}
          {!isSolo && (
            <div className="flex flex-col space-y-3 border-l-2 border-slate-100 pl-6">
              <div className="font-display text-xs py-1 px-3 self-start uppercase tracking-wider" style={{ color: colors.brand.yellowWarm}}>
                {player2Name}
              </div>
              <StatDetails 
                data={pJ2} 
                color={colors.brand.yellowWarm} 
                loading={!gameFullyComplete && !pJ2} 
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

interface StatDetailsProps {
  data: CompletedPokemonDto | null | undefined
  color: string
  loading?: boolean
}

function StatDetails({ data, color, loading }: StatDetailsProps) {
  if (loading) return <div className="font-heading animate-pulse text-orange-500 py-4">⏳ EN ATTENTE DU JOUEUR...</div>
  if (!data) return <div className="font-heading text-gray-300 py-4">AUCUNE DONNÉE</div>

  return (
    <div className="space-y-4 font-heading uppercase tracking-widest">
      {/* En-tête (Score) avec bordure pointillée type RPG */}
      <div className="flex justify-between items-end border-b-4 border-dashed pb-2" style={{ borderColor: color }}>
        <span className={`font-bold text-sm ${data.wasGuessed ? 'text-green-600' : 'text-red-500'}`}>
          {data.wasGuessed ? '► RÉUSSI' : 'X ÉCHEC'}
        </span>
        <span className="text-2xl font-bold" style={{ color }}>
          {data.pointsEarned} <small className="text-xs">PTS</small>
        </span>
      </div>

      {/* Grille de stats façon "Boîtes de dialogue" */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
          style={{ borderColor: color, boxShadow: `3px 3px 0px ${color}` }}
        >
          <div className="text-[10px] text-gray-500 mb-1">TENTATIVE(S)</div>
          <div className="font-bold text-lg text-gray-800">{data.attemptsUsed} / 3</div>
        </div>

        <div 
          className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
          style={{ borderColor: color, boxShadow: `3px 3px 0px ${color}` }}
        >
          <div className="text-[10px] text-gray-500 mb-1">INDICE(S) UTILISÉ(S)</div>
          <div className="font-bold text-lg text-gray-800">{data.hintsUsed.length}</div>
        </div>
      </div>

      {/* Indices avec style "Crochets" classiques */}
      {data.hintsUsed.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {data.hintsUsed.map((h: string) => (
            <span 
              key={h} 
              className="text-[10px] px-2 py-1 bg-gray-100 border-2 border-gray-800 text-gray-700 font-bold"
            >
              [{HINT_LABELS[h] || h}]
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function FinalScoreBars({ partie, player1Name, player2Name, isSolo }: { 
  partie: PartieDto, 
  player1Name: string, 
  player2Name: string, 
  isSolo: boolean 
}) {
  const maxScore = (partie.nbPokemons || 1) * 100
  
  const j1Wins = !isSolo && partie.scoreJ1 > partie.scoreJ2
  const j2Wins = !isSolo && partie.scoreJ2 > partie.scoreJ1

  return (
    <Card 
      borderColor={colors.brand.blueDeep} 
      className="border-4 bg-slate-50 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.1)]"
      pokeballOpacity={0}
    >
      <div className="p-6">
        <h3 className="font-heading text-center text-xl mb-10 uppercase tracking-widest" style={{ color: colors.brand.blueDark }}>
          SCORES FINAUX
        </h3>
        
        {/* Conteneur principal avec un grand GAP pour bien séparer les joueurs */}
        <div className="flex flex-col gap-10 max-w-xl mx-auto">
          <HPBar 
            name={player1Name} 
            current={partie.scoreJ1} 
            max={maxScore} 
            isWinner={j1Wins}
          />

          {!isSolo && (
            <HPBar 
              name={player2Name} 
              current={partie.scoreJ2} 
              max={maxScore} 
              isWinner={j2Wins}
            />
          )}
        </div>
      </div>
    </Card>
  )
}