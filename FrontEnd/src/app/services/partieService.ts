import api from './api'
import type { PartieDto, GuessResultDto, TimerResponse, RematchStatusDto } from '../types/partie'

export async function createPartie(dresseurId: string): Promise<PartieDto> {
  const { data } = await api.post<PartieDto>('/api/partie/create', { dresseurId })
  return data
}

export async function joinPartie(codeSession: string, dresseurId: string): Promise<PartieDto> {
  const { data } = await api.post<PartieDto>('/api/partie/join', { codeSession, dresseurId })
  return data
}

export async function getPartie(partieId: string): Promise<PartieDto> {
  const { data } = await api.get<PartieDto>(`/api/partie/${partieId}`)
  return data
}

export async function startPartie(
  partieId: string,
  isSolo: boolean,
  settings?: { nbPokemons: number; generations: number[]; timerDuration: number },
  mode: string = 'Standard'
): Promise<PartieDto> {
  const { data } = await api.post<PartieDto>(`/api/partie/${partieId}/start`, {
    mode,
    isSolo,
    nbPokemons: settings?.nbPokemons ?? 1,
    generations: settings?.generations ?? [1, 2, 3, 4, 5, 6, 7, 8],
    timerDuration: settings?.timerDuration ?? 60,
  })
  return data
}

export async function submitGuess(partieId: string, dresseurId: string, pokemonName: string): Promise<GuessResultDto> {
  const { data } = await api.post<GuessResultDto>(`/api/partie/${partieId}/guess`, { dresseurId, pokemonName })
  return data
}

export async function useHint(partieId: string, dresseurId: string, hintType: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/hint`, { dresseurId, hintType })
}

export async function getTimer(partieId: string, dresseurId: string): Promise<TimerResponse> {
  const { data } = await api.get<TimerResponse>(`/api/partie/${partieId}/timer/${dresseurId}`)
  return data
}

export async function resetTimer(partieId: string, dresseurId: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/timer/reset`, { dresseurId })
}

export async function updateGameSettings(
  partieId: string,
  nbPokemons: number,
  generations: number[]
): Promise<PartieDto> {
  const { data } = await api.put<PartieDto>(`/api/partie/${partieId}/settings`, {
    nbPokemons,
    generations,
  })
  return data
}

export async function markRematchReady(partieId: string, dresseurId: string): Promise<RematchStatusDto> {
  const { data } = await api.post<RematchStatusDto>(
    `/api/partie/${partieId}/rematch-ready`,
    {},
    { params: { dresseurId } }
  )
  return data
}
