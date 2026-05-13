import Card from './Card'
import { colors } from '../design/colors'

interface WinnerCardProps {
  winner?: string | null
  isSolo: boolean
  bothFinished: boolean
  cardColor?: string
  borderColor?: string
  mainColor?: string
}

export default function WinnerCard({
  winner,
  isSolo,
  bothFinished,
  cardColor = colors.brand.white,
  borderColor = colors.brand.blueDark,
  mainColor = colors.brand.blue,
}: WinnerCardProps) {
  let message = ''
  let messageColor = borderColor

  if (isSolo) {
    message = 'VICTOIRE !'
    messageColor = mainColor
  } else if (!bothFinished) {
    message = 'EN ATTENTE...'
    messageColor = 'orange'
  } else if (winner) {
    message = 'VAINQUEUR'
    messageColor = mainColor
  } else {
    message = 'MATCH NUL'
    messageColor = 'orange'
  }

  return (
    <Card
      borderColor={borderColor}
      bodyColor={cardColor}
      className="border-4 bg-slate-50 shadow-[8px_8px_0px_rgba(0,0,0,0.1)]"
      pokeballOpacity={0}
    >
      <div className="p-6 flex flex-col items-center justify-center gap-4">
        <h2
          className="font-heading text-lg uppercase tracking-widest font-bold"
          style={{ color: messageColor }}
        >
          {message}
        </h2>

        {winner && !isSolo && bothFinished && (
          <div
            className="font-display text-3xl font-black px-4 py-3 border-2"
            style={{
              color: mainColor,
              borderColor: mainColor,
              boxShadow: `4px 4px 0px ${mainColor}, inset 0 0 10px rgba(0,0,0,0.1)`,
              textShadow: `2px 2px 0px ${mainColor}80`,
              backgroundColor: colors.brand.white,
            }}
          >
            {winner}
          </div>
        )}
      </div>
    </Card>
  )
}
