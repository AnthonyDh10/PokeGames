import { ROMAN_GEN, HINT_PENALTIES } from './pokedescConstants'
import { normalizeString } from './normalize'
import type { PokemonDto, PokemonHintsDto, RevealedHints } from '../types/pokemon'

/**
 * Convertit un nom de génération en anglais (ex: `'generation-iii'`) en numéro entier.
 * @returns Le numéro de génération, ou `null` si le format est inconnu.
 */
export function generationToNumber(nameEn: string): number | null {
  const match = nameEn.toLowerCase().match(/generation-([ivx]+)/)
  return match ? (ROMAN_GEN[match[1]] ?? null) : null
}

/**
 * Formate une liste de générations en chaîne lisible.
 * Exemple : `[1, 2, 3]` → `'Générations 1-3'`.
 * @param isShort Utilise le préfixe court `'Gén'` au lieu de `'Générations'`.
 */
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

/**
 * Retourne un objet `{ label, value }` destiné à l'affichage des générations sélectionnées
 * dans les headers de jeu. Adapte le label au singulier/pluriel et compacte les tranches consécutives.
 * @returns `null` si la liste est vide ou absente.
 */
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

/**
 * Détermine si un indice doit être verrouillé (non cliquable) parce que sa pénalité en secondes
 * dépasse le temps restant.
 * @returns `false` si l'indice est déjà utilisé ou si le timer est infini (`-1`).
 */
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

/**
 * Filtre la liste de tous les Pokémon selon les indices déjà révélés (types, génération)
 * et les générations sélectionnées pour la partie.
 * Utilisé pour réduire les suggestions de l'autocomplétion.
 */
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

/**
 * Filtre et classe les Pokémon de l'autocomplétion selon le terme de recherche normalisé.
 * Retourne au maximum 10 résultats triés par numéro de Pokédex.
 * @returns Tableau vide si le terme de recherche est vide.
 */
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

/**
 * Calcule les indices révélés à afficher à partir des données du serveur et
 * de la liste des clés d'indices utilisés. Fonction pure, sans effet de bord.
 */
export function computeRevealedHints(hints: PokemonHintsDto, used: string[]): RevealedHints {
  const revealed: RevealedHints = {}
  if (used.includes('Sprite') && hints.sprites?.frontDefault) {
    revealed['Silhouette'] = hints.sprites.frontDefault
  }
  if (used.includes('Type1') && hints.types) {
    const t = hints.types.find((t) => t.slot === 1)
    if (t) revealed['Type 1'] = t.name
  }
  if (used.includes('Type2') && hints.types) {
    const t = hints.types.find((t) => t.slot === 2)
    revealed['Type 2'] = t ? t.name : 'Pas de second type'
  }
  if (used.includes('Generation') && hints.generation) {
    revealed['Génération'] = hints.generation.nameFr
  }
  if (used.includes('Category') && hints.category) {
    revealed['Catégorie'] = hints.category
  }
  if (used.includes('Stats') && hints.stats) {
    const s = hints.stats
    revealed['Statistiques'] =
      `PV: ${s.PV?.value ?? '?'}, Atk: ${s.Attaque?.value ?? '?'}, Déf: ${s['Défense']?.value ?? '?'}, ` +
      `SpA: ${s['Attaque Spé.']?.value ?? '?'}, SpD: ${s['Défense Spé.']?.value ?? '?'}, Spe: ${s.Vitesse?.value ?? '?'}`
  }
  if (used.includes('Height') && hints.physical) {
    revealed['Taille'] = `${hints.physical.heightM}m`
  }
  if (used.includes('Weight') && hints.physical) {
    revealed['Poids'] = `${hints.physical.weightKg}kg`
  }
  if (used.includes('Abilities') && hints.abilities?.length) {
    revealed['Talents'] = hints.abilities.map((a) => a.name).join(', ')
  }
  return revealed
}
