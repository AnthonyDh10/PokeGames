import { useState } from 'react'
import { useLocation } from 'react-router'
import Card from '../components/Card'
import LobbyPage from '../components/LobbyPage'
import { colors } from '../design/colors'
import type { PartieDto } from '../types/partie'

const ALL_GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8]

export interface GameSettings {
  nbPokemons: number
  generations: number[]
}

const THEME = {
  primary: colors.brand.blue,
  primaryLight: colors.brand.blueLight,
  primaryDark: colors.brand.blueDark,
  textOnColor: '#ffffff',
  background: {
    colorLeft: colors.brand.white,
    colorStripe: colors.brand.blueDark,
    colorRight: colors.brand.blue,
  },
}

export default function LobbyPokedescPage() {
  const location = useLocation()
  const previousSettings = (location.state as { previousSettings?: GameSettings } | null)?.previousSettings

  const [settings, setSettings] = useState<GameSettings>(
    previousSettings ?? { nbPokemons: 1, generations: [...ALL_GENERATIONS] }
  )

  function toggleGeneration(gen: number) {
    setSettings((prev) => {
      const has = prev.generations.includes(gen)
      if (has && prev.generations.length === 1) return prev
      return {
        ...prev,
        generations: has ? prev.generations.filter((g) => g !== gen) : [...prev.generations, gen].sort((a, b) => a - b),
      }
    })
  }

  return (
    <LobbyPage
      gameRoute="/pokedesc"
      theme={THEME}
      explanationText={
        <>
          Face à toi, une description d'un pokémon s'affiche. Devine de quel pokémon il s'agit !{' '}
          <br /> Tu as le droit à 3 essais et des indices pour t'aider !
        </>
      }
      settingsPanel={(isPlayer1, partie: PartieDto | null) => {
        const displayNb = isPlayer1 ? settings.nbPokemons : (partie?.nbPokemons ?? settings.nbPokemons)
        const displayGens = isPlayer1 ? settings.generations : (partie?.selectedGenerations ?? settings.generations)
        return (
        <Card pokeballColor={colors.brand.blue}>
          <div className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">⚙️</span>
              <h3 className="font-display text-2xl tracking-wide" style={{ color: colors.ui.textPrimary }}>
                Paramètres de la partie
              </h3>
              {!isPlayer1 && (
                <span className="ml-auto font-body text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Lecture seule
                </span>
              )}
            </div>

            {/* Nombre de Pokémon */}
            <div className="mb-6">
              <label className="font-body block text-sm font-medium mb-3" style={{ color: colors.ui.textMuted }}>
                Nombre de Pokémon à deviner :{' '}
                <span className="font-bold" style={{ color: colors.brand.blue }}>{displayNb}</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <button
                    key={n}
                    onClick={() => isPlayer1 && setSettings((prev) => ({ ...prev, nbPokemons: n }))}
                    disabled={!isPlayer1}
                    className={`flex-1 py-2 rounded-xl font-body font-semibold text-sm border-2 transition ${!isPlayer1 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                    style={
                      displayNb === n
                        ? { backgroundColor: colors.brand.blue, color: '#fff', borderColor: colors.brand.blue }
                        : { backgroundColor: '#fff', color: colors.ui.textMuted, borderColor: '#e5e7eb' }
                    }
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Générations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-body text-sm font-medium" style={{ color: colors.ui.textMuted }}>Générations</label>
                {isPlayer1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, generations: [...ALL_GENERATIONS] }))}
                      className="font-body text-xs hover:underline"
                      style={{ color: colors.brand.blue }}
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, generations: [prev.generations[0]] }))}
                      className="font-body text-xs text-gray-500 hover:underline"
                    >
                      Tout désélectionner
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {ALL_GENERATIONS.map((gen) => {
                  const active = displayGens.includes(gen)
                  return (
                    <button
                      key={gen}
                      onClick={() => isPlayer1 && toggleGeneration(gen)}
                      disabled={!isPlayer1}
                      className={`px-3 py-1.5 rounded-lg font-body text-sm font-semibold border-2 transition ${!isPlayer1 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                      style={
                        active
                          ? { backgroundColor: colors.brand.blue, color: '#fff', borderColor: colors.brand.blue }
                          : { backgroundColor: '#fff', color: colors.ui.textMuted, borderColor: '#e5e7eb' }
                      }
                    >
                      Gén. {gen}
                    </button>
                  )
                })}
              </div>
              {displayGens.length < ALL_GENERATIONS.length && (
                <p className="font-body text-xs mt-2" style={{ color: colors.ui.textMuted }}>
                  {displayGens.length} génération{displayGens.length > 1 ? 's' : ''} sélectionnée{displayGens.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        </Card>
        )
      }}
      getSettings={() => settings}
    />
  )
}
