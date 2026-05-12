import Card from './Card'
import SubCard from './SubCard'
import PixelButton from './PixelButton'
import PokemonSearchInput from './PokemonSearchInput'
import oakChibi from './images/oak-chibi.png'
import { colors } from '../design/colors'
import type { PokemonDto } from '../types/pokemon'

interface ProximityResult {
  hasOneTypeInCommon?: boolean
  hasPerfectTypeMatch?: boolean
  hasSameGeneration?: boolean
  isInSameEvolutionChain?: boolean
}

interface AnswerCardProps {
  filteredPokemons: PokemonDto[]
  searchTerm: string
  selectedPokemonName: string
  isSubmitting: boolean
  guessResultMessage: string
  lastGuessCorrect: boolean
  proximityResult: ProximityResult
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
  proximityResult,
  onSearchChange,
  onSelectPokemon,
  onClearSelection,
  onSubmit,
}: AnswerCardProps) {
  const hasProximity =
    proximityResult.hasOneTypeInCommon ||
    proximityResult.hasPerfectTypeMatch ||
    proximityResult.hasSameGeneration ||
    proximityResult.isInSameEvolutionChain

  return (
    <div className="relative">
      {/* Bulle Prof. Chen (erreur) */}
      {guessResultMessage && !lastGuessCorrect && (
        <div className="absolute top-1/2 -translate-y-1/2 right-full mr-6 w-64 md:w-72 z-50 animate-fade-in drop-shadow-xl">
          <div className="absolute top-1/2 -translate-y-1/2 -right-[12px] w-0 h-0 border-y-[8px] border-y-transparent border-l-[8px] border-l-[#1f2937]" />
          <div className="absolute top-1/2 -translate-y-1/2 -right-[6px] w-0 h-0 border-y-[6px] border-y-transparent border-l-[6px] border-l-white z-10" />

          <SubCard
            bodyColor={colors.brand.white}
            borderColor={colors.brand.blueDeep}
            borderThickness="p-[4px]"
            className="p-4 flex gap-3 items-start"
          >
            <div className="flex flex-row items-center gap-2 shrink-0">
              <div className="w-10 h-10 flex items-center justify-center">
                <img src={oakChibi} alt="Prof. Chen" className="max-w-full max-h-full" style={{ imageRendering: 'pixelated' }} />
              </div>
              <p className="font-display font-bold tracking-wider" style={{ fontSize: '1rem', color: colors.ui.grayBorderDark }}>
                PROF. CHEN
              </p>
            </div>
            <div className="flex flex-col justify-center">
              <p className="font-heading text-sm text-gray-800 leading-snug" style={{ color: colors.brand.red }}>
                {guessResultMessage}
              </p>

              {hasProximity && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {proximityResult.hasPerfectTypeMatch ? (
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 border border-green-200 font-heading font-bold uppercase tracking-wide">
                      Types exacts
                    </span>
                  ) : proximityResult.hasOneTypeInCommon ? (
                    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 border border-blue-200 font-heading font-bold uppercase tracking-wide">
                      1 Type en commun
                    </span>
                  ) : null}

                  {proximityResult.hasSameGeneration && (
                    <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 border border-yellow-200 font-heading font-bold uppercase tracking-wide">
                      Même Génération
                    </span>
                  )}

                  {proximityResult.isInSameEvolutionChain && (
                    <span className="inline-flex items-center bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 border border-purple-200 font-heading font-bold uppercase tracking-wide">
                      Même Famille
                    </span>
                  )}
                </div>
              )}
            </div>
          </SubCard>
        </div>
      )}

      {/* Card de réponse */}
      <Card pokeballColor={colors.brand.white} pokeballOpacity={0} showHeader={true} overflowVisible>
        <div className="p-4 md:p-6">
          <h3
            className="font-heading text-center text-xl tracking-wide mb-6"
            style={{ color: colors.brand.blue }}
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
