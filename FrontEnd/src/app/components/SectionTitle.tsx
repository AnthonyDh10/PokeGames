import type { ReactNode } from 'react'
import { colors } from '../design/colors'

type SectionTitleProps = {
  children: ReactNode
  className?: string
}

export default function SectionTitle({ children, className = '' }: SectionTitleProps) {
  return (
    <h2 className={`font-body font-extrabold text-2xl text-gray-800 uppercase tracking-tight flex items-center gap-2 ${className}`.trim()}>
      <span className="w-2 h-6 rounded-full" style={{ backgroundColor: colors.brand.redDark }}></span>
      {children}
    </h2>
  )
}