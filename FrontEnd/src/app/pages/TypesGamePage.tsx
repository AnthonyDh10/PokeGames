import { useParams, useNavigate } from 'react-router-dom'
import { colors } from '../design/colors'
import { useTypesGame } from '../logic/useTypesGame'
import Card from '../components/Card'
import PixelButton from '../components/PixelButton'
import SubCard from '../components/SubCard'
import PokemonSearchInput from '../components/PokemonSearchInput'
import GameLayout from '../components/GameLayout'
import GameHeader from '../components/GameHeader'
import acierImg from '../components/images/acier.png'
import combatImg from '../components/images/combat.png'
import dragonImg from '../components/images/dragon.png'
import eauImg from '../components/images/eau.png'
import électrikImg from '../components/images/électrik.png'
import féeImg from '../components/images/fée.png'
import feuImg from '../components/images/feu.png'
import glaceImg from '../components/images/glace.png'
import insecteImg from '../components/images/insecte.png'
import normalImg from '../components/images/normal.png'
import planteImg from '../components/images/plante.png'
import poisonImg from '../components/images/poison.png'
import psyImg from '../components/images/psy.png'
import rocheImg from '../components/images/roche.png'
import solImg from '../components/images/sol.png'
import spectreImg from '../components/images/spectre.png'
import ténèbresImg from '../components/images/ténèbres.png'
import volImg from '../components/images/vol.png'

const TYPE_IMAGES: Record<string, string> = {
  acier: acierImg, combat: combatImg, dragon: dragonImg, eau: eauImg,
  électrik: électrikImg, fée: féeImg, feu: feuImg, glace: glaceImg,
  insecte: insecteImg, normal: normalImg, plante: planteImg, poison: poisonImg,
  psy: psyImg, roche: rocheImg, sol: solImg, spectre: spectreImg,
  ténèbres: ténèbresImg, vol: volImg,
}

function TypeImage({ name, className = 'h-7' }: { name: string; className?: string }) {
  const src = TYPE_IMAGES[name.toLowerCase()]
  return src
    ? <img src={src} alt={name} className={`${className} object-contain`} />
    : <span className="font-body text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-700">{name}</span>
}

const INTERACTION_LABELS: Record<string, string> = {
  'x4': 'Faiblesse x4',
  'x2': 'Faiblesse x2',
  'x1': 'Dégâts normaux x1',
  'x0.5': 'Résistance x0.5',
  'x0.25': 'Double résistance x0.25',
  'x0': 'Immunité x0',
}

const INTERACTION_ORDER = ['x4', 'x2', 'x1', 'x0.5', 'x0.25', 'x0']

export default function TypesGamePage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()

  const {
    game,
    isLoading,
    errorMessage,
    selectedType1,
    searchTerm1,
    selectedType2,
    searchTerm2,
    isSubmitting,
    elapsed,
    attemptCount,
    filteredTypes1,
    filteredTypes2,
    handleSubmit,
    setSelectedType1,
    setSearchTerm1,
    setSelectedType2,
    setSearchTerm2,
  } = useTypesGame(partieId)

  if (!game && !isLoading && !errorMessage) return null

  return (
    <GameLayout
      columns="1+2"
      isLoading={isLoading}
      error={errorMessage}
      onErrorBack={() => navigate('/types')}
      errorBackLabel="Retour au menu"
      errorBackColor={colors.brand.yellow}
      header={
        <GameHeader
          title={<span style={{ color: colors.ui.textMuted }}>TYPUZZLE : Devine la paire de types !</span>}
          color={colors.brand.yellow}
          attemptsUsed={attemptCount}
          elapsed={elapsed}
        />
      }
      left={
        <>
          <Card
            pokeballOpacity={0}
            showHeader={false}
            >
            <div className="p-4 md:p-6">

              <h1 className="font-heading text-center text-xl md:text-2xl tracking-wide" style={{ color: colors.brand.yellowDark, fontSize: '1.25rem' }}>
                Réponse
              </h1>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="font-heading text-sm font-medium text-gray-600 block mt-4 mb-1">
                      Type 1
                    </label>
                    {selectedType1 ? (
                      <SubCard borderColor={colors.brand.yellowDark} bodyColor={colors.brand.white} className="px-3 py-2">

                        <div className="flex items-center gap-2">
                          <TypeImage name={selectedType1.nameFr} className="h-7" />
                          <button
                            type="button"
                            onClick={() => { setSelectedType1(null); setSearchTerm1('') }}
                            className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none"
                            aria-label="Effacer"
                          >×</button>
                        </div>
                      </SubCard>
                    ) : (
                      <PokemonSearchInput
                        items={filteredTypes1}
                        value={searchTerm1}
                        onChange={setSearchTerm1}
                        onSelect={(t) => { setSelectedType1(t); setSearchTerm1(t.nameFr) }}
                        placeholder="Rechercher un type..."
                      />
                    )}
                  </div>

                  <div>
                    <label className="font-heading text-sm font-medium text-gray-600 block mt-4 mb-1">
                      Type 2
                    </label>
                    {selectedType2 ? (
                      <SubCard borderColor={colors.brand.yellowDark} bodyColor={colors.brand.white} className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <TypeImage name={selectedType2.nameFr} className="h-7" />
                          <button
                            type="button"
                            onClick={() => { setSelectedType2(null); setSearchTerm2('') }}
                            className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none"
                            aria-label="Effacer"
                          >×</button>
                        </div>
                      </SubCard>
                    ) : (
                      <PokemonSearchInput
                        items={filteredTypes2}
                        value={searchTerm2}
                        onChange={setSearchTerm2}
                        onSelect={(t) => { setSelectedType2(t); setSearchTerm2(t.nameFr) }}
                        placeholder="Rechercher un type..."
                      />
                    )}
                  </div>
                </div>

                <PixelButton
                  type="submit"
                  disabled={isSubmitting || !selectedType1 || !selectedType2 || attemptCount >= 3}
                  color={colors.brand.yellow}
                  colorLight={colors.brand.yellowLight}
                  colorDark={colors.brand.yellowWarm}
                  colorBorder={colors.brand.yellowDark}
                  className="h-12 w-full"
                >
                  <span className="font-heading font-semibold" style={{ color: colors.ui.textPrimary }}>
                    {isSubmitting ? 'Vérification...' : 'Valider'}
                  </span>
                </PixelButton>

              </form>
            </div>
          </Card>
        </>
      }
      right={
        <Card
          pokeballOpacity={0}
          showHeader={false}
        >
          <div className="p-4 md:p-6">
            <h1 className="font-heading text-center text-xl md:text-2xl tracking-wide mb-4" style={{ color: colors.brand.yellowDark, fontSize: '1.25rem' }}>
              Interactions défensives
            </h1>
            <div className="grid grid-cols-1 gap-4">
              {INTERACTION_ORDER.map((key) => {
                const typeNames = game?.interactions[key] ?? []
                if (typeNames.length === 0) return null
                return (
                  <SubCard key={key} borderColor={colors.brand.yellowDark} bodyColor={colors.brand.white} className="p-3">
                    <h3 className="font-heading font-semibold text-sm mb-2" style={{ color: colors.ui.textMuted }}>
                      {INTERACTION_LABELS[key]}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {typeNames.map((name) => (
                        <TypeImage key={name} name={name} />
                      ))}
                    </div>
                  </SubCard>
                )
              })}
            </div>
          </div>
        </Card>
      }
    />
  )
}
