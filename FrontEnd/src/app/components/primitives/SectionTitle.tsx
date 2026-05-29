import type { ReactNode } from 'react'
import { colors } from '../../design/colors'

/** Props du composant `SectionTitle`. */
type SectionTitleProps = {
  /** Contenu textuel du titre. */
  children: ReactNode
  /** Classes Tailwind supplémentaires appliquées au `<h2>`. */
  className?: string
}

/**
 * Titre de section avec un indicateur coloré (bande rouge à gauche).
 * Utilisé pour structurer visuellement les blocs de la page.
 */
export default function SectionTitle({ children, className = '' }: SectionTitleProps) {
  return (
    <h2 className={`font-heading font-bold text-2xl text-gray-800 uppercase tracking-wide flex items-center gap-2 ${className}`.trim()}>
      <span className="w-2 h-6 rounded-full" style={{ backgroundColor: colors.brand.redDark }}></span>
      {children}
    </h2>
  )
}