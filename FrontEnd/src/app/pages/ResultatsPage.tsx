import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useResultats } from '../logic/useResultats'
import Card from '../components/primitives/Card'
import GameResultsLayout from '../components/game/GameResultsLayout'
import ResultsActions from '../components/game/ResultsActions'
import HPBar from '../components/primitives/HPBar'
import WinnerCard from '../components/game/WinnerCard'
import PartieDetailsModal from '../components/modals/PartieDetailsModal'
import { colors } from '../design/colors'
import type { PartieDto, PlayerDto } from '../types/partie'
import dittoGif from '../components/images/ditto-gif.gif'

/** Couleurs assignées aux joueurs selon leur rang (1er, 2e, 3e…). */
const RANK_COLORS = [
  colors.brand.yellowWarm,
  colors.brand.blue,
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#84cc16',
]

/**
 * Page de résultats PokéDesc.
 * La logique (chargement, auto-refresh, actions) est gérée par `useResultats`.
 */
export default function ResultatsPage() {
  const { partieId } = useParams<{ partieId: string }>()

  const {
    isLoading, partie, sprites, gameFullyComplete,
    isRelaunching, isCreatingNew,
    sortedPlayers, me, winner, isTie, isSolo,
    rematchRequested, handleRematchClick, handleRelaunchClick, handleNewGame,
  } = useResultats(partieId)

  if (isLoading) return <div className="p-12 text-center">Chargement...</div>
  if (!partie) return null

  // --- RENDU DES SECTIONS ---

  const scoresSection = (
    <FinalScoreBars
      partie={partie}
      sortedPlayers={sortedPlayers}
      me={me}
      winner={winner}
      isSolo={isSolo}
    />
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
              <img src={dittoGif} alt="" className="w-full h-full" />
            </div>
          </Card>
        ) : (
          <>
            <PokemonCarouselSection
              partie={partie}
              sprites={sprites}
              isSolo={isSolo}
              sortedPlayers={sortedPlayers}
              me={me}
              gameFullyComplete={gameFullyComplete}
            />
            <div className="mt-4">
              {!isSolo && (
                <WinnerCard
                  winner={winner?.name ?? null}
                  isSolo={isSolo}
                  bothFinished={gameFullyComplete}
                  borderColor={colors.brand.blueDeep}
                  mainColor={colors.brand.blue}
                />
              )}
            </div>
          </>
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

interface FinalScoreBarsProps {
  partie: PartieDto
  sortedPlayers: PlayerDto[]
  me: PlayerDto | undefined
  winner: PlayerDto | null
  isSolo: boolean
}

function FinalScoreBars({ partie, sortedPlayers, me, winner, isSolo }: FinalScoreBarsProps) {
  const maxScore = (partie.settings?.nbPokemons || 1) * 100

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

        <div className="flex flex-col gap-5 sm:gap-7 max-w-xl mx-auto">
          {sortedPlayers.map((player, rank) => {
            const isWinner = !isSolo && winner?.dresseurId === player.dresseurId
            const label = player.name + (player.dresseurId === me?.dresseurId ? ' (Vous)' : '')
            return (
              <div key={player.dresseurId} className="flex items-center gap-3">
                <span
                  className="font-heading text-sm w-6 text-center shrink-0"
                  style={{ color: RANK_COLORS[rank] ?? colors.brand.blueDark }}
                >
                  {rank === 0 ? '★' : `${rank + 1}.`}
                </span>
                <div className="flex-1">
                  <HPBar
                    name={label}
                    current={player.score}
                    max={maxScore}
                    isWinner={isWinner}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

interface PokemonCarouselSectionProps {
  partie: PartieDto
  sprites: Record<string, string>
  isSolo: boolean
  sortedPlayers: PlayerDto[]
  me: PlayerDto | undefined
  gameFullyComplete: boolean
}

function PokemonCarouselSection({ partie, sprites, isSolo, sortedPlayers, me, gameFullyComplete }: PokemonCarouselSectionProps) {
  const [index, setIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  if (!partie) return null

  // Référence : joueur avec le plus de Pokémon terminés (le plus avancé)
  const refPlayer = [...sortedPlayers].sort((a, b) => b.completedPokemons.length - a.completedPokemons.length)[0]
  const list = refPlayer?.completedPokemons ?? []
  const total = list.length
  if (total === 0) return null

  const currentPokemon = list[index]
  const next = () => setIndex((i) => (i + 1) % total)
  const prev = () => setIndex((i) => (i - 1 + total) % total)

  return (
    <>
      <Card
        pokeballOpacity={0}
        className="overflow-hidden bg-slate-50 border-4"
        borderColor={colors.brand.blueDeep}
      >
        <div className="p-3 sm:p-6">
          {/* TITRE */}
          <h3 className="font-heading text-center text-xl mb-4 sm:mb-8 uppercase tracking-tighter" style={{ color: colors.brand.blueDark }}>
            RÉCAPITULATIF DE LA PARTIE
          </h3>

          {/* CARROUSEL DE SPRITES */}
          <div className="relative flex items-center justify-center min-h-[180px] mb-8" style={{ backgroundColor: colors.brand.white }}>
            <button onClick={prev} className="absolute left-4 z-10 text-3xl hover:scale-125 transition-transform select-none" style={{ color: colors.brand.blueDark }}>◀</button>

            <div className="relative w-64 h-40 flex items-center justify-center">
              {list.map((p, i) => {
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
                      filter: isMain ? 'blur(0px)' : 'blur(2px)',
                      zIndex: isMain ? 10 : 5,
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

          {/* BOUTON DÉTAILS */}
          <div className="flex justify-center">
            <button
              onClick={() => setShowDetails(true)}
              className="font-heading text-sm uppercase tracking-widest px-6 py-2 border-2 border-dashed transition-transform hover:-translate-y-0.5"
              style={{ borderColor: colors.brand.blueDeep, color: colors.brand.blueDeep, boxShadow: `3px 3px 0px ${colors.brand.blueDeep}` }}
            >
              Afficher les détails de la partie
            </button>
          </div>
        </div>
      </Card>

      <PartieDetailsModal
        isOpen={showDetails}
        onClose={() => setShowDetails(false)}
        isSolo={isSolo}
        currentPokemon={currentPokemon}
        index={index}
        sortedPlayers={sortedPlayers}
        me={me}
        gameFullyComplete={gameFullyComplete}
      />
    </>
  )
}

