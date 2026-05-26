import Card from './Card'
import HPBar from './HPBar'
import Timer from './Timer'
import Pokeball from './images/pokéball_face.png'
import { colors } from '../design/colors'
import { getGenerationsDisplay } from '../utils/pokedescLogic'

/** Props du composant `PokeDescHeader`. */
interface PokeDescHeaderProps {
  /** Pseudo du joueur, affiché dans la barre HP. */
  playerName: string
  /** Score actuel en points. */
  currentScore: number
  /** Nombre total de Pokémon à deviner dans la partie (détermine le max de la barre HP). */
  nbPokemons: number
  /** Nombre de tentatives utilisées pour le Pokémon en cours (0–3). */
  attemptsUsed: number
  /** Générations sélectionnées pour la partie (ex : `[1, 2, 3]`). */
  selectedGenerations: number[] | undefined
  /** Temps restant en secondes, transmis directement au composant `Timer`. */
  timeRemaining: number
  /**
   * Durée totale du timer en secondes.
   * `-1` ou `undefined` → mode chronomètre (affiche ♾️ dans `Timer`).
   */
  timerDurationSeconds: number | undefined
  /** `true` pendant l'animation de secousse du timer. */
  timerShake: boolean
  /** `true` pendant l'animation de clignotement rouge du timer. */
  timerFlash: boolean
  /** `true` lorsque la pénalité flottante doit être affichée. */
  showTimePenalty: boolean
  /** Valeur en secondes de la pénalité actuellement affichée. */
  currentTimePenalty: number
}

/**
 * En-tête de la page PokéDesc, affichant les informations de partie en cours :
 * - Barre HP (score / max) avec le pseudo du joueur
 * - Pokéballs représentant les tentatives restantes
 * - Générations sélectionnées
 * - Timer avec animations (shake, flash, pénalité flottante)
 */
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
          <h1 className="font-display text-xl md:text-2xl tracking-wide text-center" style={{ color: colors.ui.textOnColor }}>
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
                <span className="font-heading font-semibold text-sm text-center" style={{ color: colors.brand.blueDark }}>
                  {getGenerationsDisplay(selectedGenerations)?.label}
                </span>
                <span className="font-heading text-xl md:text-2xl tracking-wide font-bold text-center" style={{ color: colors.brand.blueDark, fontSize: '1.25rem' }}>
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
