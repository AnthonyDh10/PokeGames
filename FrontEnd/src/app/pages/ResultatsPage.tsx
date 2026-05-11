import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { motion } from 'framer-motion'
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

  async function load() {
    if (!partieId) return
    setIsLoading(true)
    try {
      const p = await getPartie(partieId)
      setPartie(p)
      setChatContext({ partieId, sessionCode: p.codeSession ?? '', isSolo: p.modeSolo || !p.dresseur2Id })
      const complete = p.modeSolo ? (p.completedPokemonsJ1?.length ?? 0) > 0 : ((p.completedPokemonsJ1?.length ?? 0) > 0 && (p.completedPokemonsJ2?.length ?? 0) > 0)
      setGameFullyComplete(complete)
      await loadSprites(p)
    } catch (err: any) { setErrorMessage(err?.message ?? 'Erreur') } 
    finally { setIsLoading(false) }
  }

  useEffect(() => { load() }, [partieId])

  // --- HANDLERS ACTIONS ---
  async function handleRematchClick() { /* ... ta logique de revanche ... */ setRematchRequested(true); await markRematchReady(partieId!, sessionId); }
  async function handleRelaunchClick() { /* ... ta logique relancer ... */ setIsRelaunching(true); const n = await createPartie(sessionId); navigate(`/pokedesc/${n.id}`); }
  async function handleNewGame() { setIsCreatingNew(true); const n = await createPartie(sessionId); navigate('/pokedesc', { state: { existingPartieId: n.id } }); }

  if (isLoading) return <div className="p-12 text-center">Chargement...</div>
  if (!partie) return null

  const isSolo = partie.modeSolo
  const j1Won = partie.scoreJ1 > partie.scoreJ2
  const j2Won = partie.scoreJ2 > partie.scoreJ1

  // --- RENDU DES SECTIONS ---

  const scoresSection = (
    <div className={`flex flex-col md:flex-row items-stretch gap-4 ${isSolo ? 'justify-center' : ''}`}>
      <ScoreCard name={player1Name} score={partie.scoreJ1} isWinner={!isSolo && j1Won} />
      {!isSolo && <div className="flex items-center justify-center font-bold text-gray-400">VS</div>}
      {!isSolo && <ScoreCard name={player2Name} score={partie.scoreJ2} isWinner={j2Won} />}
    </div>
  )

  return (
    <GameResultsLayout
      title="Résultats de la partie"
      sessionCode={partie.codeSession}
      scores={scoresSection}
      details={
        <PokemonCarouselSection 
          partie={partie} 
          sprites={sprites} 
          isSolo={isSolo} 
          player1Name={player1Name} 
          player2Name={player2Name} 
          gameFullyComplete={gameFullyComplete} 
        />
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

function ScoreCard({ name, score, isWinner }: { name: string, score: number, isWinner: boolean }) {
  return (
    <Card 
      header={<h2 className="font-heading text-lg text-white">{name} {isWinner && '👑'}</h2>}
      headerColor={isWinner ? colors.brand.yellow : colors.brand.blue}
      className="flex-1 text-center"
    >
      <div className="p-6">
        <div className="text-5xl font-bold mb-2" style={{ color: colors.brand.blue }}>{score}</div>
        <p className="text-sm text-gray-400 uppercase tracking-widest">points</p>
      </div>
    </Card>
  )
}

function PokemonCarouselSection({ partie, sprites, isSolo, player1Name, player2Name, gameFullyComplete }: any) {
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
    <Card pokeballOpacity={0} className="overflow-hidden bg-slate-50 border-4" borderColor={colors.brand.blueDeep}>
      <div className="p-6">
        {/* TITRE DU MENU */}
        <h3 className="font-heading text-center text-xl mb-8 uppercase tracking-tighter" style={{ color: colors.brand.blueDark }}>
          RÉCAPITULATIF DE LA PARTIE
        </h3>

        {/* PARTIE CARROUSEL (HAUT) */}
        <div className="relative flex items-center justify-center min-h-[180px] mb-8 bg-white/50">
           <button onClick={prev} className="absolute left-4 z-10 text-3xl hover:scale-125 transition-transform text-blue-600 select-none">◀</button>
           
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
                      <div className="font-heading uppercase mt-2 text-lg tracking-widest text-blue-900">
                        {p.pokemonName}
                      </div>
                    )}
                  </motion.div>
                )
              })}
           </div>
           
           <button onClick={next} className="absolute right-4 z-10 text-3xl hover:scale-125 transition-transform text-blue-600 select-none">▶</button>
        </div>

        {/* LIGNE DE SÉPARATION STYLE RPG */}
        <div className="h-1 w-full bg-slate-200 mb-8" />

        {/* PARTIE STATISTIQUES (BAS) - DANS LA MÊME CARD */}
        <div className={`grid gap-6 ${isSolo ? 'max-w-md mx-auto' : 'grid-cols-2'}`}>
          
          {/* Stats Joueur 1 */}
          <div className="flex flex-col space-y-3">
            <div className="font-heading text-xs py-1 px-3 rounded-full text-white self-start uppercase tracking-wider" style={{ backgroundColor: colors.brand.blue }}>
              {player1Name}
            </div>
            <StatDetails data={pJ1} color={colors.brand.blue} />
          </div>

          {/* Stats Joueur 2 (si multi) */}
          {!isSolo && (
            <div className="flex flex-col space-y-3 border-l-2 border-slate-100 pl-6">
              <div className="font-heading text-xs py-1 px-3 rounded-full text-white self-start uppercase tracking-wider" style={{ backgroundColor: colors.brand.yellowWarm }}>
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

// Sous-composant simplifié pour le contenu des stats
function StatDetails({ data, color, loading }: any) {
  if (loading) return <div className="animate-pulse italic text-gray-400 py-4">En attente des résultats...</div>
  if (!data) return <div className="text-gray-300 py-4 italic">Pas encore de données</div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end border-b border-slate-100 pb-2">
        <span className={`font-bold text-sm ${data.wasGuessed ? 'text-green-600' : 'text-red-500'}`}>
          {data.wasGuessed ? '✅ RÉUSSI' : '❌ RATÉ'}
        </span>
        <span className="text-2xl font-bold" style={{ color }}>
          {data.pointsEarned} <small className="text-xs uppercase">pts</small>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-100/50 p-2 rounded border border-slate-200/50">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Tentatives</div>
          <div className="font-bold text-slate-700">{data.attemptsUsed} / 3</div>
        </div>
        <div className="bg-slate-100/50 p-2 rounded border border-slate-200/50">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Indices</div>
          <div className="font-bold text-slate-700">{data.hintsUsed.length} utilisé(s)</div>
        </div>
      </div>

      {data.hintsUsed.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {data.hintsUsed.map((h: string) => (
            <span key={h} className="text-[9px] px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 uppercase font-medium">
              {HINT_LABELS[h] || h}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}