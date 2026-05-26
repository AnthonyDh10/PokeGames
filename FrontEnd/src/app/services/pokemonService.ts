import api from './api'
import type { PokemonDto, CensoredDescriptionDto, PokemonHintsDto } from '../types/pokemon'

/**
 * Récupère la liste complète des Pokémon disponibles dans l'application.
 *
 * @returns La liste de tous les Pokémon avec leurs métadonnées de base.
 */
export async function getAllPokemons(): Promise<PokemonDto[]> {
  const { data } = await api.get<PokemonDto[]>('/api/pokemon')
  return data
}

/**
 * Récupère la description Pokédex d'un Pokémon avec son nom censuré
 * (remplacé par des étoiles), pour éviter de divulguer la réponse
 * pendant le jeu PokéDesc.
 *
 * @param pokemonId - L'identifiant du Pokémon (numéro Pokédex en string).
 * @returns Les descriptions censurées du Pokémon.
 */
export async function getCensoredDescription(pokemonId: string): Promise<CensoredDescriptionDto> {
  const { data } = await api.get<CensoredDescriptionDto>(`/api/pokemon/${pokemonId}/censored-description`)
  return data
}

/**
 * Récupère les indices disponibles pour un Pokémon donné.
 * Les indices incluent le type, la génération, la capacité signature, etc.
 *
 * @param pokemonId - L'identifiant du Pokémon (numéro Pokédex en string).
 * @returns L'ensemble des indices du Pokémon, prêts à être affichés ou filtrés.
 */
export async function getHints(pokemonId: string): Promise<PokemonHintsDto> {
  const { data } = await api.get<PokemonHintsDto>(`/api/pokemon/${pokemonId}/hints`)
  return data
}
