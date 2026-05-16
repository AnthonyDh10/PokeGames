import Pokeball from './images/pokéball_face.png'

interface AttemptsDisplayProps {
  used: number
  max?: number
  accentColor?: string
}

export default function AttemptsDisplay({ used, max = 3, accentColor }: AttemptsDisplayProps) {
  return (
    <div className="flex flex-col items-center gap-1 whitespace-nowrap">
      <span className="font-heading font-semibold text-sm text-center" style={{ color: accentColor }}>
        Tentatives
      </span>
      <div className="flex gap-2">
        {[...Array(max)].map((_, i) => (
          <img
            key={i}
            src={Pokeball}
            alt={`Tentative ${i + 1}`}
            className={`w-10 h-8 ${i >= max - used ? 'grayscale opacity-40' : ''}`}
            style={{ imageRendering: 'pixelated' }}
          />
        ))}
      </div>
    </div>
  )
}
