import type { ReactNode } from 'react'
import Card from '../primitives/Card'
import { colors } from '../../design/colors'

/** Props du composant `GameResultsLayout`. */
interface GameResultsLayoutProps {
  /** Titre principal affiché dans la carte header (ex : "PokéDesc — Résultats"). */
  title: string
  /** Code de session affiché sous le titre. */
  sessionCode?: string
  /** Alerte ou message contextuel affiché dans la colonne gauche (ex : en attente adversaire). */
  topAlert?: ReactNode
  /** Colonne gauche — liste des scores (HPBars). */
  scores: ReactNode
  /** Colonne droite — détail des résultats (pokémons devintés, etc.). */
  details: ReactNode
  /** Zone d'actions pleine largeur (boutons Rejouer, Nouvelle partie…). */
  actions: ReactNode
  /** Couleur de la pokéball décorative dans la carte header. */
  pokeballColor?: string
  /** Couleur du fond de la carte header. */
  bodyColor?: string
  /** Couleur du texte dans la carte header. */
  textColor?: string
}

/**
 * Mise en page des pages de résultats (PokéDesc, Typuzzle, DeZoom).
 * Grille 40/60 sur desktop : scores à gauche, détails à droite.
 * Actions en pleine largeur en dessous.
 */
export default function GameResultsLayout({
  title,
  sessionCode,
  topAlert,
  scores,
  details,
  actions,
  pokeballColor,
  textColor = colors.brand.white,
  bodyColor = colors.brand.white,
}: GameResultsLayoutProps) {
  return (
    <div className="max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6 md:gap-8">

      {/* Grille : 40% / 60% sur desktop.
        Ajout de "items-start" pour que la colonne de gauche ne s'étire pas sur la hauteur de la colonne de droite.
      */}
      <div className="grid grid-cols-1 lg:grid-cols-[4fr_6fr] gap-6 md:gap-8 items-start">
        
        {/* Colonne de gauche (40%) : Header + Scores */}
        <div className="flex flex-col gap-6">
          
          {/* Header */}
          <Card 
            headerClassName="py-4" 
            pokeballColor={pokeballColor} 
            pokeballSize={200}
            bodyColor={bodyColor}
          >
            <div className="p-6 text-center flex flex-col items-center justify-center">
              <h1
                className="font-display text-2xl md:text-3xl tracking-wide"
                style={{ color: textColor }}
              >
                <strong>{title}</strong>
              </h1>
              {sessionCode && (
                <p className="font-heading text-sm mt-2" style={{ color: textColor }}>
                  Session : {sessionCode}
                </p>
              )}
              {topAlert && <div className="mt-4 w-full">{topAlert}</div>}
            </div>
          </Card>

          {/* Scores */}
          <div className="w-full">
            {scores}
          </div>
          
        </div>

        {/* Colonne de droite (60%) : Détails */}
        <div className="flex flex-col w-full">
          {details}
        </div>

      </div>

      {/* Actions : Pleine largeur en dessous de la grille.
        Retrait du 'justify-center' pour permettre au composant enfant de s'étirer à 100%.
      */}
      <div className="w-full mt-2">
        {actions}
      </div>

    </div>
  )
}