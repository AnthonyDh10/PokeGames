import { useState } from 'react'
import { useLocation } from 'react-router'
import Card from '../components/Card'
import LobbyPage from '../components/LobbyPage'
import { colors } from '../design/colors'
import type { PartieDto } from '../types/partie'
import type { GameSettings } from './LobbyPokedescPage'

const ALL_GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9]

const THEME = {
  primary: colors.brand.red,
  primaryLight: colors.brand.pokeballRed,
  primaryDark: colors.brand.redDark,
  textOnColor: '#ffffff',
  background: {
    colorLeft: colors.ui.bgLeftGame,
    colorStripe: colors.brand.redDark,
    colorRight: colors.brand.red,
  },
}

export default function LobbyDeZoomPage() {
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
      gameRoute="/dezoom"
      theme={THEME}
      startMode="DeZoom"
      explanationText={
        <>
          Un sprite Pokémon s'affiche, très zoomé. <br /> Identifie de quel Pokémon il s'agit !{' '}
          <br />
          <br /> Chaque mauvaise réponse agrandit la zone visible.
        </>
      }
      settingsPanel={(isPlayer1, partie: PartieDto | null) => {
        const displayGens = isPlayer1 ? settings.generations : (partie?.selectedGenerations ?? settings.generations)
        return (
          <Card pokeballColor={colors.brand.red}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl">⚙️</span>
                <h3 className="font-heading text-xl tracking-wide" style={{ color: colors.ui.textPrimary }}>
                  Générations
                </h3>
                {!isPlayer1 && (
                  <span className="ml-auto font-body text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    Lecture seule
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="font-body text-sm text-gray-400">Inclure dans la partie :</span>
                {isPlayer1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, generations: [...ALL_GENERATIONS] }))}
                      className="font-body text-xs hover:underline"
                      style={{ color: colors.brand.red }}
                    >
                      Tout
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, generations: [prev.generations[0]] }))}
                      className="font-body text-xs text-gray-500 hover:underline"
                    >
                      Une seule
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
                          ? { backgroundColor: colors.brand.red, color: '#fff', borderColor: colors.brand.red }
                          : { backgroundColor: '#fff', color: colors.ui.textMuted, borderColor: '#e5e7eb' }
                      }
                    >
                      Gén. {gen}
                    </button>
                  )
                })}
              </div>

              {displayGens.length < ALL_GENERATIONS.length && (
                <p className="font-body text-xs mt-3" style={{ color: colors.ui.textMuted }}>
                  {displayGens.length} génération{displayGens.length > 1 ? 's' : ''} sélectionnée{displayGens.length > 1 ? 's' : ''} sur {ALL_GENERATIONS.length}
                </p>
              )}
            </div>
          </Card>
        )
      }}
      getSettings={() => settings}
    />
  )
}
