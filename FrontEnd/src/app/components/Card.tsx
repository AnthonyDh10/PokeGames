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
  borderColor?: string
  showHeader?: boolean
  bodyColor?: string
  borderThickness?: string
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
  showHeader = true,
  bodyColor = 'white',
  borderThickness = 'p-1.5',
}: CardProps) {
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
    <div
      // Ajout de h-full pour s'assurer que la carte remplisse l'espace de la grille parent
      className={`flex flex-col h-full drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] gap-[1vh] md:gap-[1%] ${
        hoverable
          ? 'hover:drop-shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300'
          : ''
      }`}
      style={{
        ...style,
        ...(cardSize?.width ? { width: `${cardSize.width}px` } : {}),
        ...(cardSize?.height ? { height: `${cardSize.height}px` } : {}),
      }}
    >
      {/* HEADER */}
      {showHeader && headerColor && (
        <div className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.2)] hover:drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <div
            className={borderThickness}
            style={{
              backgroundColor: borderColor || 'transparent',
              clipPath: pixelClipPath,
            }}
          >
            <div
              className={`relative flex flex-col items-center justify-center px-8 overflow-hidden ${headerClassName}`}
              style={{
                backgroundColor: headerColor,
                clipPath: pixelClipPath,
              }}
            >
              {header}
            </div>
          </div>
        </div>
      )}

      {/* BODY */}
      <div
        // Ajout de flex et flex-col ici
        className="drop-shadow-[0_6px_16px_rgba(0,0,0,0.2)] hover:drop-shadow-[0_8px_20px_rgba(0,0,0,0.3)] flex-1 flex flex-col"
      >
        {/* Enveloppe bordure */}
        <div
          // Ajout de flex-1 flex flex-col pour propager la hauteur
          className={`${borderThickness} flex-1 flex flex-col`}
          style={{
            backgroundColor: borderColor || 'transparent',
            clipPath: pixelClipPath,
          }}
        >
          {/* Conteneur principal (Fond de la carte) */}
          <div
            // Ajout de flex-1 flex flex-col pour propager la hauteur jusqu'au contenu
            className={`${
              overflowVisible ? 'overflow-visible' : 'overflow-hidden'
            } ${className} flex-1 flex flex-col`}
            style={{
              backgroundColor: bodyColor,
              clipPath: pixelClipPath,
            }}
          >
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
      className="h-full" // Ajout de h-full pour que l'animation wrapper ne casse pas la hauteur en grille
    >
      {cardContent}
    </motion.div>
  )
}