import { useNavigate } from 'react-router'

interface ResultsActionsProps {
  isSolo: boolean
  bothFinished: boolean

  // Bouton Nouvelle partie
  onNouvelle: () => void
  isCreatingNew?: boolean

  // Bouton Relancer (solo)
  onRelancer?: () => void
  isRelaunching?: boolean

  // Bouton Revanche (multi)
  onRematch?: () => void
  rematchRequested?: boolean

  // Couleurs — une par bouton
  relancerColor: string
  nouvellePartieColor: string
  menuColor?: string // si absent : style blanc/gris

  // Désactiver "Nouvelle partie" tant que bothFinished est false
  requireFinishedForNewGame?: boolean
}

const BASE =
  'px-6 py-3 font-semibold border-2 border-white shadow-px hover:-translate-y-0.5 hover:shadow-px-lg transition'

export default function ResultsActions({
  isSolo,
  bothFinished,
  onNouvelle,
  isCreatingNew = false,
  onRelancer,
  isRelaunching = false,
  onRematch,
  rematchRequested = false,
  relancerColor,
  nouvellePartieColor,
  menuColor,
  requireFinishedForNewGame = false,
}: ResultsActionsProps) {
  const navigate = useNavigate()

  return (
    <>
      {/* Relancer — solo uniquement */}
      {isSolo && bothFinished && onRelancer && (
        <button
          onClick={onRelancer}
          disabled={isRelaunching}
          className={`${BASE} text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0`}
          style={{ backgroundColor: relancerColor }}
        >
          {isRelaunching ? '⏳ Lancement...' : '🔄 Relancer'}
        </button>
      )}

      {/* Revanche — multi uniquement */}
      {!isSolo && bothFinished && onRematch && (
        <button
          onClick={onRematch}
          disabled={rematchRequested}
          className={`${BASE} text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0`}
          style={{ backgroundColor: relancerColor }}
        >
          {rematchRequested ? '⏳ En attente...' : '🔄 Revanche'}
        </button>
      )}

      {/* Nouvelle partie */}
      <button
        onClick={onNouvelle}
        disabled={(requireFinishedForNewGame && !bothFinished) || isCreatingNew}
        className={`${BASE} text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:translate-y-0`}
        style={{ backgroundColor: nouvellePartieColor }}
      >
        {isCreatingNew ? '⏳ Création...' : '🎮 Nouvelle partie'}
      </button>

      {/* Menu principal */}
      {menuColor ? (
        <button
          onClick={() => navigate('/home')}
          className={`${BASE} text-white`}
          style={{ backgroundColor: menuColor }}
        >
          🏠 Menu principal
        </button>
      ) : (
        <button
          onClick={() => navigate('/home')}
          className={`${BASE} bg-white text-gray-700 border-white hover:border-gray-300`}
        >
          🏠 Menu principal
        </button>
      )}
    </>
  )
}
