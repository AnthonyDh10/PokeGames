import api from './api'
import type { PartieDto, GuessResultDto, TimerResponse, RematchStatusDto } from '../types/partie'

/**
 * Crée une nouvelle partie et désigne le dresseur appelant comme joueur 1.
 *
 * @param dresseurId - UUID de session du joueur qui crée la partie.
 * @returns La partie nouvellement créée avec son code de session.
 */
export async function createPartie(dresseurId: string): Promise<PartieDto> {
  const { data } = await api.post<PartieDto>('/api/partie/create', { dresseurId })
  return data
}

/**
 * Rejoint une partie existante via son code de session.
 *
 * @param codeSession - Code à 6 caractères affiché dans le lobby.
 * @param dresseurId - UUID de session du joueur qui rejoint.
 * @returns L'état de la partie après l'entrée du second joueur.
 */
export async function joinPartie(codeSession: string, dresseurId: string): Promise<PartieDto> {
  const { data } = await api.post<PartieDto>('/api/partie/join', { codeSession, dresseurId })
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
 * Démarre une partie en envoyant les paramètres de jeu au serveur.
 *
 * Le payload envoyé varie selon le mode :
 * - `Standard` : nbPokemons, générations et durée du timer.
 * - `DeZoom` : générations uniquement (pas de nbPokemons).
 * - Autres modes (ex : `Types`) : n'envoie que les paramètres explicitement fournis.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param isSolo - `true` pour une partie solo, `false` pour multijoueur.
 * @param settings - Paramètres optionnels (Pokémon, générations, timer).
 * @param mode - Mode de jeu (`'Standard'`, `'DeZoom'`, `'Types'`, etc.).
 * @returns L'état de la partie après démarrage.
 */
export async function startPartie(
  partieId: string,
  isSolo: boolean,
  settings?: { nbPokemons: number; generations: number[]; timerDuration: number },
  mode: string = 'Standard'
): Promise<PartieDto> {
  // Construction conditionnelle du payload : certains modes (ex. "Types") n'acceptent
  // pas les paramètres nbPokemons/générations, on ne les inclut que si pertinent.
  const payload: {
    mode: string
    isSolo: boolean
    nbPokemons?: number
    generations?: number[]
    timerDuration?: number
  } = { mode, isSolo }

  if (mode === 'Standard') {
    payload.nbPokemons = settings?.nbPokemons ?? 1
    payload.generations = settings?.generations ?? [1, 2, 3, 4, 5, 6, 7, 8]
    payload.timerDuration = settings?.timerDuration ?? 60
  } else if (mode === 'DeZoom') {
    // DeZoom utilise les générations et peut avoir une durée de timer personnalisée.
    payload.generations = settings?.generations ?? [1, 2, 3, 4, 5, 6, 7, 8, 9]
    if (settings?.timerDuration !== undefined) payload.timerDuration = settings.timerDuration
  } else {
    // Autres modes (ex. "Types") : n'envoie nbPokemons/générations que si explicitement fournis.
    if (settings?.nbPokemons !== undefined) payload.nbPokemons = settings.nbPokemons
    if (settings?.generations !== undefined) payload.generations = settings.generations
    if (settings?.timerDuration !== undefined) payload.timerDuration = settings.timerDuration
  }

  const { data } = await api.post<PartieDto>(`/api/partie/${partieId}/start`, payload)
  return data
}

/**
 * Soumet une proposition de réponse pour le Pokémon en cours.
 * La valeur spéciale `'__TIMEOUT__'` est réservée au cas de dépassement de temps.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur qui propose.
 * @param pokemonName - Nom français du Pokémon proposé.
 * @returns Le résultat de la tentative (correct, score, indicateurs de proximité, etc.).
 */
export async function submitGuess(partieId: string, dresseurId: string, pokemonName: string): Promise<GuessResultDto> {
  const { data } = await api.post<GuessResultDto>(`/api/partie/${partieId}/guess`, { dresseurId, pokemonName })
  return data
}

/**
 * Demande un indice supplémentaire pour le Pokémon en cours.
 * Le serveur enregistre l'indice comme utilisé et applique la pénalité de temps correspondante.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur qui demande l'indice.
 * @param hintType - Clé de l'indice demandé (ex : `'type'`, `'generation'`, `'ability'`).
 */
export async function useHint(partieId: string, dresseurId: string, hintType: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/hint`, { dresseurId, hintType })
}

/**
 * Interroge le serveur pour connaître le temps restant dans la partie.
 * Appelé périodiquement par `useTimer` (toutes les secondes) pour maintenir la synchronisation.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur.
 * @returns Le temps restant en secondes et la durée totale du timer.
 */
export async function getTimer(partieId: string, dresseurId: string): Promise<TimerResponse> {
  const { data } = await api.get<TimerResponse>(`/api/partie/${partieId}/timer/${dresseurId}`)
  return data
}

/**
 * Remet le timer à zéro côté serveur.
 * Utilisé lors du passage au Pokémon suivant (ex : Pokémon sans description).
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur.
 */
export async function resetTimer(partieId: string, dresseurId: string): Promise<void> {
  await api.post(`/api/partie/${partieId}/timer/reset`, { dresseurId })
}

/**
 * Met à jour les paramètres de jeu d'une partie en attente dans le lobby.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param nbPokemons - Nombre de Pokémon à deviner dans la partie.
 * @param generations - Générations sélectionnées pour le tirage aléatoire.
 * @param timerDuration - Durée du timer en secondes (optionnel).
 * @returns L'état de la partie après mise à jour des paramètres.
 */
export async function updateGameSettings(
  partieId: string,
  nbPokemons: number,
  generations: number[],
  timerDuration?: number
): Promise<PartieDto> {
  const payload: { nbPokemons: number; generations: number[]; timerDuration?: number } = {
    nbPokemons,
    generations,
  }
  if (timerDuration !== undefined) payload.timerDuration = timerDuration

  const { data } = await api.put<PartieDto>(`/api/partie/${partieId}/settings`, payload)
  return data
}

/**
 * Signale au serveur que le joueur est prêt pour une revanche.
 * Si les deux joueurs sont prêts, le serveur crée une nouvelle partie et retourne son identifiant.
 *
 * @param partieId - Identifiant de la partie terminée.
 * @param dresseurId - UUID de session du joueur qui demande la revanche.
 * @returns Le statut de la revanche, incluant `rematchPartieId` si la nouvelle partie est créée.
 */
export async function markRematchReady(partieId: string, dresseurId: string): Promise<RematchStatusDto> {
  const { data } = await api.post<RematchStatusDto>(
    `/api/partie/${partieId}/rematch-ready`,
    {},
    { params: { dresseurId } }
  )
  return data
}
