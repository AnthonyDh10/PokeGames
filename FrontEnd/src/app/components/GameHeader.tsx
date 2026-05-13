import type { ReactNode } from 'react'
import Card from './Card'
import Timer from './Timer'
import { colors } from '../design/colors'
import { formatGenerations } from '../utils/pokedescLogic'

interface GameHeaderProps {
  /** Titre affiché dans la barre colorée de la carte */
  title: ReactNode
  /** Description courte affichée dans le corps (optionnelle) */
  description?: string
  /** Couleur de la barre du header (CSS color) */
  color: string
  /** Code de session affiché dans les stats */
  sessionCode: string
  /** Nombre de tentatives */
  attemptCount: number
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
  attemptCount,
  elapsed,
  selectedGenerations,
  right,
}: GameHeaderProps) {
  return (
    <Card
      headerColor={color}
      headerClassName="py-4"
      header={
        <div className="flex flex-col md:flex-row md:items-center md:gap-3">
          <h1 className="font-display text-xl md:text-2xl tracking-wide" style={{ color: colors.ui.textOnColor }}>
            {title}
          </h1>
          {selectedGenerations && selectedGenerations.length > 0 && selectedGenerations.length < 9 && (
            <span className="font-heading text-lg md:text-xl tracking-wide" style={{ color: colors.ui.textOnColorSoft }}>
              <span className="hidden md:inline">{formatGenerations(selectedGenerations, false)}</span>
              <span className="md:hidden">{formatGenerations(selectedGenerations, true)}</span>
            </span>
          )}
        </div>
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
            <div className="flex flex-wrap gap-6 justify-center items-end">
              <div className="text-center">
                <div className="font-heading text-xs text-gray-500 uppercase tracking-wide">Code</div>
                <div className="font-heading font-semibold" style={{ color: colors.ui.textPrimary }}>{sessionCode}</div>
              </div>
              <div className="text-center">
                <div className="font-heading text-xs text-gray-500 uppercase tracking-wide">Tentatives</div>
                <div className="font-heading font-semibold" style={{ color: colors.ui.textPrimary }}>{attemptCount}</div>
              </div>
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
