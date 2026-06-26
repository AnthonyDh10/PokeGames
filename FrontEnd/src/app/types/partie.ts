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

export interface GameSettingsDto {
  nbPokemons: number
  generations: number[]
  timerDuration: number
}

export interface PlayerDto {
  dresseurId: string
  name: string
  role: 'Host' | 'Guest'
  isConnected: boolean
  currentIndex: number
  score: number
  attemptsUsed: number
  usedHints: string[]
  timeRemaining: number
  rematchReady: boolean
  currentPokemonId?: string | null
  completedPokemons: CompletedPokemonDto[]
}

export interface PartieDto {
  id: string
  codeSession?: string
  statut?: string
  hostId: string
  maxPlayers: number
  modeSolo: boolean
  settings?: GameSettingsDto
  players: PlayerDto[]
  rematchPartieId?: string
}

export interface GuessResultDto {
  isCorrect: boolean
  isTurnFinished: boolean
  isGameFinished: boolean
  isTimeout: boolean
  message: string
  pointsEarned: number
  hasOneTypeInCommon?: boolean
  hasPerfectTypeMatch?: boolean
  hasSameGeneration?: boolean
  isInSameEvolutionChain?: boolean
}

export interface TimerResponse {
  timeRemaining: number
  timerDurationSeconds: number
}

export interface RematchStatusDto {
  player1Ready: boolean
  player2Ready: boolean
  rematchPartieId?: string
}

/**
 * Indicateurs de proximité retournés par le serveur après une tentative ratée.
 * Utilisé dans GuessResultDto, usePokeDesc et ChenMessage.
 */
export interface ProximityResult {
  hasOneTypeInCommon?: boolean
  hasPerfectTypeMatch?: boolean
  hasSameGeneration?: boolean
  isInSameEvolutionChain?: boolean
}
