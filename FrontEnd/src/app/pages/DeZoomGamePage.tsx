import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useBackgroundStore } from '../store/backgroundStore'
import { useChatStore } from '../store/chatStore'
import { colors } from '../design/colors'
import Card from '../components/Card'
import PixelButton from '../components/PixelButton'
import SubCard from '../components/SubCard'
import PokemonSearchInput from '../components/PokemonSearchInput'
import Timer from '../components/Timer'
import { getDeZoomGame, submitDeZoomGuess } from '../services/dezoomService'
import { getAllPokemons } from '../services/pokemonService'
import { getPartie } from '../services/partieService'
import type { PokemonDto } from '../types/pokemon'
import type { DeZoomGameDto } from '../types/dezoom'

const ROMAN_GEN: Record<string, number> = {
  i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9,
}

function generationToNumber(nameEn: string): number | null {
  const match = nameEn.toLowerCase().match(/generation-([ivx]+)/)
  return match ? (ROMAN_GEN[match[1]] ?? null) : null
}

function formatGenerations(generations: number[], isShort: boolean = false): string {
  if (!generations || generations.length === 0) return ''
  const sorted = [...generations].sort((a, b) => a - b)
  const prefix = isShort ? 'Gén' : 'Générations'
  if (sorted.length === 9 && sorted[0] === 1 && sorted[8] === 9) return 'Toutes générations'
  let isConsecutive = true
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] !== sorted[i - 1] + 1) { isConsecutive = false; break }
  }
  if (isConsecutive) return `${prefix} ${sorted[0]}-${sorted[sorted.length - 1]}`
  return `${prefix} ${sorted.join(',')}`
}

const DISPLAY_SCALE = 4
const SPRITE_DISPLAY = 96 * DISPLAY_SCALE // 384px
const WINDOW_STEPS = [16, 24, 32, 48, 96] // tailles en px sprite

