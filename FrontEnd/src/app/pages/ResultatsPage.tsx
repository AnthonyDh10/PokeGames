import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useResultats } from '../logic/useResultats'
import Card from '../components/primitives/Card'
import GameResultsLayout from '../components/game/GameResultsLayout'
import ResultsActions from '../components/game/ResultsActions'
import HPBar from '../components/primitives/HPBar'
import WinnerCard from '../components/game/WinnerCard'
import { colors } from '../design/colors'
import type { PartieDto, CompletedPokemonDto } from '../types/partie'
import { HINTS_CONFIG } from '../utils/pokedescConstants'
import dittoGif from '../components/images/ditto-gif.gif'

/** Labels d'affichage des indices, dérivés de HINTS_CONFIG (source unique de vérité). */
const HINT_LABELS: Record<string, string> = Object.fromEntries(HINTS_CONFIG.map((h) => [h.key, h.label]))

/**
 * Page de résultats PokéDesc.
 * La logique (chargement, auto-refresh, actions) est gérée par `useResultats`.
 */
export default function ResultatsPage() {
  const { partieId } = useParams<{ partieId: string }>()

  const {
    isLoading, partie, sprites, gameFullyComplete,
    isRelaunching, isCreatingNew,
    player1Name, player2Name, isSolo,
    j1Wins, j2Wins, winnerName,
    rematchRequested, handleRematchClick, handleRelaunchClick, handleNewGame,
  } = useResultats(partieId)

  if (isLoading) return <div className="p-12 text-center">Chargement...</div>
  if (!partie) return null

  // --- RENDU DES SECTIONS ---

  const scoresSection = (
    <div className="flex flex-col gap-6">
      <FinalScoreBars 
        partie={partie} 
        player1Name={player1Name} 
        player2Name={player2Name} 
        isSolo={isSolo} 
      />
      {!isSolo && (
        <WinnerCard
          winner={winnerName}
          isSolo={isSolo}
          bothFinished={gameFullyComplete}
          borderColor={colors.brand.blueDeep}
          mainColor={colors.brand.blue}
        />
      )}
    </div>
  )

  return (
    <GameResultsLayout
      title="POKÉDESC"
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
              <h3 className="font-heading text-xl uppercase tracking-widest text-orange-500">
                <img src={dittoGif} alt="" className="w-full h-full" />    
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
      <div className="p-3 sm:p-6">
        {/* TITRE DU MENU */}
        <h3 className="font-heading text-center text-xl mb-4 sm:mb-8 uppercase tracking-tighter" style={{ color: colors.brand.blueDark }}>
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
        <div className={`grid gap-6 ${isSolo ? 'max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-2'}`}>
          
          {/* Stats Joueur 1 */}
          <div className="flex flex-col space-y-3">
            <div className="font-display text-xs py-1 px-3 self-start uppercase tracking-wider" style={{ color: colors.brand.blueDark}}>
              {player1Name}
            </div>
            <StatDetails data={pJ1} color={colors.brand.blue} />
          </div>

          {/* Stats Joueur 2 (si multi) */}
          {!isSolo && (
            <div className="flex flex-col space-y-3 pt-4 sm:pt-0 sm:border-l-2 sm:border-slate-100 sm:pl-6">
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
        <div className="p-3 sm:p-6">
        <h3 className="font-heading text-center text-xl mb-6 sm:mb-10 uppercase tracking-widest" style={{ color: colors.brand.blueDark }}>
          SCORES FINAUX
        </h3>
        
        {/* Conteneur principal avec un grand GAP pour bien séparer les joueurs */}
        <div className="flex flex-col gap-6 sm:gap-10 max-w-xl mx-auto">
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