import api from './api'
import type { PartieDto, GuessResultDto, TimerResponse, RematchStatusDto } from '../types/partie'

/**
 * Crée une nouvelle partie et désigne le dresseur appelant comme hôte.
 *
 * @param dresseurId - UUID de session du joueur qui crée la partie.
 * @param name - Nom d'affichage de l'hôte (cosmétique).
 * @returns La partie nouvellement créée avec son code de session.
 */
export async function createPartie(dresseurId: string, name: string = ''): Promise<PartieDto> {
  const { data } = await api.post<PartieDto>('/api/partie/create', { dresseurId, name })
  return data
}

/**
 * Rejoint une partie existante via son code de session.
 *
 * @param codeSession - Code à 6 caractères affiché dans le lobby.
 * @param dresseurId - UUID de session du joueur qui rejoint.
 * @param name - Nom d'affichage du joueur (cosmétique).
 * @returns L'état de la partie après l'entrée du joueur.
 */
export async function joinPartie(codeSession: string, dresseurId: string, name: string = ''): Promise<PartieDto> {
  const { data } = await api.post<PartieDto>('/api/partie/join', { codeSession, dresseurId, name })
  return data
}

/**
 * Récupère l'état courant d'une partie (score, Pokémon en cours, statut, etc.).
 *
 * @param partieId - Identifiant unique de la partie.
 * @returns L'état complet de la partie à l'instant de l'appel.
 */
export async function getPartie(partieId: string): Promise<PartieDto> {
  const { data } = await api.get<PartieDto>(`/api/partie/${partieId}`)
  return data
}

/**
 * Démarre une partie. Réservé à l'hôte.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param isSolo - `true` pour une partie solo.
 * @param settings - Paramètres optionnels (Pokémon, générations, timer).
 * @param mode - Mode de jeu (`'Standard'`, `'DeZoom'`, `'Types'`, etc.).
 * @param dresseurId - UUID de l'hôte (requis côté serveur pour l'autorisation).
 * @returns L'état de la partie après démarrage.
 */
export async function startPartie(
  partieId: string,
  isSolo: boolean,
  settings?: { nbPokemons: number; generations: number[]; timerDuration: number },
  mode: string = 'Standard',
  dresseurId?: string
): Promise<PartieDto> {
  const payload: Record<string, unknown> = { mode, isSolo }

  if (dresseurId) payload.dresseurId = dresseurId

  if (mode === 'Standard') {
    payload.nbPokemons = settings?.nbPokemons ?? 1
    payload.generations = settings?.generations ?? [1, 2, 3, 4, 5, 6, 7, 8]
    payload.timerDuration = settings?.timerDuration ?? 60
  } else if (mode === 'DeZoom') {
    payload.generations = settings?.generations ?? [1, 2, 3, 4, 5, 6, 7, 8, 9]
    if (settings?.timerDuration !== undefined) payload.timerDuration = settings.timerDuration
  } else {
    if (settings?.nbPokemons !== undefined) payload.nbPokemons = settings.nbPokemons
    if (settings?.generations !== undefined) payload.generations = settings.generations
    if (settings?.timerDuration !== undefined) payload.timerDuration = settings.timerDuration
  }

  const { data } = await api.post<PartieDto>(`/api/partie/${partieId}/start`, payload)
  return data
}

/**
 * Soumet une proposition de réponse pour le Pokémon en cours.
 */
export async function submitGuess(partieId: string, dresseurId: string, pokemonName: string): Promise<GuessResultDto> {
  const { data } = await api.post<GuessResultDto>(`/api/partie/${partieId}/guess`, { dresseurId, pokemonName })
  return data
}

/**
 * Signale un timeout au serveur pour le Pokémon en cours.
 */
export async function notifyTimeout(partieId: string, dresseurId: string): Promise<GuessResultDto> {
  const { data } = await api.post<GuessResultDto>(`/api/partie/${partieId}/timeout`, { dresseurId })
  return data
}

/**
 * Demande un indice supplémentaire pour le Pokémon en cours.
 */
export async function useHint(partieId: string, dresseurId: string, hintType: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/hint`, { dresseurId, hintType })
}

/**
 * Interroge le serveur pour connaître le temps restant dans la partie.
 */
export async function getTimer(partieId: string, dresseurId: string): Promise<TimerResponse> {
  const { data } = await api.get<TimerResponse>(`/api/partie/${partieId}/timer/${dresseurId}`)
  return data
}

/**
 * Remet le timer à zéro côté serveur.
 */
export async function resetTimer(partieId: string, dresseurId: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/timer/reset`, { dresseurId })
}

/**
 * Met à jour les paramètres de jeu d'une partie en attente. Réservé à l'hôte.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de l'hôte (requis côté serveur pour l'autorisation).
 * @param nbPokemons - Nombre de Pokémon à deviner.
 * @param generations - Générations sélectionnées.
 * @param timerDuration - Durée du timer en secondes (optionnel).
 */
export async function updateGameSettings(
  partieId: string,
  dresseurId: string,
  nbPokemons: number,
  generations: number[],
  timerDuration?: number
): Promise<PartieDto> {
  const payload: Record<string, unknown> = { dresseurId, nbPokemons, generations }
  if (timerDuration !== undefined) payload.timerDuration = timerDuration

  const { data } = await api.put<PartieDto>(`/api/partie/${partieId}/settings`, payload)
  return data
}

/**
 * Expulse un joueur de la partie. Réservé à l'hôte.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de l'hôte qui expulse.
 * @param targetId - UUID du joueur à expulser.
 */
export async function kickPlayer(partieId: string, dresseurId: string, targetId: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/kick`, { dresseurId, targetId })
}

/**
 * Quitte une partie en cours ou en attente.
 * Si le joueur est hôte, le prochain joueur est promu automatiquement.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID du joueur qui quitte.
 */
export async function leaveGame(partieId: string, dresseurId: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/leave`, { dresseurId })
}

/**
 * Signale au serveur que le joueur est prêt pour une revanche.
 *
 * @param partieId - Identifiant de la partie terminée.
 * @param dresseurId - UUID de session du joueur qui demande la revanche.
 * @returns Le statut de la revanche, incluant `rematchPartieId` si la nouvelle partie est créée.
 */
export async function markRematchReady(partieId: string, dresseurId: string): Promise<RematchStatusDto> {
  const { data } = await api.post<RematchStatusDto>(
    `/api/partie/${partieId}/rematch-ready`,
    { dresseurId }
  )
  return data
}
