import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Card from '../components/primitives/Card'
import SubCard from '../components/primitives/SubCard'
import LobbyPage from '../components/game/LobbyPage'
import { colors } from '../design/colors'
import type { PartieDto } from '../types/partie'
import type { GameSettings } from '../types/lobby'

export type { GameSettings } from '../types/lobby'

const ALL_GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8]

const THEME = {
  primary: colors.brand.blue,
  primaryLight: colors.brand.blueLight,
  primaryDark: colors.brand.blueDark,
  textOnColor: '#ffffff',
  borderColor: colors.brand.blueDeep,
}

/**
 * Page de lobby PokéDesc.
 * Gère les paramètres de partie (nombre de Pokémon, générations, durée du timer)
 * et les transmet à `LobbyPage` via `settingsPanel` et `getSettings`.
 * Les paramètres précédents sont restaurés depuis `location.state` (retour depuis les résultats).
 */
export default function LobbyPokedescPage() {
  const location = useLocation()
  const previousSettings = (location.state as { previousSettings?: GameSettings } | null)?.previousSettings

  const [settings, setSettings] = useState<GameSettings>(
    previousSettings ?? { nbPokemons: 3, generations: [...ALL_GENERATIONS], timerDuration: 60 }
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
        <div style={{ fontSize: '1.25rem' }}>
          Face à toi, une description d'un pokémon s'affiche. Devine de quel pokémon il s'agit !{' '}
          <br /> Tu as le droit à 3 essais et des indices pour t'aider !
        </div>
      }
      settingsPanel={(isPlayer1, partie: PartieDto | null) => {
        const displayNb = isPlayer1 ? settings.nbPokemons : (partie?.nbPokemons ?? settings.nbPokemons)
        const displayGens = isPlayer1 ? settings.generations : (partie?.selectedGenerations ?? settings.generations)
        const displayTimer = isPlayer1 ? settings.timerDuration : (partie?.timerDurationSeconds ?? settings.timerDuration)
        
        return (
        <Card pokeballColor={colors.brand.blue}>
          <div className="p-3 sm:p-6">
            <div className="flex items-center gap-3 mb-3 sm:mb-6">
              <span className="text-xl">⚙️</span>
              <h3 className="font-heading text-xl tracking-wide" style={{ color: colors.ui.textPrimary, fontSize: '1.25rem' }}>
                Paramètres de la partie
              </h3>
              {!isPlayer1 && (
                <div className="ml-auto">
                  <SubCard
                    bodyColor="#f3f4f6"
                    borderColor="#d1d5db"
                    borderThickness="p-[2px]"
                    className="font-heading text-xs text-gray-400 px-2 py-1 flex items-center justify-center"
                    style={{ fontSize: '0.6rem' }}
                  >
                    Lecture seule
                  </SubCard>
                </div>
              )}
            </div>

            {/* Nombre de Pokémon */}
            <div className="mb-3 sm:mb-6">
              <label className="font-heading block text-sm font-medium mb-3" style={{ color: colors.ui.textMuted }}>
                Nombre de Pokémon à deviner :{' '}
                <span className="font-bold font-heading" style={{ color: colors.brand.blue }}>{displayNb}</span>
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => {
                  const active = displayNb === n
                  return (
                    <button
                      key={n}
                      onClick={() => isPlayer1 && setSettings((prev) => ({ ...prev, nbPokemons: n }))}
                      disabled={!isPlayer1}
                      className={`flex-1 transition ${!isPlayer1 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:-translate-y-0.5'}`}
                    >
                      <SubCard
                        bodyColor={active ? colors.brand.blue : '#ffffff'}
                        borderColor={active ? colors.brand.blueDark : '#e5e7eb'}
                        borderThickness="p-[2px]"
                        className="py-2 flex items-center justify-center w-full"
                      >
                        <span className="font-heading font-semibold text-sm" style={{ color: active ? '#ffffff' : colors.ui.textMuted }}>
                          {n}
                        </span>
                      </SubCard>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Durée du timer */}
            <div className="mb-3 sm:mb-6">
              <label className="font-heading block text-sm font-medium mb-3" style={{ color: colors.ui.textMuted }}>
                Durée du timer :{' '}
                <span className="font-bold" style={{ color: colors.brand.blue }}>
                  {displayTimer === -1 ? 'Infini' : `${displayTimer}s`}
                </span>
              </label>
              <div className="flex gap-2">
                {[30, 60, 120, -1].map((duration) => {
                  const active = displayTimer === duration
                  return (
                    <button
                      key={duration}
                      onClick={() => isPlayer1 && setSettings((prev) => ({ ...prev, timerDuration: duration }))}
                      disabled={!isPlayer1}
                      className={`flex-1 transition ${!isPlayer1 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:-translate-y-0.5'}`}
                    >
                      <SubCard
                        bodyColor={active ? colors.brand.blue : '#ffffff'}
                        borderColor={active ? colors.brand.blueDark : '#e5e7eb'}
                        borderThickness="p-[2px]"
                        className="py-2 flex items-center justify-center w-full"
                      >
                        <span className="font-heading font-semibold text-sm" style={{ color: active ? '#ffffff' : colors.ui.textMuted }}>
                          {duration === -1 ? '♾️' : `${duration}s`}
                        </span>
                      </SubCard>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Générations */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="font-heading text-sm font-medium" style={{ color: colors.ui.textMuted }}>Générations</label>
                {isPlayer1 && (
                  <div className="flex flex-wrap gap-1 justify-end">
                    <button
                      onClick={() => setSettings((prev) => ({ ...prev, generations: [...ALL_GENERATIONS] }))}
                      className="font-heading text-xs hover:underline"
                      style={{ color: colors.brand.blue, fontSize: '0.6rem' }}
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                {ALL_GENERATIONS.map((gen) => {
                  const active = displayGens.includes(gen)
                  return (
                    <button
                      key={gen}
                      onClick={() => isPlayer1 && toggleGeneration(gen)}
                      disabled={!isPlayer1}
                      className={`transition ${!isPlayer1 ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:-translate-y-0.5'}`}
                    >
                      <SubCard
                        bodyColor={active ? colors.brand.blue : '#ffffff'}
                        borderColor={active ? colors.brand.blueDark : '#e5e7eb'}
                        borderThickness="p-[2px]"
                        className="px-3 py-1.5 flex items-center justify-center w-full"
                      >
                        <span className="font-heading text-sm font-semibold" style={{ color: active ? '#ffffff' : colors.ui.textMuted }}>
                          Gén. {gen}
                        </span>
                      </SubCard>
                    </button>
                  )
                })}
              </div>
              {displayGens.length < ALL_GENERATIONS.length && (
                <p className="font-heading text-xs mt-2" style={{ color: colors.ui.textMuted }}>
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