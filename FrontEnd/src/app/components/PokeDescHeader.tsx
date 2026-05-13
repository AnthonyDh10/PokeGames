import Card from './Card'
import HPBar from './HPBar'
import Timer from './Timer'
import Pokeball from './images/pokéball_face.png'
import { colors } from '../design/colors'
import { getGenerationsDisplay } from '../utils/pokedescLogic'

interface PokeDescHeaderProps {
  playerName: string
  currentScore: number
  nbPokemons: number
  attemptsUsed: number
  selectedGenerations: number[] | undefined
  timeRemaining: number
  timerDurationSeconds: number | undefined
  timerShake: boolean
  timerFlash: boolean
  showTimePenalty: boolean
  currentTimePenalty: number
}

export default function PokeDescHeader({
  playerName,
  currentScore,
  nbPokemons,
  attemptsUsed,
  selectedGenerations,
  timeRemaining,
  timerDurationSeconds,
  timerShake,
  timerFlash,
  showTimePenalty,
  currentTimePenalty,
}: PokeDescHeaderProps) {
  return (
    <Card
        headerColor={colors.brand.blue}
        headerClassName="py-4"
        header={
          <h1 className="font-display text-xl md:text-2xl tracking-wide" style={{ color: colors.ui.textOnColor }}>
            POKÉDESC : Devine le Pokémon !
          </h1>
        }
        pokeballOpacity={0.1}
        pokeballColor={colors.brand.blue}
      >
        <div className="p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-around items-center gap-6 text-base">

            {/* HPBar + Tentatives */}
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
              <div className="w-full sm:w-56 md:w-64">
                <HPBar
                  name={playerName || 'Joueur'}
                  current={currentScore}
                  max={nbPokemons * 100}
                />
              </div>
              <div className="flex flex-col items-center gap-1 whitespace-nowrap">
                <span className="font-heading font-semibold text-center" style={{ color: colors.brand.blueDark }}>
                  Tentatives
                </span>
                <div className="flex gap-2">
                  {[...Array(3)].map((_, i) => (
                    <img
                      key={i}
                      src={Pokeball}
                      alt={`Tentative ${i + 1}`}
                      className={`w-12 h-10 ${i >= 3 - attemptsUsed ? 'grayscale' : ''}`}
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Génération */}
            {selectedGenerations && getGenerationsDisplay(selectedGenerations) && (
              <div className="flex flex-col items-center gap-1">
                <span className="font-heading font-semibold text-sm" style={{ color: colors.brand.blueDark }}>
                  {getGenerationsDisplay(selectedGenerations)?.label}
                </span>
                <span className="font-heading text-xl md:text-2xl tracking-wide font-bold" style={{ color: colors.brand.blueDark, fontSize: '1.25rem' }}>
                  {getGenerationsDisplay(selectedGenerations)?.value}
                </span>
              </div>
            )}

            {/* Timer */}
            <div className="flex justify-center w-full md:w-auto">
              <Timer
                value={timeRemaining}
                mode={timerDurationSeconds === -1 ? 'stopwatch' : 'countdown'}
                shake={timerShake}
                flash={timerFlash}
                showPenalty={showTimePenalty && timerDurationSeconds !== -1}
                penaltyValue={currentTimePenalty}
              />
            </div>

          </div>
        </div>
      </Card>
  )
}
