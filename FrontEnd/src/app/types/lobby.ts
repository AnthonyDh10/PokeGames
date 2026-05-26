/** Paramètres de partie configurables depuis le lobby. */
export interface GameSettings {
  nbPokemons: number
  generations: number[]
  timerDuration: number // -1 = infini
}
