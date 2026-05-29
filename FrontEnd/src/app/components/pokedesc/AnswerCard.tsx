import Card from '../primitives/Card'
import SubCard from '../primitives/SubCard'
import PixelButton from '../primitives/PixelButton'
import PokemonSearchInput from '../game/PokemonSearchInput'
import { colors } from '../../design/colors'
import type { PokemonDto } from '../../types/pokemon'

/** Props du composant `AnswerCard`. */
interface AnswerCardProps {
  /** Liste des Pokémon filtrés (résultat de la recherche). */
  filteredPokemons: PokemonDto[]
  /** Texte de recherche courant dans l'input. */
  searchTerm: string
  /** Nom du Pokémon sélectionné (vide si aucun). */
  selectedPokemonName: string
  /** `true` pendant l'envoi de la réponse au serveur. */
  isSubmitting: boolean
  /** Message de feedback affiché après une réponse (vide si aucun). */
  guessResultMessage: string
  /** `true` si la dernière réponse était correcte (détermine la couleur du message). */
  lastGuessCorrect: boolean
  /** Callback déclenché à chaque frappe dans l'input de recherche. */
  onSearchChange: (term: string) => void
  /** Callback quand le joueur sélectionne un Pokémon dans la liste. */
  onSelectPokemon: (name: string) => void
  /** Callback pour effacer la sélection courante. */
  onClearSelection: () => void
  /** Callback de soumission de la réponse. */
  onSubmit: () => void
}

/**
 * Carte de saisie de réponse pour PokéDesc.
 * Affiche un champ de recherche avec autocomplétion ou le Pokémon sélectionné,
 * un bouton de validation, et un message de feedback inline.
 */
export default function AnswerCard({
  filteredPokemons,
  searchTerm,
  selectedPokemonName,
  isSubmitting,
  guessResultMessage,
  lastGuessCorrect,
  onSearchChange,
  onSelectPokemon,
  onClearSelection,
  onSubmit,
}: AnswerCardProps) {

  return (
    <div className="relative">

      {/* Card de réponse */}
      <Card pokeballColor={colors.brand.white} pokeballOpacity={0} showHeader={true} overflowVisible>
        <div className="p-4 md:p-6">
          <h3
            className="font-heading text-center text-xl tracking-wide mb-6"
            style={{ color: colors.brand.blue, fontSize: '1.25rem' }}
          >
            RÉPONSE
          </h3>

          <div className="mb-6 relative h-12">
            {!selectedPokemonName ? (
              <PokemonSearchInput
                items={filteredPokemons}
                value={searchTerm}
                onChange={onSearchChange}
                onSelect={(p) => onSelectPokemon(p.nameFr)}
                disabled={isSubmitting}
              />
            ) : (
              <SubCard
                bodyColor="#f9fafb"
                borderColor={colors.brand.blue}
                borderThickness="p-[2px]"
                className="shadow-inner"
              >
                <div className="flex flex-row items-center justify-between w-full h-full px-4">
                  <span className="font-heading font-medium text-gray-800 truncate">
                    ▶ Pokémon choisi : {selectedPokemonName}
                  </span>
                  <button
                    onClick={onClearSelection}
                    disabled={isSubmitting}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-2 disabled:opacity-50 shrink-0"
                    title="Changer de Pokémon"
                  >
                    ✖
                  </button>
                </div>
              </SubCard>
            )}
          </div>

          <PixelButton
            onClick={onSubmit}
            disabled={!selectedPokemonName || isSubmitting}
            className="font-heading font-semibold w-full h-12 text-white rounded hover:-translate-y-0.5 hover:shadow-px-sm transition disabled:opacity-50 disabled:translate-y-0"
            color={colors.brand.blue}
            colorLight={colors.brand.blueLight}
            colorDark={colors.brand.blueDark}
            colorBorder={colors.brand.blueDeep}
          >
            {isSubmitting ? 'Envoi...' : 'Valider la réponse'}
          </PixelButton>

          {/* Message de succès inline */}
          {guessResultMessage && lastGuessCorrect && (
            <div
              className="font-heading font-medium mt-4 px-4 py-3 rounded-xl text-center border"
              style={{
                backgroundColor: colors.game.success + '22',
                color: colors.game.success,
                borderColor: colors.game.success + '88',
              }}
            >
              {guessResultMessage}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
