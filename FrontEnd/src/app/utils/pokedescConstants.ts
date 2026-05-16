import indiceTypeIcon from '../components/images/indice_type.png'

export const ROMAN_GEN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9,
}

// Pénalités de temps en pourcentage (%) de la durée totale du timer de la partie
export const HINT_PENALTIES: Record<string, number> = {
  Type1: 20,
  Type2: 20,
  Generation: 15,
  Category: 5,
  Stats: 5,
  Height: 5,
  Weight: 5,
  Abilities: 5,
  Sprite: 50,
}

// Coûts des indices en points (déduits du score du joueur)
// IMPORTANT: doit correspondre exactement à HintCosts dans PartieService.cs du backend
export const HINT_POINT_COSTS: Record<string, number> = {
  Type1: 20,
  Type2: 20,
  Generation: 15,
  Category: 5,
  Stats: 5,
  Height: 5,
  Weight: 5,
  Abilities: 5,
  Sprite: 50,
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
