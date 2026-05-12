import indiceTypeIcon from '../components/images/indice_type.png'

export const ROMAN_GEN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9,
}

export const HINT_PENALTIES: Record<string, number> = {
  Type1: 10,
  Type2: 10,
  Generation: 10,
  Category: 3,
  Stats: 7,
  Height: 2,
  Weight: 2,
  Abilities: 8,
  Sprite: 30,
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
