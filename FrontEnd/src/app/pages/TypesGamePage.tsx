import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useBackgroundStore } from '../store/backgroundStore'
import { useChatStore } from '../store/chatStore'
import { colors } from '../design/colors'
import Card from '../components/Card'
import PokemonSearchInput from '../components/PokemonSearchInput'
import Timer from '../components/Timer'
import { getAllTypes, getTypesGame, submitTypesGuess } from '../services/typesGameService'
import { getPartie } from '../services/partieService'
import type { TypeSimpleDto, TypesGameDto, TypesGuessResultDto } from '../types/typesGame'
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
  const { sessionId } = useSessionStore()
  const { setBackground } = useBackgroundStore()
  const { setContext: setChatContext } = useChatStore()

  useEffect(() => {
    setBackground({
      colorLeft: colors.ui.bgLeftGame,
      colorStripe: colors.brand.yellowWarm,
      colorRight: colors.brand.yellow,
    })
  }, [])

  const [types, setTypes] = useState<TypeSimpleDto[]>([])
  const [game, setGame] = useState<TypesGameDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [sessionCode, setSessionCode] = useState('')

  const [selectedType1, setSelectedType1] = useState<TypeSimpleDto | null>(null)
  const [searchTerm1, setSearchTerm1] = useState('')
  const [selectedType2, setSelectedType2] = useState<TypeSimpleDto | null>(null)
  const [searchTerm2, setSearchTerm2] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<TypesGuessResultDto | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [attemptCount, setAttemptCount] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const filteredTypes1 = types.filter((t) =>
    !searchTerm1.trim() || t.nameFr.toLowerCase().includes(searchTerm1.toLowerCase())
  )
  const filteredTypes2 = types.filter((t) =>
    !searchTerm2.trim() || t.nameFr.toLowerCase().includes(searchTerm2.toLowerCase())
  )

  useEffect(() => {
    if (!partieId) return
    setIsLoading(true)
    ;(async () => {
      try {
        const [t, g] = await Promise.all([getAllTypes(), getTypesGame(partieId, sessionId)])
        setTypes(t.sort((a, b) => a.nameFr.localeCompare(b.nameFr)))
        setGame(g)
        // Try to get partie for session code, but don't fail if it doesn't exist (rematch case)
        try {
          const p = await getPartie(partieId)
          setSessionCode(p.codeSession ?? 'N/A')
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
    if (!selectedType1 || isSubmitting) return

    const t2 = game?.isMono ? undefined : selectedType2?.id

    setIsSubmitting(true)
    try {
      const newAttemptCount = attemptCount + 1
      setAttemptCount(newAttemptCount)
      const res = await submitTypesGuess(
        partieId!,
        sessionId,
        selectedType1.id,
        t2,
        elapsed,
        newAttemptCount,
      )
      if (res.isCorrect) {
        if (timerRef.current) clearInterval(timerRef.current)
        navigate(`/resultats-types/${partieId}`, { state: { sessionCode } })
        return
      }
      setResult(res)
    } catch {
      setErrorMessage("Erreur lors de l'envoi de la réponse.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white border border-gray-200 shadow-px-sm p-12 text-center">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white border-2 border-red-500 shadow-px-sm p-12 text-center">
          <p className="text-red-600 font-medium mb-4">{errorMessage}</p>
          <button
            onClick={() => navigate('/types')}
            className="font-body font-semibold px-6 py-2.5 text-white rounded hover:-translate-y-0.5 transition"
            style={{ backgroundColor: colors.brand.yellow }}
          >
            Retour au menu
          </button>
        </div>
      </div>
    )
  }

  if (!game) return null

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 text-gray-900">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {/* RIGHT: Header + Response */}
        <div className="md:col-span-1">
          {/* Header */}
          <Card
            headerColor={colors.brand.yellow}
            headerClassName="py-4"
            header={
              <h1 className="font-heading text-xl md:text-2xl tracking-wide" style={{ color: colors.ui.textPrimary }}>
                Quel est ce type ?{game.isMono ? '' : ' (paire)'}
              </h1>
            }
            pokeballOpacity={0}
            pokeballColor="white"
          >
            <div className="p-4 text-center font-body text-sm space-y-2">
              <p className="text-gray-500">
                {game.isMono
                  ? 'Devine le type unique dont les interactions défensives sont affichées à droite.'
                  : 'Devine la paire de types dont les interactions défensives combinées sont affichées à droite.'}
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-gray-500">
                <span><span className="grayscale opacity-60">🎯</span> Code : {sessionCode}</span>
                <span className="font-semibold text-gray-700"><span className="grayscale opacity-60">🎲</span> Tentatives : {attemptCount} </span>
                <br/><Timer value={elapsed} mode="stopwatch" />
              </div>
            </div>
          </Card>

          {/* Response Form */}
          <Card
            pokeballOpacity={0}
            headerColor={colors.brand.yellow}
            headerClassName="py-4"
            header={
              <h1 className="font-heading text-xl md:text-2xl tracking-wide" style={{ color: colors.ui.textPrimary }}>
                Ta réponse
              </h1>
            }
            className="mt-4"
          >
            <div className="p-4 md:p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                  {result && !result.isCorrect && (
                    <p className="font-body text-red-600 text-sm">{result.message}</p>
                  )}

                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="font-body text-sm font-medium text-gray-600 block mb-1">
                        {game.isMono ? 'Type' : 'Type 1'}
                      </label>
                      {selectedType1 ? (
                        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl">
                          <TypeImage name={selectedType1.nameFr} className="h-7" />
                          <button
                            type="button"
                            onClick={() => { setSelectedType1(null); setSearchTerm1('') }}
                            className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none"
                            aria-label="Effacer"
                          >×</button>
                        </div>
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

                    {!game.isMono && (
                      <div>
                        <label className="font-body text-sm font-medium text-gray-600 block mb-1">
                          Type 2
                        </label>
                        {selectedType2 ? (
                          <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-xl">
                            <TypeImage name={selectedType2.nameFr} className="h-7" />
                            <button
                              type="button"
                              onClick={() => { setSelectedType2(null); setSearchTerm2('') }}
                              className="ml-auto text-gray-400 hover:text-gray-600 text-lg leading-none"
                              aria-label="Effacer"
                            >×</button>
                          </div>
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
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedType1 || (!game.isMono && !selectedType2)}
                    className="font-body font-semibold px-6 py-2.5 rounded hover:-translate-y-0.5 hover:shadow-px-sm transition disabled:opacity-50 disabled:cursor-not-allowed text-white w-full"
                    style={{ backgroundColor: colors.brand.yellow }}
                  >
                    {isSubmitting ? 'Vérification...' : 'Valider'}
                  </button>
                </form>
            </div>
          </Card>
        </div>

        {/* RIGHT: Interactions */}
        <div className="md:col-span-2">
          <Card
            pokeballOpacity={0}
            headerColor={colors.brand.yellow}
            headerClassName="py-4"
            header={
              <h1 className="font-heading text-xl md:text-2xl tracking-wide" style={{ color: colors.ui.textPrimary }}>
                Interactions défensives
              </h1>
            }
          >
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-1 gap-4">
                {INTERACTION_ORDER.map((key) => {
                  const typeNames = game.interactions[key] ?? []
                  if (typeNames.length === 0) return null
                  return (
                    <div key={key} className="border border-gray-200 rounded-xl p-3">
                      <h3 className="font-body font-semibold text-sm mb-2" style={{ color: colors.ui.textMuted }}>
                        {INTERACTION_LABELS[key]}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {typeNames.map((name) => (
                          <TypeImage key={name} name={name} />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
