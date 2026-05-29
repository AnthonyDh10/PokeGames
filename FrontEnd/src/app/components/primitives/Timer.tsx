import { colors } from '../../design/colors'

/** Props du composant `Timer`. */
interface TimerProps {
  /** Valeur du timer en secondes. */
  value: number
  /**
   * Mode d'affichage :
   * - `'countdown'` (défaut) : affiche le temps restant en secondes entières.
   *   Affiche ♥️ si la valeur est infinie ou supérieure à 10 000 (mode sans limite).
   * - `'stopwatch'` : affiche le temps écoulé au format `Xs` ou `Xm Ys`.
   */
  mode?: 'countdown' | 'stopwatch'
  /** Joue l'animation de secousse horizontale (utilisée lors d'une pénalité de temps). */
  shake?: boolean
  /** Joue l'animation de clignotement rouge (utilisée lors d'une pénalité de temps). */
  flash?: boolean
  /** Affiche la pénalité flottante au-dessus du timer. */
  showPenalty?: boolean
  /** Valeur en secondes de la pénalité à afficher (ex : `15` → affiche "-15s"). */
  penaltyValue?: number
}

/**
 * Convertit un nombre total de secondes en chaîne lisible pour le mode chronomètre.
 * Exemple : `75` → `"1m 15s"`, `45` → `"45s"`.
 */
function formatElapsed(totalSeconds: number): string {
  const total = Math.floor(totalSeconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

/**
 * Composant d'affichage du timer de jeu.
 *
 * Supporte deux modes : compte à rebours (`countdown`) et chronomètre (`stopwatch`).
 * La couleur change automatiquement en fonction du temps restant :
 * - vert (`>20s`), orange (`≤20s`), rouge (`≤10s`).
 *
 * Les animations shake et flash sont pilotées par le hook `useTimer`
 * et transmises depuis `PokeDescHeader`.
 */
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
        : `${Math.floor(value)}s`
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
