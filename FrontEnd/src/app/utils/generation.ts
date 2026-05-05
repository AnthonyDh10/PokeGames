export const ROMAN_GEN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9,
}

export function generationToNumber(nameEn: string): number | null {
  const match = nameEn.toLowerCase().match(/generation-([ivx]+)/)
  return match ? (ROMAN_GEN[match[1]] ?? null) : null
}

export function formatGenerations(generations: number[], isShort = false): string {
  if (!generations || generations.length === 0) return ''

  const sorted = [...generations].sort((a, b) => a - b)
  const prefix = isShort ? 'Gén' : 'Générations'

  // Toutes les générations (1-8 ou 1-9)
  if (
    (sorted.length === 8 && sorted[0] === 1 && sorted[7] === 8) ||
    (sorted.length === 9 && sorted[0] === 1 && sorted[8] === 9)
  ) {
    return 'Toutes générations'
  }

  const isConsecutive = sorted.every((v, i) => i === 0 || v === sorted[i - 1] + 1)
  if (isConsecutive) return `${prefix} ${sorted[0]}-${sorted[sorted.length - 1]}`

  return `${prefix} ${sorted.join(',')}`
}
