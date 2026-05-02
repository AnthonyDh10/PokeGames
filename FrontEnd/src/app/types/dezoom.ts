export interface DeZoomGameDto {
  spriteUrl: string
  attemptCount: number
}

export interface DeZoomGuessResultDto {
  isCorrect: boolean
  message: string
  correctPokemonNameFr?: string
}

export interface DeZoomPlayerResultDto {
  dresseurId?: string
  hasFinished: boolean
  elapsedSeconds?: number
  attemptCount?: number
}

export interface DeZoomGameResultsDto {
  spriteUrl: string
  correctPokemonNameFr: string
  player1: DeZoomPlayerResultDto
  player2?: DeZoomPlayerResultDto
  bothFinished: boolean
}

export interface DeZoomRematchStatusDto {
  player1Ready: boolean
  player2Ready: boolean
  rematchPartieId?: string
}
