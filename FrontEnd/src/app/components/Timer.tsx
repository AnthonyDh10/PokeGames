import { colors } from '../design/colors'

interface TimerProps {
  value: number
  mode?: 'countdown' | 'stopwatch'
  shake?: boolean
  flash?: boolean
  showPenalty?: boolean
  penaltyValue?: number
}

function formatElapsed(totalSeconds: number): string {
  const total = Math.floor(totalSeconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function Timer({
  value,
  mode = 'countdown',
  shake = false,
  flash = false,
  showPenalty = false,
  penaltyValue,
}: TimerProps) {
  const color =
    mode === 'countdown'
      ? value <= 10
        ? colors.game.timerDanger
        : value <= 20
          ? colors.game.timerWarn
          : colors.game.timerOk
      : '#6B7280'

  const display =
    mode === 'countdown'
      ? (!isFinite(value) || value > 10000)
        ? '♾️'
        : `${value.toFixed(1)}s`
      : formatElapsed(value)

  return (
    <>
      <span
        className={`font-heading font-semibold relative flex flex-col items-center ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''} ${flash ? 'animate-[flashRed_0.3s_ease-in-out]' : ''}`}
        style={{ color }}
      >
        <span className="block text-sm text-gray-500 text-center">Temps :</span>
        <span className="block text-lg mt-1">{display}</span>
        {showPenalty && penaltyValue !== undefined && (
          <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-red-500 font-bold text-lg pointer-events-none animate-[timerFloatUp_1.5s_ease-out_forwards]">
            -{penaltyValue}s
          </span>
        )}
      </span>
      <style>{`
        @keyframes timerFloatUp {
          0%   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          50%  { opacity: 1; transform: translateX(-50%) translateY(-10px) scale(1.2); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-30px) scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
          20%, 40%, 60%, 80%      { transform: translateX(3px); }
        }
        @keyframes flashRed {
          0%, 100% { background-color: transparent; }
          50% { background-color: rgba(229,57,53,0.3); border-radius: 8px; padding: 4px 8px; }
        }
      `}</style>
    </>
  )
}
