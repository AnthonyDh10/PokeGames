export interface PokemonSimpleDto {
  id: string
}

export interface CompletedPokemonDto {
  pokemonId: string
  pokemonName: string
  wasGuessed: boolean
  attemptsUsed: number
  hintsUsed: string[]
  pointsEarned: number
}

export interface PartieDto {
  id: string
  codeSession?: string
  statut?: string
  dresseur1Id?: string
  dresseur2Id?: string
  modeSolo: boolean
  nbPokemons: number
  selectedGenerations: number[]
  timerDurationSeconds: number
  pokemonsToGuess?: PokemonSimpleDto[]
  currentIndexJ1: number
  currentIndexJ2: number
  scoreJ1: number
  scoreJ2: number
  attemptsUsedJ1: number
  attemptsUsedJ2: number
  usedHintsJ1: string[]
  usedHintsJ2: string[]
  completedPokemonsJ1: CompletedPokemonDto[]
  completedPokemonsJ2: CompletedPokemonDto[]
}

export interface GuessResultDto {
  isCorrect: boolean
  isTurnFinished: boolean
  isGameFinished: boolean
  isTimeout: boolean
  message: string
  pointsEarned: number
}

export interface TimerResponse {
  timeRemaining: number
}

export interface RematchStatusDto {
  player1Ready: boolean
  player2Ready: boolean
  rematchPartieId?: string
}
