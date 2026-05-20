import Card from '../Card'
import { colors } from '../../design/colors'

interface ZoomDescriptionModalProps {
  show: boolean
  descriptions: string[]
  descriptionIndex: number
  onChangeIndex: (setter: (i: number) => number) => void
  onClose: () => void
}

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
              <p className="font-display text-center" style={{ color: colors.ui.textPrimary, fontSize: '1.5rem' }}>
                {descriptions[descriptionIndex] || <span className="text-gray-400 italic">Chargement...</span>}
              </p>
            </div>

            {descriptions.length > 1 && (
              <div className="flex items-center justify-center gap-6 mt-auto">
                <button
                  onClick={() => onChangeIndex((i) => (i - 1 + descriptions.length) % descriptions.length)}
                  className="font-heading w-12 h-12 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-px-sm transition cursor-pointer"
                  style={{ color: colors.brand.blue, fontSize: '1.75rem' }}
                >
                  ◀
                </button>
                <span className="font-heading text-gray-500 tabular-nums" style={{ fontSize: '1.75rem' }}>
                  {descriptionIndex + 1} / {descriptions.length}
                </span>
                <button
                  onClick={() => onChangeIndex((i) => (i + 1) % descriptions.length)}
                  className="font-heading w-12 h-12 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-px-sm transition cursor-pointer"
                  style={{ color: colors.brand.blue, fontSize: '1.75rem' }}
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
