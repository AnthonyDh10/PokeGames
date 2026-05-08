import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getTypesGameResults, markRematchReady } from '../services/typesGameService'
import { createPartie, startPartie } from '../services/partieService'
import GameResultsLayout from '../components/GameResultsLayout'
import ResultsActions from '../components/ResultsActions'
import Card from '../components/Card'
import { colors } from '../design/colors'
import type { TypesGameResultsDto } from '../types/typesGame'
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

const INTERACTION_LABELS: Record<string, string> = {
  'x4': 'Faiblesse x4',
  'x2': 'Faiblesse x2',
  'x1': 'Dégâts normaux x1',
  'x0.5': 'Résistance x0.5',
  'x0.25': 'Double résistance x0.25',
  'x0': 'Immunité x0',
}

const INTERACTION_ORDER = ['x4', 'x2', 'x1', 'x0.5', 'x0.25', 'x0']

function TypeImage({ name, className = 'h-8' }: { name: string; className?: string }) {
  const src = TYPE_IMAGES[name.toLowerCase()]
  return src
    ? <img src={src} alt={name} className={`${className} object-contain`} />
    : <span className="font-body text-xs px-2 py-0.5 rounded-full border border-gray-300 text-gray-700">{name}</span>
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function ResultatsTypesPage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, playerName } = useSessionStore()
  const state = location.state as { sessionCode?: string } | null
  const { setContext: setChatContext } = useChatStore()

  const [results, setResults] = useState<TypesGameResultsDto | null>(null)
  const [isSolo, setIsSolo] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [rematchRequested, setRematchRequested] = useState(false)
  const [isRelaunching, setIsRelaunching] = useState(false)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const rematchPollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function fetchResults() {
    if (!partieId) return
    try {
      const r = await getTypesGameResults(partieId)
      setResults(r)
      // Déduire si solo : solo si pas de player2
      const solo = !r.player2
      setIsSolo(solo)
      setChatContext({
        partieId,
        sessionCode: state?.sessionCode ?? '',
        isSolo: solo,
      })
      return { results: r, solo }
    } catch {
      setErrorMessage('Impossible de charger les résultats.')
      return null
    }
  }

  async function handleRematchClick() {
    if (!partieId) return
    setRematchRequested(true)
    try {
      const status = await markRematchReady(partieId, sessionId)
      if (status.rematchPartieId) {
        navigate(`/types/${status.rematchPartieId}`)
        return
      }
      // Poll for rematch status
      rematchPollRef.current = setInterval(async () => {
        try {
          const fresh = await markRematchReady(partieId, sessionId)
          if (fresh.rematchPartieId) {
            clearInterval(rematchPollRef.current!)
            navigate(`/types/${fresh.rematchPartieId}`)
          }
        } catch {
          // silent
        }
      }, 1000)
    } catch {
      setErrorMessage('Erreur lors de la demande de revanche.')
      setRematchRequested(false)
    }
  }

  async function handleRelaunchClick() {
    setIsRelaunching(true)
    try {
      const newPartie = await createPartie(sessionId)
      await startPartie(newPartie.id, true, { nbPokemons: 1, generations: [1, 2, 3, 4, 5, 6, 7, 8] }, 'Types')
      navigate(`/types/${newPartie.id}`)
    } catch {
      setErrorMessage('Erreur lors du relancement de la partie.')
      setIsRelaunching(false)
    }
  }

  async function handleNewGame() {
    setIsCreatingNew(true)
    try {
      const newPartie = await createPartie(sessionId)
      navigate('/types', { state: { existingPartieId: newPartie.id } })
    } catch {
      setErrorMessage('Erreur lors de la création de la partie.')
      setIsCreatingNew(false)
    }
  }

  useEffect(() => {
    return () => { if (rematchPollRef.current) clearInterval(rematchPollRef.current) }
  }, [])

  useEffect(() => {
    if (!partieId) return
    setIsLoading(true)
    fetchResults().then((data) => {
      setIsLoading(false)
      if (!data) return
      if (!data.solo && !data.results.bothFinished) {
        pollRef.current = setInterval(async () => {
          const fresh = await getTypesGameResults(partieId)
          setResults(fresh)
          if (fresh.bothFinished) {
            clearInterval(pollRef.current!)
          }
        }, 2000)
      }
    })
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [partieId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card className="text-center text-gray-500">
          <div className="p-12">Chargement des résultats...</div>
        </Card>
      </div>
    )
  }

  if (errorMessage || !results) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Card
          headerColor="#EF4444"
          headerClassName="py-3"
          header={<h3 className="font-heading text-base tracking-wide text-white">Erreur</h3>}
        >
          <div className="p-12 text-center">
            <p className="text-red-600 font-medium mb-4">{errorMessage || 'Erreur inconnue'}</p>
            <button
              onClick={() => navigate('/types')}
              className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded hover:-translate-y-0.5 transition"
            >
              Retour au menu
            </button>
          </div>
        </Card>
      </div>
    )
  }

  // Déterminer si le joueur courant est J1 ou J2
  const isPlayer1 = results.player1.dresseurId === sessionId
  const myResult = isPlayer1 ? results.player1 : (results.player2 ?? results.player1)
  const opponentResult = isPlayer1 ? results.player2 : results.player1

  const myName = playerName || 'Moi'
  const opponentName = 'Adversaire'

  // Déterminer le gagnant (temps le plus court)
  const iWon = !isSolo && results.bothFinished
    && myResult.elapsedSeconds !== undefined
    && opponentResult?.elapsedSeconds !== undefined
    && myResult.elapsedSeconds < opponentResult.elapsedSeconds
  const opponentWon = !isSolo && results.bothFinished
    && opponentResult?.elapsedSeconds !== undefined
    && myResult.elapsedSeconds !== undefined
    && opponentResult.elapsedSeconds < myResult.elapsedSeconds
  const isDraw = !isSolo && results.bothFinished && !iWon && !opponentWon

  const correctAnswer = results.correctType1NameFr
    ? (results.correctType2NameFr
      ? `${results.correctType1NameFr} / ${results.correctType2NameFr}`
      : results.correctType1NameFr)
    : null

  function PlayerCard({
    name,
    playerResult,
    isWinner,
    pending = false,
  }: {
    name: string
    playerResult: typeof myResult
    isWinner: boolean
    pending?: boolean
  }) {
    return (
      <Card
        headerColor={isWinner ? colors.brand.yellowWarm : colors.brand.yellowLight}
        pokeballColor={isWinner ? colors.brand.yellowWarm : colors.brand.yellowLight}
        headerClassName="py-3"
        header={
          <h2 className="font-heading text-lg tracking-wide" style={{ color: colors.ui.textPrimary }}>
            {name} {isWinner && (
              <span style={{ filter: 'grayscale(1)', marginLeft: '0.5rem' }}>
                👑
              </span>
            )}
          </h2>
        }
        className="flex-1 transition-all"
        style={{
          borderColor: isWinner ? colors.brand.white : undefined,
          boxShadow: isWinner ? `0 8px 24px ${colors.ui.textPrimary}40` : undefined,
        }}
      >
        <div className="p-6 flex flex-col h-full text-center">
          {pending && (
            <span
              className="mx-auto inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 animate-pulse border"
              style={{
                backgroundColor: `${colors.game.hint}1A`,
                color: colors.brand.yellowWarm,
                borderColor: colors.game.hint,
              }}
            >
              ⏳ En cours...
            </span>
          )}

          {playerResult.elapsedSeconds !== undefined ? (
            <>
              <div className="text-4xl font-bold my-2" style={{ color: colors.ui.textPrimary }}>
                {formatElapsed(playerResult.elapsedSeconds)}
              </div>
              <div className="flex gap-3 justify-center text-sm flex-wrap mt-auto" style={{ color: colors.ui.textMuted }}>
                <span className="px-2 py-1 shadow-px-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
                  {playerResult.attemptCount} tentative{(playerResult.attemptCount ?? 0) > 1 ? 's' : ''}
                </span>
              </div>
            </>
          ) : (
            <div className="text-gray-400 italic py-4">—</div>
          )}
        </div>
      </Card>
    )
  }

  const scoresSection = (
    <div className={`flex flex-col md:flex-row items-stretch gap-4 ${isSolo ? 'justify-center' : ''}`}>
      <PlayerCard
        name={myName}
        playerResult={myResult}
        isWinner={iWon}
      />
      {!isSolo && (
        <>
          <div
            className="flex items-center justify-center text-2xl font-bold px-2 py-4 md:py-0"
            style={{ color: colors.ui.textMuted }}
          >
            VS
          </div>
          <PlayerCard
            name={opponentName}
            playerResult={opponentResult!}
            isWinner={opponentWon}
            pending={!results.bothFinished && !(opponentResult?.hasFinished)}
          />
        </>
      )}
    </div>
  )

  const detailsSection = (
    <>
      {isDraw && (
        <Card className="bg-orange-50 border-2 border-orange-400">
          <div className="p-4 text-center text-orange-600 font-semibold text-lg">
            🤝 Égalité ! Même temps pour les deux joueurs !
          </div>
        </Card>
      )}

      <Card
        pokeballOpacity={0}
        headerColor={colors.brand.yellowLight}
        headerClassName="py-4"
        header={
          <h2 className="font-heading text-xl tracking-wide" style={{ color: colors.ui.textPrimary }}>
            Interactions défensives{correctAnswer && ` — ${correctAnswer}`}
          </h2>
        }
      >
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4">
            {INTERACTION_ORDER.map((key) => {
              const typeNames = results.interactions[key] ?? []
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
    </>
  )

  return (
    <GameResultsLayout
      title="Résultats — Quel est ce type ?"
      sessionCode={state?.sessionCode}
      pokeballColor={colors.brand.yellow}
      topAlert={
        !isSolo && !results.bothFinished ? (
          <p className="text-orange-500 font-medium mt-2 animate-pulse">
            ⏳ En attente de la fin de partie de l'adversaire...
          </p>
        ) : undefined
      }
      scores={scoresSection}
      details={detailsSection}
      actions={
        <ResultsActions
          isSolo={isSolo}
          bothFinished={results.bothFinished}
          onNouvelle={handleNewGame}
          isCreatingNew={isCreatingNew}
          onRelancer={handleRelaunchClick}
          isRelaunching={isRelaunching}
          onRematch={handleRematchClick}
          rematchRequested={rematchRequested}
          relancerColor={colors.brand.yellow}
          nouvellePartieColor={colors.brand.yellow}
        />
      }
    />
  )
}
