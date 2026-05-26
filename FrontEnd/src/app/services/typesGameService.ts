import api from './api'
import type { TypeSimpleDto, TypesGameDto, TypesGuessResultDto, TypesGameResultsDto, TypesRematchStatusDto } from '../types/typesGame'

/**
 * Récupère la liste de tous les types Pokémon disponibles dans le jeu Typuzzle.
 *
 * @returns La liste des types avec leur identifiant et leur nom.
 */
export async function getAllTypes(): Promise<TypeSimpleDto[]> {
  const { data } = await api.get<TypeSimpleDto[]>('/api/types-game/types')
  return data
}

/**
 * Récupère l'état courant d'une partie Typuzzle pour un joueur donné.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur.
 * @returns L'état de la partie incluant les données du Pokémon à deviner (sans son nom).
 */
export async function getTypesGame(partieId: string, dresseurId: string): Promise<TypesGameDto> {
  const { data } = await api.get<TypesGameDto>(`/api/types-game/${partieId}`, {
    params: { dresseurId },
  })
  return data
}

/**
 * Soumet une proposition de type(s) pour le Pokémon en cours dans une partie Typuzzle.
 *
 * @param partieId - Identifiant unique de la partie.
 * @param dresseurId - UUID de session du joueur.
 * @param type1Id - Identifiant du premier type proposé.
 * @param type2Id - Identifiant du second type (optionnel si le Pokémon est monotype).
 * @param elapsedSeconds - Temps écoulé en secondes depuis le début de la question (côté client).
 * @param attemptCount - Nombre de tentatives effectuées pour cette question.
 * @returns Le résultat de la tentative (correct, score, types révélés, etc.).
 */
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
    // Le serveur attend `null` (pas `undefined`) pour un Pokémon monotype.
    type2Id: type2Id ?? null,
    elapsedSeconds,
    attemptCount,
  })
  return data
}

/**
 * Récupère le tableau de résultats complet à la fin d'une partie Typuzzle.
 *
 * @param partieId - Identifiant unique de la partie terminée.
 * @returns Les résultats détaillés : scores, Pokémon, types corrects, temps par question.
 */
export async function getTypesGameResults(partieId: string): Promise<TypesGameResultsDto> {
  const { data } = await api.get<TypesGameResultsDto>(`/api/types-game/${partieId}/results`)
  return data
}

/**
 * Signale au serveur que le joueur est prêt pour une revanche en Typuzzle.
 * Si les deux joueurs sont prêts, le serveur crée une nouvelle partie et retourne son identifiant.
 *
 * @param partieId - Identifiant de la partie terminée.
 * @param dresseurId - UUID de session du joueur.
 * @returns Le statut de la revanche, incluant `rematchPartieId` si la nouvelle partie est créée.
 */
export async function markRematchReady(partieId: string, dresseurId: string): Promise<TypesRematchStatusDto> {
  const { data } = await api.post<TypesRematchStatusDto>(
    `/api/types-game/${partieId}/rematch-ready`,
    {},
    { params: { dresseurId } }
  )
  return data
}
