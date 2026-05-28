import api from './api'
import type { DeZoomGameDto, DeZoomGuessResultDto, DeZoomGameResultsDto, DeZoomRematchStatusDto } from '../types/dezoom'

/**
 * Récupère l'état courant d'une partie Dézoom pour un joueur donné :
 * image actuelle (niveau de zoom), score, statut, etc.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur.
 * @returns L'état de la partie Dézoom incluant l'URL de l'image zoomée.
 */
export async function getDeZoomGame(
  partieId: string,
  dresseurId: string,
  generations?: number[],
): Promise<DeZoomGameDto> {
  const { data } = await api.get<DeZoomGameDto>(`/api/dezoom/${partieId}`, {
    params: {
      dresseurId,
      ...(generations && generations.length > 0 ? { generations } : {}),
    },
    paramsSerializer: {
      indexes: null,
    },
  })
  return data
}

/**
 * Soumet une proposition de réponse dans une partie Dézoom.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur.
 * @param pokemonNameFr - Nom français du Pokémon proposé.
 * @param elapsedSeconds - Temps écoulé en secondes depuis le début de la question (côté client).
 * @param attemptCount - Nombre de tentatives effectuées pour cette question.
 * @returns Le résultat de la tentative (correct, score, Pokémon révélé, etc.).
 */
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

/**
 * Récupère le tableau de résultats complet à la fin d'une partie Dézoom.
 *
 * @param partieId - Identifiant unique de la partie terminée.
 * @returns Les résultats détaillés : scores, Pokémon devinés, temps par question.
 */
export async function getDeZoomResults(partieId: string): Promise<DeZoomGameResultsDto> {
  const { data } = await api.get<DeZoomGameResultsDto>(`/api/dezoom/${partieId}/results`)
  return data
}

/**
 * Signale au serveur que le joueur est prêt pour une revanche en Dézoom.
 * Si les deux joueurs sont prêts, le serveur crée une nouvelle partie et retourne son identifiant.
 *
 * @param partieId - Identifiant de la partie terminée.
 * @param dresseurId - UUID de session du joueur.
 * @returns Le statut de la revanche, incluant `rematchPartieId` si la nouvelle partie est créée.
 */
export async function markDeZoomRematchReady(partieId: string, dresseurId: string): Promise<DeZoomRematchStatusDto> {
  const { data } = await api.post<DeZoomRematchStatusDto>(
    `/api/dezoom/${partieId}/rematch-ready`,
    {},
    { params: { dresseurId } }
  )
  return data
}
