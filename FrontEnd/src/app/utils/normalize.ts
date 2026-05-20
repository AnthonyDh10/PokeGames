/**
 * Normalise une chaîne de caractères en:
 * - Supprimant les accents
 * - Convertissant en minuscules
 * 
 * Exemple: "Féé" → "fee", "FEU" → "feu"
 */
export function normalizeString(str: string): string {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}
