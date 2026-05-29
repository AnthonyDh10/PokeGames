import type { ReactNode } from 'react'
import { colors } from '../../design/colors'

interface GameLayoutProps {
  /** Slot pleine largeur au-dessus des colonnes (header avec titre, score, timer…) */
  header?: ReactNode
  /** Contenu de la colonne gauche */
  left: ReactNode
  /** Contenu de la colonne droite */
  right: ReactNode
  /**
   * Ratio des colonnes desktop :
   * - `'1+1'` → 50 / 50  (grille md:grid-cols-2)
   * - `'1+2'` → 33 / 67  (grille md:grid-cols-3, droite prend 2 colonnes)
   * @default '1+1'
   */
  columns?: '1+1' | '1+2'
  /** Classes CSS supplémentaires appliquées à la div de la colonne gauche */
  leftClassName?: string
  /** Classes CSS supplémentaires appliquées à la div de la colonne droite */
  rightClassName?: string
  /** Affiche un spinner de chargement à la place du layout */
  isLoading?: boolean
  /** Affiche un écran d'erreur à la place du layout */
  error?: string
  /** Callback du bouton « Retour » dans l'écran d'erreur */
  onErrorBack?: () => void
  /** Libellé du bouton de retour */
  errorBackLabel?: string
  /** Couleur du bouton de retour (CSS color) */
  errorBackColor?: string
  /** Modales et portails rendus après le layout principal */
  modals?: ReactNode
}

export default function GameLayout({
  header,
  left,
  right,
  columns = '1+1',
  leftClassName = '',
  rightClassName = '',
  isLoading = false,
  error,
  onErrorBack,
  errorBackLabel = 'Retour',
  errorBackColor = colors.brand.blue,
  modals,
}: GameLayoutProps) {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white border border-gray-200 shadow-px-sm p-12 text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white border-2 border-red-500 shadow-px-sm p-12 text-center">
          <span className="text-5xl grayscale opacity-70 block mb-4">❌</span>
          <p className="text-red-600 font-medium mb-4">Erreur : {error}</p>
          {onErrorBack && (
            <button
              onClick={onErrorBack}
              className="font-heading font-semibold px-6 py-2.5 text-white rounded hover:-translate-y-0.5 transition"
              style={{ backgroundColor: errorBackColor }}
            >
              {errorBackLabel}
            </button>
          )}
        </div>
      </div>
    )
  }

  const isWide = columns === '1+2'
  const gridClass = isWide
    ? 'grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6'
    : 'grid grid-cols-1 md:grid-cols-2 gap-4'
  const rightColClass = isWide ? `md:col-span-2 ${rightClassName}`.trim() : rightClassName

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 text-gray-900">
      {header && <div className="mb-4">{header}</div>}
      <div className={gridClass}>
        <div className={leftClassName || undefined}>{left}</div>
        <div className={rightColClass || undefined}>{right}</div>
      </div>
      {modals}
    </div>
  )
}
