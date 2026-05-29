import Card from '../primitives/Card'
import { colors } from '../../design/colors'

/** Props du composant `ZoomDescriptionModal`. */
interface ZoomDescriptionModalProps {
  /** Affiche la modale si `true`. */
  show: boolean
  /** Liste des descriptions disponibles. */
  descriptions: string[]
  /** Index de la description actuellement affichée. */
  descriptionIndex: number
  /** Setter pour changer l'index de description. */
  onChangeIndex: (setter: (i: number) => number) => void
  /** Callback pour fermer la modale. */
  onClose: () => void
}

/**
 * Modale plein écran affichant la description du Pokémon en grand format.
 * Inclut une pagination et se ferme en cliquant hors du contenu.
 */
export default function ZoomDescriptionModal({
  show,
  descriptions,
  descriptionIndex,
  onChangeIndex,
  onClose,
}: ZoomDescriptionModalProps) {
  if (!show) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <Card
          showHeader={false}
          pokeballColor={colors.brand.blueLight}
          pokeballOpacity={0.1}
        >
          <div className="relative p-8 md:p-14 min-h-[300px] flex flex-col">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center text-4xl text-gray-400 hover:text-red-500 transition-colors leading-none cursor-pointer hover:scale-110 z-10"
              title="Fermer"
            >
              ×
            </button>

            <div className="flex-1 flex items-center justify-center py-8">
              <p className="font-display text-center" style={{ color: colors.ui.textPrimary, fontSize: 'clamp(0.875rem, 4vw, 1.5rem)' }}>
                {descriptions[descriptionIndex] || <span className="text-gray-400 italic">Chargement...</span>}
              </p>
            </div>

            {descriptions.length > 1 && (
              <div className="flex items-center justify-center gap-4 md:gap-6 mt-auto flex-wrap">
                <button
                  onClick={() => onChangeIndex((i) => (i - 1 + descriptions.length) % descriptions.length)}
                  className="font-heading w-10 md:w-12 h-10 md:h-12 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-px-sm transition cursor-pointer"
                  style={{ color: colors.brand.blue, fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}
                >
                  ◀
                </button>
                <span className="font-heading text-gray-500 tabular-nums whitespace-nowrap" style={{ fontSize: 'clamp(0.875rem, 4vw, 1.75rem)' }}>
                  {descriptionIndex + 1} / {descriptions.length}
                </span>
                <button
                  onClick={() => onChangeIndex((i) => (i + 1) % descriptions.length)}
                  className="font-heading w-10 md:w-12 h-10 md:h-12 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-px-sm transition cursor-pointer"
                  style={{ color: colors.brand.blue, fontSize: 'clamp(1rem, 5vw, 1.75rem)' }}
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
