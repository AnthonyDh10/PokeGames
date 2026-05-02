import api from './api'
import type { DeZoomGameDto, DeZoomGuessResultDto, DeZoomGameResultsDto, DeZoomRematchStatusDto } from '../types/dezoom'

export async function getDeZoomGame(partieId: string, dresseurId: string): Promise<DeZoomGameDto> {
  const { data } = await api.get<DeZoomGameDto>(`/api/dezoom/${partieId}`, {
    params: { dresseurId },
  })
  return data
}

export async function submitDeZoomGuess(
  partieId: string,
  dresseurId: string,
  pokemonNameFr: string,
  elapsedSeconds: number,
  attemptCount: number,
): Promise<DeZoomGuessResultDto> {
  const { data } = await api.post<DeZoomGuessResultDto>(`/api/dezoom/${partieId}/guess`, {
    dresseurId,
    pokemonNameFr,
    elapsedSeconds,
    attemptCount,
  })
  return data
}

export async function getDeZoomResults(partieId: string): Promise<DeZoomGameResultsDto> {
  const { data } = await api.get<DeZoomGameResultsDto>(`/api/dezoom/${partieId}/results`)
  return data
}

export async function markDeZoomRematchReady(partieId: string, dresseurId: string): Promise<DeZoomRematchStatusDto> {
  const { data } = await api.post<DeZoomRematchStatusDto>(
    `/api/dezoom/${partieId}/rematch-ready`,
    {},
    { params: { dresseurId } }
  )
  return data
}
