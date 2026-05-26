import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import HomePage from '../pages/HomePage'
import LobbyPokedescPage from '../pages/LobbyPokedescPage'
import LobbyTypesPage from '../pages/LobbyTypesPage'
import LobbyDeZoomPage from '../pages/LobbyDeZoomPage'
import PokeDescPage from '../pages/PokeDescPage'
import TypesGamePage from '../pages/TypesGamePage'
import DeZoomGamePage from '../pages/DeZoomGamePage'
import ResultatsPage from '../pages/ResultatsPage'
import ResultatsTypesPage from '../pages/ResultatsTypesPage'
import ResultatsDeZoomPage from '../pages/ResultatsDeZoomPage'
import ReglesPage from '../pages/ReglesPage'

/** Retourne true sur les routes de jeu actif (Chen visible). */
export function isChenVisible(path: string): boolean {
  return (
    /^\/pokedesc\/[^/]+$/.test(path) ||
    /^\/types\/[^/]+$/.test(path) ||
    /^\/dezoom\/[^/]+$/.test(path)
  )
}

/** Retourne true sur toutes les routes sauf l'accueil et les règles (Chat visible). */
export function isChatVisible(path: string): boolean {
  return path !== '/' && path !== '/home' && path !== '/regles'
}

/** Arbre de routes complet, avec transitions AnimatePresence. */
export default function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/pokedesc" element={<LobbyPokedescPage />} />
        <Route path="/pokedesc/:partieId" element={<PokeDescPage />} />
        <Route path="/types" element={<LobbyTypesPage />} />
        <Route path="/types/:partieId" element={<TypesGamePage />} />
        <Route path="/dezoom" element={<LobbyDeZoomPage />} />
        <Route path="/dezoom/:partieId" element={<DeZoomGamePage />} />
        <Route path="/regles" element={<ReglesPage />} />
        <Route path="/resultats/:partieId" element={<ResultatsPage />} />
        <Route path="/resultats-types/:partieId" element={<ResultatsTypesPage />} />
        <Route path="/resultats-dezoom/:partieId" element={<ResultatsDeZoomPage />} />
      </Routes>
    </AnimatePresence>
  )
}
