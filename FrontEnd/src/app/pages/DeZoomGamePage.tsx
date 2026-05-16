import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { colors } from '../design/colors'
import Card from '../components/Card'
import GameHeader from '../components/GameHeader'
import GameLayout from '../components/GameLayout'
import PixelButton from '../components/PixelButton'
import SubCard from '../components/SubCard'
import PokemonSearchInput from '../components/PokemonSearchInput'
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

const DISPLAY_SCALE = 4
const SPRITE_DISPLAY = 96 * DISPLAY_SCALE // 384px
const WINDOW_STEPS = [16, 24, 32, 96] // tailles en px sprite (3 étapes = 3 tentatives)

export default function DeZoomGamePage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const { sessionId } = useSessionStore()
  const { setContext: setChatContext } = useChatStore()

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

      // 3ème mauvaise tentative → naviguer après l'animation
      if (newAttemptCount >= 3) {
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

  if (!game && !isLoading && !errorMessage) return null

  const windowSpritePx = WINDOW_STEPS[stepIndex]
  const windowDisplayPx = windowSpritePx * DISPLAY_SCALE
  const windowOffset = ((96 - windowSpritePx) / 2) * DISPLAY_SCALE

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
