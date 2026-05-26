export interface PokemonDto {
  id: string
  nameFr: string
  pokedexNumber: number
  types?: TypeDto[]
  generation?: { nameFr: string; nameEn: string }
}

export interface CensoredDescriptionDto {
  descriptions: string[]
}

export interface GenerationDto {
  nameFr: string
  nameEn: string
}

export interface TypeDto {
  name: string
  nameEn: string
  slot: number
}

export interface StatDto {
  value: number
  nameEn: string
}

export interface StatsDto {
  PV: StatDto
  Attaque: StatDto
  'Défense': StatDto
  'Attaque Spé.': StatDto
  'Défense Spé.': StatDto
  Vitesse: StatDto
}

export interface PhysicalDto {
  heightM: number
  weightKg: number
}

export interface AbilityDto {
  name: string
  nameEn: string
  isHidden: boolean
  slot: number
}

export interface SpritesDto {
  frontDefault: string
  frontShiny?: string
  backDefault?: string
  backShiny?: string
}

export interface PokemonHintsDto {
  category?: string
  generation?: GenerationDto
  types?: TypeDto[]
  stats?: StatsDto
  physical?: PhysicalDto
  abilities?: AbilityDto[]
  sprites?: SpritesDto
}

/** Indices d'un Pokémon tels qu'affichés dans la grille de jeu PokéDesc. */
export interface RevealedHints {
  'Type 1'?: string
  'Type 2'?: string
  'Génération'?: string
  'Catégorie'?: string
  'Statistiques'?: string
  'Taille'?: string
  'Poids'?: string
  'Talents'?: string
  'Silhouette'?: string
}
