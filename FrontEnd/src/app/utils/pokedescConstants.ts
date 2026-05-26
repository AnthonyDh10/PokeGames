import indiceTypeIcon from '../components/images/indice_type.png'

export const ROMAN_GEN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9,
}

// Coûts des indices : pénalité de temps (% du timer total) et déduction de points.
// IMPORTANT: les valeurs pointCost doivent correspondre exactement à HintCosts dans PartieService.cs du backend.
export const HINTS_DATA: Record<string, { timePenaltyPct: number; pointCost: number }> = {
  Type1:      { timePenaltyPct: 20, pointCost: 20 },
  Type2:      { timePenaltyPct: 20, pointCost: 20 },
  Generation: { timePenaltyPct: 15, pointCost: 15 },
  Category:   { timePenaltyPct:  5, pointCost:  5 },
  Stats:      { timePenaltyPct:  5, pointCost:  5 },
  Height:     { timePenaltyPct:  5, pointCost:  5 },
  Weight:     { timePenaltyPct:  5, pointCost:  5 },
  Abilities:  { timePenaltyPct:  5, pointCost:  5 },
  Sprite:     { timePenaltyPct: 50, pointCost: 50 },
}

export type HintConfig = {
  key: string
  label: string
  imgIcon?: string
  icon?: string
}

export const HINTS_CONFIG: HintConfig[] = [
  { key: 'Type1', imgIcon: indiceTypeIcon, label: 'Type 1' },
  { key: 'Type2', imgIcon: indiceTypeIcon, label: 'Type 2' },
  { key: 'Generation', icon: '📅', label: 'Génération' },
  { key: 'Category', icon: '🏷️', label: 'Catégorie' },
  { key: 'Stats', icon: '📊', label: 'Statistiques' },
  { key: 'Height', icon: '📏', label: 'Taille' },
  { key: 'Weight', icon: '⚖️', label: 'Poids' },
  { key: 'Abilities', icon: '⚡', label: 'Talents' },
  { key: 'Sprite', icon: '👤', label: 'Silhouette' },
]
