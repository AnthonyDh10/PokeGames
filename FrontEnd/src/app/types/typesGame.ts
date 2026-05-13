export interface TypeSimpleDto {
  id: number
  nameFr: string
}

export interface TypesGameDto {
  interactions: Record<string, string[]> // "x4" | "x2" | "x1" | "x0.5" | "x0.25" | "x0" → noms FR
}

export interface TypesGuessResultDto {
  isCorrect: boolean
  message: string
  correctType1NameFr?: string
  correctType2NameFr?: string
}

export interface TypesPlayerResultDto {
  dresseurId?: string
  hasFinished: boolean
  elapsedSeconds?: number
  attemptCount?: number
}

export interface TypesGameResultsDto {
  interactions: Record<string, string[]>
  correctType1NameFr?: string
  correctType2NameFr?: string
  player1: TypesPlayerResultDto
  player2?: TypesPlayerResultDto
  bothFinished: boolean
}

export interface TypesRematchStatusDto {
  player1Ready: boolean
  player2Ready: boolean
  rematchPartieId?: string
}
