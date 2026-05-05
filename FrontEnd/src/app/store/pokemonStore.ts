import { create } from 'zustand'
import { getAllPokemons } from '../services/pokemonService'
import type { PokemonDto } from '../types/pokemon'

interface PokemonStore {
  pokemons: PokemonDto[]
  isLoaded: boolean
  load: () => Promise<PokemonDto[]>
}

export const usePokemonStore = create<PokemonStore>((set, get) => ({
  pokemons: [],
  isLoaded: false,
  load: async () => {
    const { isLoaded, pokemons } = get()
    if (isLoaded) return pokemons
    const data = await getAllPokemons()
    set({ pokemons: data, isLoaded: true })
    return data
  },
}))
