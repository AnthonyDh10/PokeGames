import Card from './Card'
import { colors } from '../design/colors'

interface DescriptionCardProps {
  descriptions: string[]
  descriptionIndex: number
  onChangeIndex: (setter: (i: number) => number) => void
  onZoom: () => void
}

export default function DescriptionCard({
  descriptions,
  descriptionIndex,
  onChangeIndex,
  onZoom,
}: DescriptionCardProps) {
  return (
    <Card pokeballColor={colors.brand.blueLight} pokeballOpacity={0.1} showHeader={false}>
      <div className="p-4 md:p-6 flex flex-col pb-6 min-h-[160px] md:min-h-[220px]">
        <h3
          className="font-heading text-center text-xl tracking-wide"
          style={{ color: colors.brand.blue, fontSize: '1.25rem' }}
        >
          DESCRIPTION
        </h3>

        <div className="flex-1">
          <div className="font-heading text-left p-4 md:p-8 text-base leading-relaxed h-full">
            {descriptions[descriptionIndex] || (
              <span className="text-gray-400 italic">Chargement de la description...</span>
            )}
          </div>
        </div>

        {/* Contrôles : Pagination + Zoom */}
        <div className="flex items-center justify-between mt-auto pt-2 w-full">
          <div className="w-9" />

          <div className="flex items-center justify-center gap-4">
            {descriptions.length > 1 && (
              <>
                <button
                  onClick={() => onChangeIndex((i) => (i - 1 + descriptions.length) % descriptions.length)}
                  className="font-heading w-9 h-9 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-px-sm transition"
                  style={{ color: colors.brand.blue, fontSize: '1.5rem' }}
                >
                  ◀
                </button>
                <span className="font-heading text-sm text-gray-500 tabular-nums">
                  {descriptionIndex + 1} / {descriptions.length}
                </span>
                <button
                  onClick={() => onChangeIndex((i) => (i + 1) % descriptions.length)}
                  className="font-heading w-9 h-9 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-px-sm transition"
                  style={{ color: colors.brand.blue, fontSize: '1.5rem' }}
                >
                  ▶
                </button>
              </>
            )}
          </div>

          <button
            onClick={onZoom}
            className="font-heading w-9 h-9 flex items-center justify-center hover:-translate-y-0.5 hover:shadow-px-sm transition cursor-pointer"
            style={{ color: colors.brand.blue, fontSize: '1.25rem' }}
            title="Agrandir la description"
          >
            🔍
          </button>
        </div>
      </div>
    </Card>
  )
}
