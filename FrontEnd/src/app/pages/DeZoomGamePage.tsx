import { useParams, useNavigate } from 'react-router-dom'
import { colors } from '../design/colors'
import { useDeZoomGame, SPRITE_DISPLAY } from '../logic/useDeZoomGame'
import Card from '../components/Card'
import GameHeader from '../components/GameHeader'
import GameLayout from '../components/GameLayout'
import PixelButton from '../components/PixelButton'
import SubCard from '../components/SubCard'
import PokemonSearchInput from '../components/PokemonSearchInput'

export default function DeZoomGamePage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()

  const {
    game,
    isLoading,
    errorMessage,
    selectedGenerations,
    selectedPokemon,
    searchTerm,
    filterType1,
    filterType2,
    isSubmitting,
    wrongMessage,
    elapsed,
    attemptCount,
    allTypes,
    filteredPokemons,
    windowDisplayPx,
    windowOffset,
    handleSubmit,
    setSelectedPokemon,
    setSearchTerm,
    setFilterType1,
    setFilterType2,
  } = useDeZoomGame(partieId)

  if (!game && !isLoading && !errorMessage) return null

  return (
    <GameLayout
      columns="1+2"
      isLoading={isLoading}
      error={errorMessage}
      onErrorBack={() => navigate('/dezoom')}
      errorBackLabel="Retour au menu"
      errorBackColor={colors.brand.red}
      header={
        <GameHeader
          title="DEX-ZOOM : Devine le Pokémon !"
          color={colors.brand.red}
          attemptsUsed={attemptCount}
          elapsed={elapsed}
          selectedGenerations={selectedGenerations}
        />
      }
      left={
        <>
          <Card
            pokeballOpacity={0}
            showHeader={false}
          >
            <div className="p-4 md:p-6 space-y-4">
              <h1 className="font-heading text-center text-xl md:text-2xl tracking-wide" style={{ color: colors.brand.redDark, fontSize: '1.25rem' }}>
                Réponse
              </h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                {selectedPokemon ? (
                  <SubCard borderColor={colors.brand.redDeep} bodyColor={colors.brand.white} className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-heading text-gray-400 text-sm min-w-[48px]">#{selectedPokemon.pokedexNumber}</span>
                      <span className="font-heading font-medium text-gray-900">{selectedPokemon.nameFr}</span>
                      <button
                        type="button"
                        onClick={() => { setSelectedPokemon(null); setSearchTerm('') }}
                        className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none"
                        aria-label="Effacer"
                      >×</button>
                    </div>
                  </SubCard>
                ) : (
                  <PokemonSearchInput
                    items={filteredPokemons}
                    value={searchTerm}
                    onChange={setSearchTerm}
                    onSelect={(p) => { setSelectedPokemon(p); setSearchTerm(p.nameFr) }}
                    placeholder="Rechercher un Pokémon..."
                  />
                )}

                <PixelButton
                  type="submit"
                  disabled={isSubmitting || !selectedPokemon || attemptCount >= 3}
                  color={colors.brand.red}
                  colorLight={colors.brand.redLight}
                  colorDark={colors.brand.redDark}
                  colorBorder={colors.brand.redDeep}
                  className="h-12 w-full"
                >
                  <span className="font-heading font-semibold text-white">
                    {isSubmitting ? 'Vérification...' : 'Valider'}
                  </span>
                </PixelButton>
              </form>

              {/* Filtres */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="font-heading text-xs font-semibold text-gray-400 uppercase tracking-wide">Filtres</p>

                <div className="flex gap-2">
                  <PokemonSearchInput
                    items={allTypes}
                    value={filterType1}
                    onChange={setFilterType1}
                    onSelect={(t) => { setFilterType1(t.nameFr); setSelectedPokemon(null); setSearchTerm('') }}
                    placeholder="Type 1"
                  />

                  <PokemonSearchInput
                    items={allTypes}
                    value={filterType2}
                    onChange={setFilterType2}
                    onSelect={(t) => { setFilterType2(t.nameFr); setSelectedPokemon(null); setSearchTerm('') }}
                    placeholder="Type 2"
                  />
                </div>

                {(filterType1 || filterType2) && (
                  <button
                    type="button"
                    onClick={() => { setFilterType1(''); setFilterType2('') }}
                    className="font-heading text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            </div>
          </Card>
        </>
      }
      right={
        <Card
          pokeballOpacity={0}
          showHeader={false}
        >
          <div className="p-6 flex flex-col items-center justify-center gap-4">

            <h1 className="font-heading text-xl md:text-2xl tracking-wide" style={{ color: colors.brand.redDark, fontSize: '1.25rem' }}>
              Quel est ce Pokémon ?
            </h1>
              <div
                style={{
                  position: 'relative',
                  width: SPRITE_DISPLAY,
                  height: SPRITE_DISPLAY,
                  flexShrink: 0,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={game?.spriteUrl ?? ''}
                  alt="Pokémon mystère"
                  draggable={false}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: SPRITE_DISPLAY,
                    height: SPRITE_DISPLAY,
                    imageRendering: 'pixelated',
                  }}
                />

                <div
                  style={{
                    position: 'absolute',
                    left: windowOffset,
                    top: windowOffset,
                    width: windowDisplayPx,
                    height: windowDisplayPx,
                    border: '2px solid red',
                    boxShadow: '0 0 0 500px' + colors.brand.white ,
                    transition: 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease',
                    pointerEvents: 'none',
                  }}
                />
              </div>

            </div>
          </Card>
      }
    />
  )
}
