import Card from './Card'
import SubCard from './SubCard'
import PixelButton from './PixelButton'
import PokemonSearchInput from './PokemonSearchInput'
import { colors } from '../design/colors'
import type { PokemonDto } from '../types/pokemon'

interface AnswerCardProps {
  filteredPokemons: PokemonDto[]
  searchTerm: string
  selectedPokemonName: string
  isSubmitting: boolean
  guessResultMessage: string
  lastGuessCorrect: boolean
  onSearchChange: (term: string) => void
  onSelectPokemon: (name: string) => void
  onClearSelection: () => void
  onSubmit: () => void
}

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
