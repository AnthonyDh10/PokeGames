import React from 'react'
import { colors } from '../../design/colors'

/**
 * Props du composant `SubCard`.
 * Étend `HTMLAttributes<HTMLDivElement>` pour accepter `onClick`, `ref`, etc.
 */
interface SubCardProps extends React.HTMLAttributes<HTMLDivElement>{
  children: React.ReactNode
  /** Classes supplémentaires appliquées au conteneur interne. */
  className?: string
  /** Couleur de fond du corps de la carte (défaut : blanc). */
  bodyColor?: string
  /** Couleur de la bordure pixélisée (défaut : noir). */
  borderColor?: string
  /** Épaisseur de la bordure via padding (ex: `'p-[2px]'`). */
  borderThickness?: string
  style?: React.CSSProperties
}

/**
 * Variante légère de `Card` avec un clip-path simplifié (une marche par coin).
 * Utilisée pour les éléments imbriqués : champs de saisie, badges, barres HP.
 */
export default function SubCard ({
  children,
  className = '',
  bodyColor =  colors.brand.white, 
  borderColor = '#000000',   
  borderThickness = 'p-[2px]', 
  style,
  ...rest
}: SubCardProps) {
  // Clip-path ultra simplifié : une seule marche par coin
  const pixelClipPath = `polygon(
    4px 0px, calc(100% - 4px) 0px, 
    calc(100% - 4px) 4px, 100% 4px, 
    100% calc(100% - 4px), 
    calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%, 
    4px 100%, 
    4px calc(100% - 4px), 0px calc(100% - 4px), 
    0px 4px, 
    4px 4px
  )`

  return (
    //* Conteneur extérieur formant la bordure */
    <div
      className={`${borderThickness} flex flex-col h-full`}
      {...rest}
      style={{
        backgroundColor: borderColor,
        clipPath: pixelClipPath,
        ...style,
      }}
    >
      {/* Conteneur intérieur formant le corps avec le background */}
      <div
        className={`flex-1 flex flex-col relative w-full h-full ${className}`}
        style={{
          backgroundColor: bodyColor,
          clipPath: pixelClipPath,
        }}
      >
        {children}
      </div>
    </div>
  )
}