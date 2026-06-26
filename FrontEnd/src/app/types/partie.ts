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

  // Champs legacy — supprimés côté back en Phase 2, conservés optionnels jusqu'en Phase 4
  dresseur1Id?: string
  dresseur2Id?: string
  nbPokemons?: number
  selectedGenerations?: number[]
  timerDurationSeconds?: number
  pokemonsToGuess?: PokemonSimpleDto[]
  currentIndexJ1?: number
  currentIndexJ2?: number
  scoreJ1?: number
  scoreJ2?: number
  attemptsUsedJ1?: number
  attemptsUsedJ2?: number
  usedHintsJ1?: string[]
  usedHintsJ2?: string[]
  completedPokemonsJ1?: CompletedPokemonDto[]
  completedPokemonsJ2?: CompletedPokemonDto[]
  currentPokemonIdJ1?: string | null
  currentPokemonIdJ2?: string | null
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
