import Pokeball from '../images/pokéball_face.png'

/** Props du composant `AttemptsDisplay`. */
interface AttemptsDisplayProps {
  /** Nombre de tentatives déjà utilisées (pokéballs grisées). */
  used: number
  /** Nombre total de tentatives autorisées (défaut : 3). */
  max?: number
  /** Couleur du label "Tentatives" (CSS color). */
  accentColor?: string
}

/**
 * Affiche une rangée de pokéballs indiquant les tentatives restantes.
 * Les pokéballs correspondant aux tentatives utilisées sont grisées.
 */
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
