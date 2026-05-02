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
  style?: React.CSSProperties
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
  overflowVisible = false, // 1. On récupère la prop avec false par défaut
  style,
}: CardProps) {
  return (
    <div
      className={`bg-white rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] border border-gray-100 flex flex-col ${
        overflowVisible ? 'overflow-visible' : 'overflow-hidden' // 2. Remplacement ici
      } ${
        hoverable
          ? 'hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:-translate-y-1 transition-all duration-300'
          : ''
      } ${className}`}
      style={style}
    >
      {headerColor && (
        <div
          // 3. Ajout de `rounded-t-3xl` pour arrondir le header lui-même
          className={`relative flex flex-col items-center justify-center px-8 rounded-t-3xl overflow-hidden ${headerClassName}`}
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
  )
}