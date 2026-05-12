import { motion } from 'framer-motion'
import { colors } from '../design/colors'
import SubCard from './SubCard'

interface HPBarProps {
  name: string
  current: number
  max: number
  isWinner?: boolean
}

export default function HPBar({ name, current, max, isWinner }: HPBarProps) {
  const percentage = Math.min((current / max) * 100, 100)

  // Couleurs Pokémon GBA
  const getBarColors = () => {
    if (percentage > 50) return { light: '#22c55e', dark: colors.game.success } // Vert
    if (percentage > 20) return { light: colors.brand.yellowLight, dark: colors.brand.yellowWarm } // Jaune
    return { light: colors.brand.red, dark: colors.brand.redDark } // Rouge
  }

  const barColors = getBarColors()

  return (
    <div className="flex flex-col gap-1.5">
      {/* En-tête : Nom à gauche, Score à droite */}
      <div className="flex justify-between items-end px-1">
        {/* Label du joueur */}
        <div
          className="font-heading truncate uppercase tracking-widest transition-all duration-500"
          style={{
            fontSize: isWinner ? '1.2rem' : '1rem',
            fontWeight: isWinner ? 'bold' : 'normal',
            color: isWinner ? colors.brand.yellowWarm : colors.brand.blueDark,
          }}
        >
          {name}
        </div>

        {/* Score numérique */}
        <div className="font-heading text-lg text-right tabular-nums tracking-tighter">
          <span className="text-slate-800">{current}</span>
          <span className="text-slate-400 text-xs mx-1">/</span>
          <span className="text-slate-500">{max}</span>
          <span className="text-slate-500"> PTS</span>
        </div>
      </div>

      {/* Container avec SubCard pour la barre HP */}
      <SubCard
        borderColor="#0f172a"
        bodyColor="#1e293b"
        borderThickness="p-[2px]"
        className="flex flex-row items-center gap-2 px-1.5 py-1.5"
      >
        {/* Label HP */}
        <div className="text-[12px] font-display text-orange-400 pt-0.5">HP</div>

        {/* Jauge de vie */}
        <div className="flex-1 h-4 bg-slate-700 overflow-hidden relative border-l-2 border-slate-900">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            className="h-full"
            style={{
              background: `linear-gradient(to bottom, ${barColors.light} 65%, ${barColors.dark} 35%)`,
            }}
          />
        </div>
      </SubCard>
    </div>
  )
}
