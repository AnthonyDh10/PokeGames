import Card from '../Card'
import PixelButton from '../PixelButton'
import { colors } from '../../design/colors'

interface FailureModalProps {
  show: boolean
  sprite: string
  pokemonName: string
  isFinalPokemon: boolean
  isTimeout: boolean
  onProceed: () => void
}

export default function FailureModal({ show, sprite, pokemonName, isFinalPokemon, isTimeout, onProceed }: FailureModalProps) {
  if (!show || !sprite) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="max-w-sm w-full">
        <Card
          showHeader={true}
          headerColor={colors.game.error}
          pokeballColor={colors.game.error}
          pokeballOpacity={0.05}
          animation={true}
          header={
            <h4 className="font-display text-xl tracking-wide text-white text-center w-full">
              {isTimeout ? 'Temps écoulé !' : 'Dommage !'}
            </h4>
          }
        >
          <div className="p-6 text-center flex flex-col items-center">
            <p className="font-heading font-bold text-lg mb-2" style={{ color: colors.ui.textMuted }}>
              C'était :
            </p>
            <img
              src={sprite}
              alt="Pokémon à deviner"
              className="w-64 h-64 animate-[spriteReveal_0.8s_ease-out]"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="font-heading font-bold mb-6" style={{ color: colors.game.error, fontSize: '1.5rem' }}>
              {pokemonName}
            </p>
            <PixelButton
              onClick={onProceed}
              className="font-heading font-semibold w-full h-12 text-white rounded hover:-translate-y-0.5 hover:shadow-px-sm transition disabled:opacity-50 disabled:translate-y-0"
              color={colors.brand.red}
              colorDark={colors.brand.redDark}
              colorLight={colors.brand.redLight}
              colorBorder={colors.brand.redDeep}
            >
              {isFinalPokemon ? 'Terminer la partie' : 'Pokémon suivant'}
            </PixelButton>
          </div>
        </Card>
      </div>
    </div>
  )
}
