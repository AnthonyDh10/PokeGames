import Card from './Card'
import PixelButton, { pixelClipPathSm } from './PixelButton'
import { colors } from '../design/colors'
import { HINTS_CONFIG, HINT_PENALTIES, HINT_POINT_COSTS } from '../utils/pokedescConstants'
import type { RevealedHints } from '../hooks/useGameState'

interface HintsGridProps {
  usedHints: string[]
  revealedHints: RevealedHints
  hintAnimations: Record<string, number>
  timeRemaining: number
  timerDurationSeconds: number | undefined
  onRequestHint: (key: string) => void
  isHintLocked: (key: string) => boolean
}

export default function HintsGrid({
  usedHints,
  revealedHints,
  hintAnimations,
  timeRemaining,
  timerDurationSeconds,
  onRequestHint,
  isHintLocked,
}: HintsGridProps) {
  return (
    <Card showHeader={false} pokeballOpacity={0}>
      <div className="p-4 md:p-6">
        <h3
          className="font-heading text-center text-xl tracking-wide mb-4"
          style={{ color: colors.brand.blue, fontSize: '1.25rem' }}
        >
          INDICES DISPONIBLES
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {HINTS_CONFIG.map(({ key, icon, imgIcon, label }) => {
            const used = usedHints.includes(key)
            const locked = isHintLocked(key)
            const timePenalty = HINT_PENALTIES[key]
            const penaltySeconds =
              timerDurationSeconds && timerDurationSeconds > 0
                ? Math.round((timePenalty * timerDurationSeconds) / 100)
                : timePenalty
            const pointCost = HINT_POINT_COSTS[key] ?? 0
            const animation = hintAnimations[key]
            const revealedKey = label as keyof RevealedHints
            const revealedValue = revealedHints[revealedKey]

            const btnBorderColor = used ? colors.brand.blueDeep : locked ? '#9CA3AF' : colors.brand.blueDeep
            const btnColorLight = used ? colors.brand.blueLight : locked ? '#F1F2F4' : '#FFFFFF'
            const btnColorDark = used ? colors.brand.blueDark : locked ? '#BEC3CB' : '#E7E7E7'
            const btnColor = used ? colors.brand.blue : locked ? '#D7DADF' : '#F9FAFB'

            return (
              <PixelButton
                key={key}
                onClick={() => onRequestHint(key)}
                disabled={used || locked}
                title={
                  used
                    ? ''
                    : `Coûte ${penaltySeconds}s et ${pointCost} points${locked ? ` — Temps insuffisant (il reste ${timeRemaining.toFixed(1)}s)` : ''}`
                }
                className="font-heading w-full min-h-24"
                innerClassName="flex-1 flex flex-col items-center justify-center w-full h-full p-2 gap-1.5 relative"
                colorBorder={btnBorderColor}
                colorLight={btnColorLight}
                colorDark={btnColorDark}
                color={btnColor}
                clipPath={pixelClipPathSm}
              >
                {animation !== undefined && timerDurationSeconds !== -1 && (
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-red-500 font-bold text-lg pointer-events-none z-20 bg-white/95 px-2 py-0.5 rounded-md border-2 border-red-500 animate-[hintFloatUp_1.5s_ease-out_forwards]">
                    -{animation}s
                  </span>
                )}

                {used && revealedValue ? (
                  <>
                    {key === 'Sprite' ? (
                      <img
                        src={revealedValue}
                        alt="Silhouette"
                        className="max-w-full h-auto"
                        style={{ imageRendering: 'pixelated', filter: 'brightness(0)' }}
                      />
                    ) : (
                      <span
                        className={`font-heading font-semibold text-center leading-tight px-1 ${key === 'Stats' ? 'text-xs' : 'text-sm'}`}
                        style={{ color: colors.brand.white }}
                      >
                        {revealedValue}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {imgIcon ? (
                      <img src={imgIcon} alt={label} className="w-8 h-8 grayscale opacity-70 object-contain" />
                    ) : (
                      <span className="text-2xl grayscale opacity-70">{icon}</span>
                    )}
                    <span className="text-sm text-gray-700">{label}</span>
                    {locked && (
                      <span className="absolute top-1 right-1 bg-gray-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">
                        🔒
                      </span>
                    )}
                  </>
                )}
              </PixelButton>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
