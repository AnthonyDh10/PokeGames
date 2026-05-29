import type { ReactNode } from 'react'
import Card from '../primitives/Card'
import Timer from '../primitives/Timer'
import AttemptsDisplay from '../primitives/AttemptsDisplay'
import { colors } from '../../design/colors'
import { getGenerationsDisplay } from '../../utils/pokedescLogic'

interface GameHeaderProps {
  /** Titre affiché dans la barre colorée de la carte */
  title: ReactNode
  /** Description courte affichée dans le corps (optionnelle) */
  description?: string
  /** Couleur de la barre du header (CSS color) */
  color: string
  /** Code de session affiché dans les stats */
  sessionCode?: string
  /** Nombre de mauvaises tentatives utilisées */
  attemptsUsed: number
  /** Nombre maximum de tentatives (défaut : 3) */
  maxAttempts?: number
  /** Temps écoulé en secondes (mode chronomètre) */
  elapsed: number
  /** Générations sélectionnées (optionnel) */
  selectedGenerations?: number[]
  /** Slot custom côté droit (optionnel) */
  right?: ReactNode
}

export default function GameHeader({
  title,
  description,
  color,
  sessionCode,
  attemptsUsed,
  maxAttempts = 3,
  elapsed,
  selectedGenerations,
  right,
}: GameHeaderProps) {
  return (
    <Card
      headerColor={color}
      headerClassName="py-4"
      header={
        <h1 className="font-display text-xl md:text-2xl tracking-wide text-center" style={{ color: colors.ui.textOnColor }}>
          {title}
        </h1>
      }
      pokeballOpacity={0.1}
      pokeballColor={color}
    >
      <div className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">

          {/* Gauche : description + stats */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {description && (
              <p className="font-heading text-sm text-center text-gray-500 max-w-xs">
                {description}
              </p>
            )}
            <div className="flex flex-wrap gap-6 justify-center items-center">
              {sessionCode && (
                <div className="text-center">
                  <div className="font-heading text-xs text-gray-500 uppercase tracking-wide">Code</div>
                  <div className="font-heading font-semibold" style={{ color: colors.ui.textPrimary }}>{sessionCode}</div>
                </div>
              )}
              <AttemptsDisplay used={attemptsUsed} max={maxAttempts} accentColor={color} />
              {selectedGenerations && getGenerationsDisplay(selectedGenerations) && (
                <div className="text-center">
                  <div className="font-heading text-xs text-gray-500 uppercase tracking-wide">{getGenerationsDisplay(selectedGenerations)?.label}</div>
                  <div className="font-heading font-semibold" style={{ color: colors.ui.textPrimary }}>{getGenerationsDisplay(selectedGenerations)?.value}</div>
                </div>
              )}
            </div>
          </div>

          {/* Droite : timer ou slot custom */}
          <div className="flex justify-end">
            {right ?? <Timer value={elapsed} mode="stopwatch" />}
          </div>

        </div>
      </div>
    </Card>
  )
}
