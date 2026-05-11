import { useNavigate } from 'react-router'
import PixelButton from './PixelButton'
import { colors } from '../design/colors'

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
  buttonColor: string
  buttonColorDark: string
  buttonColorLight: string
  buttonColorBorder: string
  
  menuColor?: string // si absent : style blanc/gris

  // Désactiver "Nouvelle partie" tant que bothFinished est false
  requireFinishedForNewGame?: boolean
}

export default function ResultsActions({
  isSolo,
  bothFinished,
  onNouvelle,
  isCreatingNew = false,
  onRelancer,
  isRelaunching = false,
  onRematch,
  rematchRequested = false,
  buttonColor,
  buttonColorDark,
  buttonColorLight,
  buttonColorBorder,
  menuColor,
  requireFinishedForNewGame = false,
}: ResultsActionsProps) {
  const navigate = useNavigate()

  return (
    <div className="grid sm:grid-cols-3 gap-4 w-full mt-6 h-16">
    
      {/* Relancer — solo uniquement */}
      {isSolo && bothFinished && onRelancer && (
        <PixelButton
          onClick={onRelancer}
          disabled={isRelaunching}
          colorBorder={buttonColorBorder}
          color={buttonColor}
          colorDark={buttonColorDark}
          colorLight={buttonColorLight}
          className="font-heading font-semibold text-white h-auto"
          style={{ fontSize: '1.5rem' }}
        >

          {isRelaunching ? '⏳ Lancement...' : 'Relancer'}
        </PixelButton>
      )}

      {/* Revanche — multi uniquement */}
      {!isSolo && bothFinished && onRematch && (
        <PixelButton
          onClick={onRematch}
          disabled={rematchRequested}
          colorBorder={buttonColorBorder}
          color={buttonColor}
          colorDark={buttonColorDark}
          colorLight={buttonColorLight}
          className="font-heading font-semibold text-white h-auto"
          style={{ fontSize: '1.5rem' }}
        >
          {rematchRequested ? '⏳ En attente...' : 'Revanche'}
        </PixelButton>
      )}

      {/* Nouvelle partie */}
      <PixelButton
        onClick={onNouvelle}
        disabled={(requireFinishedForNewGame && !bothFinished) || isCreatingNew}
        colorBorder={buttonColorBorder}
        color={buttonColor}
        colorDark={buttonColorDark}
        colorLight={buttonColorLight}
        className="font-heading font-semibold text-white h-auto"
        style={{ fontSize: '1.5rem' }}
      >
        {isCreatingNew ? '⏳ Création...' : 'Nouvelle partie'}
      </PixelButton>

      {/* Menu principal */}
      {menuColor ? (
        <PixelButton
          onClick={() => navigate('/home')}
          colorBorder={menuColor + '80'}
          color={menuColor}
          colorDark={menuColor + 'cc'}
          colorLight={menuColor + '33'}
          className="font-heading font-bold h-auto"
          style={{ fontSize: '1.5rem', color: colors.ui.textMuted }}
        >
          Menu principal
        </PixelButton>
      ) : (
        <PixelButton
          onClick={() => navigate('/home')}
          colorBorder='white'
          color='white'
          colorDark='white'
          colorLight='white'
          className="font-heading font-semibold h-auto"
          style={{ fontSize: '1.5rem', color: colors.ui.textMuted }}
        >
          Menu principal
        </PixelButton>
      )}
    </div>
  )
}
