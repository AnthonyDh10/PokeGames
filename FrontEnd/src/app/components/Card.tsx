import { motion } from 'framer-motion'
import { PokeballDecor } from './Pokeball'

interface CardProps {
  children: React.ReactNode
  className?: string
  hoverable?: boolean
  headerColor?: string
  header?: React.ReactNode
  headerClassName?: string
  pokeballColor?: string
  pokeballOpacity?: number
  pokeballSize?: number
  overflowVisible?: boolean
  animation?: boolean
  cardSize?: { width?: number; height?: number }
  style?: React.CSSProperties
  /** Optionnel : Couleur de la bordure pixélisée (ex: 'black' ou '#f3f4f6') */
  borderColor?: string
}

const cardAnimationVariants = {
  initial: { y: -40, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.3, ease: "easeOut" as const } },
}

export default function Card({
  children,
  className = '',
  hoverable = false,
  headerColor,
  header,
  headerClassName = 'py-8',
  pokeballColor = 'black',
  pokeballOpacity = 0.15,
  pokeballSize = 200,
  overflowVisible = false,
  animation = true,
  cardSize,
  style,
  borderColor,
}: CardProps) {
  const cardStyle = cardSize ? { 
    ...style, 
    width: cardSize.width ? `${cardSize.width}px` : undefined,
    height: cardSize.height ? `${cardSize.height}px` : undefined,
  } : style

  // Découpe générant 5 marches symétriques pour l'effet pixel
  const pixelClipPath = `polygon(
    28px 0px, calc(100% - 28px) 0px, 
    calc(100% - 28px) 4px, calc(100% - 20px) 4px, calc(100% - 20px) 8px, calc(100% - 12px) 8px, calc(100% - 12px) 12px, calc(100% - 8px) 12px, calc(100% - 8px) 20px, calc(100% - 4px) 20px, calc(100% - 4px) 28px, 100% 28px, 
    100% calc(100% - 28px), 
    calc(100% - 4px) calc(100% - 28px), calc(100% - 4px) calc(100% - 20px), calc(100% - 8px) calc(100% - 20px), calc(100% - 8px) calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) calc(100% - 8px), calc(100% - 20px) calc(100% - 8px), calc(100% - 20px) calc(100% - 4px), calc(100% - 28px) calc(100% - 4px), calc(100% - 28px) 100%, 
    28px 100%, 
    28px calc(100% - 4px), 20px calc(100% - 4px), 20px calc(100% - 8px), 12px calc(100% - 8px), 12px calc(100% - 12px), 8px calc(100% - 12px), 8px calc(100% - 20px), 4px calc(100% - 20px), 4px calc(100% - 28px), 0px calc(100% - 28px), 
    0px 28px, 
    4px 28px, 4px 20px, 8px 20px, 8px 12px, 12px 12px, 12px 8px, 20px 8px, 20px 4px, 28px 4px
  )`;

  const cardContent = (
    // Conteneur externe : Gère l'ombre portée (drop-shadow) et la taille globale
    <div
      className={`flex flex-col drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] ${
        hoverable
          ? 'hover:drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300'
          : ''
      }`}
      style={cardStyle}
    >
      {/* Conteneur intermédiaire : Gère la bordure si 'borderColor' est défini */}
      <div
        className={`flex flex-col flex-1 ${borderColor ? 'p-1' : ''}`}
        style={{
          backgroundColor: borderColor || 'transparent',
          clipPath: pixelClipPath,
        }}
      >
        {/* Conteneur principal : Contenu de la carte avec fond blanc */}
        <div
          className={`bg-white flex flex-col flex-1 ${
            overflowVisible ? 'overflow-visible' : 'overflow-hidden'
          } ${className}`}
          style={{ clipPath: pixelClipPath }}
        >
          {headerColor && (
            <div
              className={`relative flex flex-col items-center justify-center px-8 overflow-hidden ${headerClassName}`}
              style={{ backgroundColor: headerColor }}
            >
              {header}
            </div>
          )}
          
          <div className="relative isolate flex-1 flex flex-col">
            <PokeballDecor
              size={pokeballSize}
              opacity={pokeballOpacity}
              color={pokeballColor}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
            />
            <div className="relative z-10 flex flex-col flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (!animation) {
    return cardContent
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={cardAnimationVariants}
    >
      {cardContent}
    </motion.div>
  )
}