import api from './api'
import type { TypeSimpleDto, TypesGameDto, TypesGuessResultDto, TypesGameResultsDto, TypesRematchStatusDto } from '../types/typesGame'

export async function getAllTypes(): Promise<TypeSimpleDto[]> {
  const { data } = await api.get<TypeSimpleDto[]>('/api/types-game/types')
  return data
}

export async function getTypesGame(partieId: string, dresseurId: string): Promise<TypesGameDto> {
  const { data } = await api.get<TypesGameDto>(`/api/types-game/${partieId}`, {
    params: { dresseurId },
  })
  return data
}

export async function submitTypesGuess(
  partieId: string,
  dresseurId: string,
  type1Id: number,
  type2Id: number | undefined,
  elapsedSeconds: number,
  attemptCount: number,
): Promise<TypesGuessResultDto> {
  const { data } = await api.post<TypesGuessResultDto>(`/api/types-game/${partieId}/guess`, {
    dresseurId,
    type1Id,
    type2Id: type2Id ?? null,
    elapsedSeconds,
    attemptCount,
  })
  return data
}

export async function getTypesGameResults(partieId: string): Promise<TypesGameResultsDto> {
  const { data } = await api.get<TypesGameResultsDto>(`/api/types-game/${partieId}/results`)
  return data
}

export async function markRematchReady(partieId: string, dresseurId: string): Promise<TypesRematchStatusDto> {
  const { data } = await api.post<TypesRematchStatusDto>(
    `/api/types-game/${partieId}/rematch-ready`,
    {},
    { params: { dresseurId } }
  )
  return data
}
