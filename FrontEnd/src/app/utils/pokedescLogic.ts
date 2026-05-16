import { ROMAN_GEN, HINT_PENALTIES } from './pokedescConstants'
import { normalizeString } from '../components/PokemonSearchInput'
import type { PokemonDto } from '../types/pokemon'
import type { RevealedHints } from '../hooks/useGameState'

export function generationToNumber(nameEn: string): number | null {
  const match = nameEn.toLowerCase().match(/generation-([ivx]+)/)
  return match ? (ROMAN_GEN[match[1]] ?? null) : null
}

export function formatGenerations(generations: number[], isShort: boolean = false): string {
  if (!generations || generations.length === 0) return ''

  const sorted = [...generations].sort((a, b) => a - b)
  const prefix = isShort ? 'Gén' : 'Générations'

  if (sorted.length === 8 && sorted[0] === 1 && sorted[7] === 8) {
    return 'Toutes générations'
  }

  if (sorted.length === 1) {
    return `${prefix} ${sorted[0]}`
  }

  let isConsecutive = true
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      isConsecutive = false
      break
    }
  }

  if (isConsecutive) {
    return `${prefix} ${sorted[0]}-${sorted[sorted.length - 1]}`
  }

  return `${prefix} ${sorted.join(',')}`
}

export function getGenerationsDisplay(generations: number[] | undefined): { label: string; value: string } | null {
  if (!generations || generations.length === 0) return null

  const sorted = [...generations].sort((a, b) => a - b)

  // Si toutes les générations (1-8)
  if (sorted.length === 8 && sorted[0] === 1 && sorted[7] === 8) {
    return {
      label: 'Générations sélectionnées :',
      value: '1 à 8'
    }
  }

  // Si une seule génération, afficher juste le numéro (ex: "3" au lieu de "3 à 3")
  if (sorted.length === 1) {
    return {
      label: 'Génération sélectionnée :',
      value: String(sorted[0])
    }
  }

  // Vérifier si consécutives depuis le début
  let isConsecutiveFromStart = true
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) {
      isConsecutiveFromStart = false
      break
    }
  }
  if (sorted[0] !== 1) {
    isConsecutiveFromStart = false
  }

  if (isConsecutiveFromStart) {
    return {
      label: 'Générations sélectionnées :',
      value: `1 à ${sorted[sorted.length - 1]}`
    }
  }

  // Sinon afficher juste les numéros séparés par des virgules
  return {
    label: 'Générations sélectionnées :',
    value: sorted.join(',')
  }
}

export function isHintLocked(
  hintKey: string,
  usedHints: string[],
  timeRemaining: number,
  timerDurationSeconds: number,
): boolean {
  if (usedHints.includes(hintKey)) return false
  if (timerDurationSeconds === -1) return false
  const penaltyPct = HINT_PENALTIES[hintKey] ?? 0
  const penaltySeconds = (penaltyPct * timerDurationSeconds) / 100
  return penaltySeconds > timeRemaining
}

export function filterHintPokemons(
  allPokemons: PokemonDto[],
  revealedHints: RevealedHints,
  selectedGenerations: number[],
): PokemonDto[] {
  return allPokemons.filter((p) => {
    if (selectedGenerations?.length) {
      const genNumber = p.generation?.nameEn ? generationToNumber(p.generation.nameEn) : null
      if (genNumber === null || !selectedGenerations.includes(genNumber)) return false
    }
    if (revealedHints['Type 1']) {
      const type1 = p.types?.find((t) => t.slot === 1)
      if (!type1 || type1.name !== revealedHints['Type 1']) return false
    }
    if (revealedHints['Type 2']) {
      const val = revealedHints['Type 2']
      if (val === 'Pas de second type') {
        if (p.types?.some((t) => t.slot === 2)) return false
      } else {
        const type2 = p.types?.find((t) => t.slot === 2)
        if (!type2 || type2.name !== val) return false
      }
    }
    if (revealedHints['Génération']) {
      if (p.generation?.nameFr !== revealedHints['Génération']) return false
    }
    return true
  })
}

export function filterSearchPokemons(
  hintFiltered: PokemonDto[],
  searchTerm: string,
): PokemonDto[] {
  const clean = searchTerm.trim()
  if (!clean) return []
  const normalized = normalizeString(clean)
  return hintFiltered
    .filter((p) => {
      const normalizedName = normalizeString(p.nameFr)
      return normalizedName.includes(normalized) || p.pokedexNumber.toString().includes(clean)
    })
    .sort((a, b) => a.pokedexNumber - b.pokedexNumber)
    .slice(0, 10)
}