export default function DeZoomGamePage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
  const { setBackground } = useBackgroundStore()
  const { setContext: setChatContext } = useChatStore()

  useEffect(() => {
    setBackground({
      colorLeft: colors.ui.bgLeftGame,
      colorStripe: colors.brand.redDark,
      colorRight: colors.brand.red,
    })
  }, [])

  const [game, setGame] = useState<DeZoomGameDto | null>(null)
  const [pokemons, setPokemons] = useState<PokemonDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionCode, setSessionCode] = useState('')
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([])

  const [stepIndex, setStepIndex] = useState(0)
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDto | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType1, setFilterType1] = useState('')
  const [filterType2, setFilterType2] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wrongMessage, setWrongMessage] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Pokemons filtrés par générations actives (lobby settings)
  const generationFilteredPokemons = selectedGenerations.length > 0
    ? pokemons.filter((p) => {
        const genNumber = p.generation?.nameEn ? generationToNumber(p.generation.nameEn) : null
        return genNumber !== null && selectedGenerations.includes(genNumber)
      })
    : pokemons

  // Listes dédupliquées pour les filtres de type
  const allTypes = [...new Set(
    generationFilteredPokemons.flatMap(p => p.types ?? []).map(t => t.name)
  )].sort((a, b) => a.localeCompare(b)).map((t, i) => ({ id: i, nameFr: t }))

  const filteredPokemons = generationFilteredPokemons.filter((p) => {
    if (searchTerm.trim() && !p.nameFr.toLowerCase().includes(searchTerm.toLowerCase())) return false
    if (filterType1 && p.types?.find(t => t.slot === 1)?.name !== filterType1) return false
    if (filterType2) {
      const slot2 = p.types?.find(t => t.slot === 2)?.name
      if (slot2 !== filterType2) return false
    }
    return true
  })

  useEffect(() => {
    if (!partieId) return
    setIsLoading(true)
    ;(async () => {
      try {
        const [g, pkms] = await Promise.all([getDeZoomGame(partieId, sessionId), getAllPokemons()])
        setGame(g)
        setAttemptCount(g.attemptCount)
        setPokemons(pkms.sort((a, b) => a.nameFr.localeCompare(b.nameFr)))
        try {
          const p = await getPartie(partieId)
          setSessionCode(p.codeSession ?? 'N/A')
          if (p.selectedGenerations?.length > 0) {
            setSelectedGenerations(p.selectedGenerations)
          }
          setChatContext({
            partieId,
            sessionCode: p.codeSession ?? '',
            isSolo: !p.dresseur2Id,
          })
        } catch {
          setSessionCode('N/A')
        }
        timerRef.current = setInterval(() => setElapsed((prev) => prev + 1), 1000)
      } catch {
        setErrorMessage('Impossible de charger la partie.')
      } finally {
        setIsLoading(false)
      }
    })()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [partieId, sessionId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPokemon || isSubmitting || !game) return

    setIsSubmitting(true)
    setWrongMessage('')
    try {
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)
      const res = await submitDeZoomGuess(
        partieId!,
        sessionId,
        selectedPokemon.nameFr,
        elapsed,
        newAttemptCount,
      )

      if (res.isCorrect) {
        if (timerRef.current) clearInterval(timerRef.current)
        navigate(`/resultats-dezoom/${partieId}`, { state: { sessionCode } })
        return
      }

      const newStepIndex = Math.min(stepIndex + 1, WINDOW_STEPS.length - 1)
      setStepIndex(newStepIndex)
      setWrongMessage(res.message)
      setSelectedPokemon(null)
      setSearchTerm('')

      // Dernière étape : sprite entièrement révélé → naviguer après l'animation
      if (WINDOW_STEPS[newStepIndex] === 96) {
        if (timerRef.current) clearInterval(timerRef.current)
        setTimeout(() => {
          navigate(`/resultats-dezoom/${partieId}`, { state: { sessionCode } })
        }, 800)
      }
    } catch {
      setErrorMessage("Erreur lors de l'envoi de la réponse.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-xl border-2 border-red-500 shadow-sm p-12 text-center">
          <p className="text-red-600 font-medium mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate('/dezoom')}
            className="font-body font-semibold px-6 py-2.5 text-white rounded-xl hover:-translate-y-0.5 transition"
            style={{ backgroundColor: colors.brand.red }}
          >
            Retour au menu
          </button>
        </div>
      </div>
    )
  }

  if (!game) return null

  const windowSpritePx = WINDOW_STEPS[stepIndex]
  const windowDisplayPx = windowSpritePx * DISPLAY_SCALE
  const windowOffset = ((96 - windowSpritePx) / 2) * DISPLAY_SCALE

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 text-gray-900">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* LEFT: Header + Response */}
        <div className="md:col-span-1">
          <Card
            headerColor={colors.brand.red}
            headerClassName="py-4"
            header={
              <h1 className="font-heading text-xl md:text-2xl tracking-wide" style={{ color: '#ffffff' }}>
                DéZoom
              </h1>
            }
            pokeballOpacity={0}
            pokeballColor="white"
          >
            <div className="p-4 md:p-6 flex flex-col items-center gap-4">
              <p className="font-heading text-sm text-center text-gray-500">
                Identifie le Pokémon caché. Chaque mauvaise réponse révèle un peu plus !
              </p>
              <div className="flex flex-wrap gap-6 justify-center items-end">
                <div className="text-center">
                  <div className="font-heading text-xs text-gray-500 uppercase tracking-wide">Code</div>
                  <div className="font-heading font-semibold" style={{ color: colors.ui.textPrimary }}>{sessionCode}</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-xs text-gray-500 uppercase tracking-wide">Tentatives</div>
                  <div className="font-heading font-semibold" style={{ color: colors.ui.textPrimary }}>{attemptCount}</div>
                </div>
                <div className="text-center">
                  <div className="font-heading text-xs text-gray-500 uppercase tracking-wide">Temps</div>
                  <Timer value={elapsed} mode="stopwatch" />
                </div>
              </div>
              {selectedGenerations.length > 0 && selectedGenerations.length < 9 && (
                <p className="font-heading text-xs" style={{ color: colors.ui.textMuted }}>
                  {formatGenerations(selectedGenerations)}
                </p>
              )}
            </div>
          </Card>

          <Card
            pokeballOpacity={0}
            headerColor={colors.brand.red}
            headerClassName="py-4"
            header={
              <h1 className="font-heading text-xl md:text-2xl tracking-wide" style={{ color: '#ffffff' }}>
                Ta réponse
              </h1>
            }
            className="mt-4"
          >
            <div className="p-4 md:p-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                {wrongMessage && (
                  <p className="font-body text-red-600 text-sm">{wrongMessage}</p>
                )}

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
                  disabled={isSubmitting || !selectedPokemon}
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
                <p className="font-body text-xs font-semibold text-gray-400 uppercase tracking-wide">Filtres</p>

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
                    className="font-body text-xs text-gray-400 hover:text-red-500 transition"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* RIGHT: Sprite avec masque */}
        <div className="md:col-span-2">
          <Card
            pokeballOpacity={0}
            headerColor={colors.brand.red}
            headerClassName="py-4"
            header={
              <h1 className="font-heading text-xl md:text-2xl tracking-wide" style={{ color: '#ffffff' }}>
                Quel est ce Pokémon ?
              </h1>
            }
          >
            <div className="p-6 flex flex-col items-center justify-center gap-4">
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
                  src={game.spriteUrl}
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
                    boxShadow: '0 0 0 500px white',
                    transition: 'left 0.3s ease, top 0.3s ease, width 0.3s ease, height 0.3s ease',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              <p className="font-body text-sm text-gray-400">
                Fenêtre visible : {windowSpritePx}×{windowSpritePx} px
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
