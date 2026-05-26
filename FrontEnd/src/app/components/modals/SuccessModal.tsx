import Card from '../Card'
import PixelButton from '../PixelButton'
import { colors } from '../../design/colors'

/** Props du composant `SuccessModal`. */
interface SuccessModalProps {
  /** Affiche la modale si `true`. */
  show: boolean
  /** URL du sprite révélé du Pokémon. */
  sprite: string
  /** Nom du Pokémon trouvé. */
  pokemonName: string
  /** `true` si c'était le dernier Pokémon de la partie. */
  isFinalPokemon: boolean
  /** Callback déclenché quand le joueur clique sur le bouton (suivant ou terminer). */
  onProceed: () => void
}

/** Modale de succès affichée quand le joueur a trouvé le bon Pokémon. */
export default function SuccessModal({ show, sprite, pokemonName, isFinalPokemon, onProceed }: SuccessModalProps) {
  if (!show || !sprite) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] backdrop-blur-sm p-4">
      <div className="max-w-sm w-full">
        <Card
          showHeader={true}
          headerColor={colors.game.success}
          pokeballColor={colors.game.success}
          pokeballOpacity={0.05}
          animation={true}
          header={
            <h4 className="font-display text-xl tracking-wide text-white text-center w-full">
              Bravo !
            </h4>
          }
        >
          <div className="p-6 text-center flex flex-col items-center">
            <p className="font-heading font-bold text-lg mb-2" style={{ color: colors.ui.textMuted }}>
              C'était bien :
            </p>
            <img
              src={sprite}
              alt="Pokémon trouvé"
              className="w-64 h-64 animate-[spriteReveal_0.8s_ease-out]"
              style={{ imageRendering: 'pixelated' }}
            />
            <p className="font-heading font-bold mb-6" style={{ color: colors.game.success, fontSize: '1.5rem' }}>
              {pokemonName}
            </p>
            <PixelButton
              onClick={onProceed}
              className="font-heading font-semibold w-full h-12 text-white rounded hover:-translate-y-0.5 hover:shadow-px-sm transition disabled:opacity-50 disabled:translate-y-0"
              color={colors.brand.blue}
              colorLight={colors.brand.blueLight}
              colorDark={colors.brand.blueDark}
              colorBorder={colors.brand.blueDeep}
            >
              {isFinalPokemon ? 'Terminer la partie' : 'Pokémon suivant'}
            </PixelButton>
          </div>
        </Card>
      </div>
    </div>
  )
}
