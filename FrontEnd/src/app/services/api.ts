import axios from 'axios'

/**
 * Instance Axios partagée pour toutes les communications avec l'API backend.
 *
 * L'URL de base est configurable via la variable d'environnement `VITE_API_URL`.
 * En l'absence de cette variable (ex : dev local sans `.env.local`),
 * l'application se replie sur `http://localhost:5122`.
 *
 * Cette instance est un singleton : ne pas créer d'instances supplémentaires
 * dans le code applicatif — toujours importer ce module.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5122',
})

export default api
