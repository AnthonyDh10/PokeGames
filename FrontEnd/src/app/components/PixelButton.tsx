import type { CSSProperties, ReactNode } from 'react'

// Clip path avec coins pixélisés 9px (3 marches de 3px) — utilisé dans la Sidebar
export const pixelClipPathLg = `polygon(
  9px 0px, calc(100% - 9px) 0px, 
  calc(100% - 9px) 3px, calc(100% - 6px) 3px, calc(100% - 6px) 6px, calc(100% - 3px) 6px, calc(100% - 3px) 9px, 100% 9px, 
  100% calc(100% - 9px), 
  calc(100% - 3px) calc(100% - 9px), calc(100% - 3px) calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) calc(100% - 3px), calc(100% - 9px) calc(100% - 3px), calc(100% - 9px) 100%, 
  9px 100%, 
  9px calc(100% - 3px), 6px calc(100% - 3px), 6px calc(100% - 6px), 3px calc(100% - 6px), 3px calc(100% - 9px), 0px calc(100% - 9px), 
  0px 9px, 
  3px 9px, 3px 6px, 6px 6px, 6px 3px, 9px 3px
)`

// Clip path avec coins pixélisés 3px — utilisé pour les boutons d'indices
export const pixelClipPathSm = 'polygon(0 3px, 3px 3px, 3px 0, calc(100% - 3px) 0, calc(100% - 3px) 3px, 100% 3px, 100% calc(100% - 3px), calc(100% - 3px) calc(100% - 3px), calc(100% - 3px) 100%, 3px 100%, 3px calc(100% - 3px), 0 calc(100% - 3px))'

interface PixelButtonProps {
  onClick?: () => void
  disabled?: boolean
  title?: string
  /** Classes supplémentaires appliquées au bouton racine (ex: taille, font) */
  className?: string
  /** Classes appliquées au div interne (fond de contenu) */
  innerClassName?: string
  /** Styles supplémentaires appliqués au bouton racine (ex: width, height) */
  style?: CSSProperties
  colorBorder: string
  colorLight: string
  colorDark: string
  color: string
  /** Clip path à utiliser — pixelClipPathLg (défaut) ou pixelClipPathSm */
  clipPath?: string
  children: ReactNode
}

export default function PixelButton({
  onClick,
  disabled = false,
  title,
  className = '',
  innerClassName = 'flex items-center justify-center w-full h-full',
  style,
  colorBorder,
  colorLight,
  colorDark,
  color,
  clipPath = pixelClipPathLg,
  children,
}: PixelButtonProps) {
  const interactiveClasses = !disabled
    ? 'cursor-pointer drop-shadow-[4px_4px_0px_rgba(0,0,0,0.8)] hover:drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] active:drop-shadow-none active:translate-x-[4px] active:translate-y-[4px]'
    : 'cursor-not-allowed opacity-90 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.3)] translate-x-[2px] translate-y-[2px]'

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`relative block transition-none p-[3px] shrink-0 group ${interactiveClasses} ${className}`}
      style={{ ...style, backgroundColor: colorBorder, clipPath }}
    >
      {/* Bordure Lumière (Haut & Gauche) */}
      <div
        className="flex flex-col w-full h-full pt-[3px] pl-[3px]"
        style={{ backgroundColor: colorLight, clipPath }}
      >
        {/* Bordure Ombre (Bas & Droite) */}
        <div
          className="flex flex-col w-full h-full pr-[3px] pb-[3px]"
          style={{ backgroundColor: colorDark, clipPath }}
        >
          {/* Fond Interne */}
          <div
            className={`flex-1 ${innerClassName}`}
            style={{ backgroundColor: color, clipPath }}
          >
            {children}
          </div>
        </div>
      </div>
    </button>
  )
}
