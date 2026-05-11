import type { ReactNode } from 'react'
import Card from './Card'
import { colors } from '../design/colors'

interface GameResultsLayoutProps {
  title: string
  sessionCode?: string
  topAlert?: ReactNode
  scores: ReactNode
  details: ReactNode
  actions: ReactNode
  pokeballColor?: string
}

export default function GameResultsLayout({
  title,
  sessionCode,
  topAlert,
  scores,
  details,
  actions,
  pokeballColor,
}: GameResultsLayoutProps) {
  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

      {/* Header */}
      <Card headerClassName="py-4" 
      pokeballColor={pokeballColor} 
      pokeballSize={200}>
        <div className="p-6 text-center">
          <h1
            className="font-display text-2xl md:text-3xl tracking-wide"
            style={{ color: colors.ui.textPrimary }}
          >
            <strong>{title}</strong>
          </h1>
          {sessionCode && (
            <p className="text-gray-500 font-heading text-sm">Session : {sessionCode}</p>
          )}
          {topAlert}
        </div>
      </Card>

      {scores}

      {details}

      <div className="justify-center flex-wrap">
        {actions}
      </div>

    </div>
  )
}
