import { useState } from 'react'
import { useLocation } from 'react-router'
import Card from '../components/Card'
import SubCard from '../components/SubCard'
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
  borderColor: colors.brand.redDeep,
}

export default function LobbyDeZoomPage() {
  const location = useLocation()
  const previousSettings = (location.state as { previousSettings?: GameSettings } | null)?.previousSettings

  const [settings, setSettings] = useState<GameSettings>({
    nbPokemons: previousSettings?.nbPokemons ?? 1,
    generations: previousSettings?.generations ?? [...ALL_GENERATIONS],
    timerDuration: previousSettings?.timerDuration ?? 60,
  })

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
        <span style={{ fontSize: '1.25rem' }}>
          Un sprite Pokémon s'affiche, très zoomé. <br /> Identifie de quel Pokémon il s'agit !{' '}
          <br />
          <br /> Chaque mauvaise réponse agrandit la zone visible.
        </span>
      }
      settingsPanel={(isPlayer1, partie: PartieDto | null) => {
        const displayGens = isPlayer1 ? settings.generations : (partie?.selectedGenerations ?? settings.generations)
        return (
          <Card pokeballColor={colors.brand.red}>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-5">
                <span className="text-xl">⚙️</span>
                <h3 className="font-heading text-xl tracking-wide" style={{ color: colors.ui.textPrimary, fontSize: '1.25rem' }}>
                  Paramètres de la partie
                </h3>
                {!isPlayer1 && (
                  <span className="ml-auto font-body text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                    Lecture seule
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="font-heading text-sm font-medium" style={{ color: colors.ui.textMuted }}>Générations</span>
                {isPlayer1 && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, generations: [...ALL_GENERATIONS] }))}
                      className="font-heading text-xs hover:underline"
                      style={{ color: colors.brand.red, fontSize: '0.6rem' }}
                    >
                      Tout sélectionner
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, generations: [prev.generations[0]] }))}
                      className="font-heading text-xs text-gray-500 hover:underline"
                      style={{ fontSize: '0.6rem' }}
                    >
                      Tout désélectionner
                    </button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-2">
                {ALL_GENERATIONS.map((gen) => {
                  const active = displayGens.includes(gen)
                  return (
                    <SubCard
                      key={gen}
                      onClick={() => isPlayer1 && toggleGeneration(gen)}
                      bodyColor={active ? colors.brand.red : '#ffffff'}
                      borderColor={active ? colors.brand.redDark : '#e5e7eb'}
                      className={`p-2 text-center ${isPlayer1 ? 'hover:-translate-y-0.5 transition cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                    >
                      <span
                        className="font-heading text-sm font-semibold"
                        style={{ color: active ? '#ffffff' : colors.ui.textMuted }}
                      >
                        Gén. {gen}
                      </span>
                    </SubCard>
                  )
                })}
              </div>

              {displayGens.length < ALL_GENERATIONS.length && (
                <p className="font-heading text-xs mt-3" style={{ color: colors.ui.textMuted }}>
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
