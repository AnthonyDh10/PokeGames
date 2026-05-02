import api from './api'
import type { PokemonDto, CensoredDescriptionDto, PokemonHintsDto } from '../types/pokemon'

export async function getAllPokemons(): Promise<PokemonDto[]> {
  const { data } = await api.get<PokemonDto[]>('/api/pokemon')
  return data
}

export async function getCensoredDescription(pokemonId: string): Promise<CensoredDescriptionDto> {
  const { data } = await api.get<CensoredDescriptionDto>(`/api/pokemon/${pokemonId}/censored-description`)
  return data
}

export async function getHints(pokemonId: string): Promise<PokemonHintsDto> {
  const { data } = await api.get<PokemonHintsDto>(`/api/pokemon/${pokemonId}/hints`)
  return data
}
