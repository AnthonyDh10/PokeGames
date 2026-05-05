import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getDeZoomResults, markDeZoomRematchReady } from '../services/dezoomService'
import { createPartie, startPartie } from '../services/partieService'
import GameResultsLayout from '../components/GameResultsLayout'
import ResultsActions from '../components/ResultsActions'
import Card from '../components/Card'
import { colors } from '../design/colors'
import type { DeZoomGameResultsDto } from '../types/dezoom'

const SPRITE_SIZE = 96
const DISPLAY_SCALE = 4

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export default function ResultatsDeZoomPage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, playerName } = useSessionStore()
  const state = location.state as { sessionCode?: string } | null
  const { setContext: setChatContext } = useChatStore()

  const [results, setResults] = useState<DeZoomGameResultsDto | null>(null)
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
      const r = await getDeZoomResults(partieId)
      setResults(r)
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
      const status = await markDeZoomRematchReady(partieId, sessionId)
      if (status.rematchPartieId) {
        navigate(`/dezoom/${status.rematchPartieId}`)
        return
      }
      rematchPollRef.current = setInterval(async () => {
        try {
          const fresh = await markDeZoomRematchReady(partieId, sessionId)
          if (fresh.rematchPartieId) {
            clearInterval(rematchPollRef.current!)
            navigate(`/dezoom/${fresh.rematchPartieId}`)
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
      await startPartie(newPartie.id, true, { nbPokemons: 1, generations: [1, 2, 3, 4, 5, 6, 7, 8], timerDuration: -1 })
      navigate(`/dezoom/${newPartie.id}`)
    } catch {
      setErrorMessage('Erreur lors du relancement de la partie.')
      setIsRelaunching(false)
    }
  }

  async function handleNewGame() {
    setIsCreatingNew(true)
    try {
      const newPartie = await createPartie(sessionId)
      navigate('/dezoom', { state: { existingPartieId: newPartie.id } })
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

    fetchResults().finally(() => {
      setIsLoading(false)
    })

    // Always start polling immediately to catch when player2 joins or finishes
    pollRef.current = setInterval(async () => {
      try {
        const fresh = await getDeZoomResults(partieId)
        setResults(fresh)
        if (fresh.bothFinished) {
          clearInterval(pollRef.current!)
        }
      } catch (error) {
        // Silent fail, keep polling
      }
    }, 1000)

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
          headerColor={colors.brand.red}
          headerClassName="py-3"
          header={<h3 className="font-display text-xl tracking-wide text-white">Erreur</h3>}
        >
          <div className="p-12 text-center">
            <p className="text-red-600 font-medium mb-4">{errorMessage || 'Erreur inconnue'}</p>
            <button
              onClick={() => navigate('/dezoom')}
              className="px-6 py-2.5 text-white font-semibold rounded-xl hover:-translate-y-0.5 transition"
              style={{ backgroundColor: colors.brand.red }}
            >
              Retour au menu
            </button>
          </div>
        </Card>
      </div>
    )
  }

  const isPlayer1 = results.player1.dresseurId === sessionId
  const myResult = isPlayer1 ? results.player1 : (results.player2 ?? results.player1)
  const opponentResult = isPlayer1 ? results.player2 : results.player1

  const myName = playerName || 'Moi'

  const iWon = !isSolo && results.bothFinished
    && myResult.elapsedSeconds !== undefined
    && opponentResult?.elapsedSeconds !== undefined
    && myResult.elapsedSeconds < opponentResult.elapsedSeconds
  const opponentWon = !isSolo && results.bothFinished
    && opponentResult?.elapsedSeconds !== undefined
    && myResult.elapsedSeconds !== undefined
    && opponentResult.elapsedSeconds < myResult.elapsedSeconds
  const isDraw = !isSolo && results.bothFinished && !iWon && !opponentWon

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
        headerColor={isWinner ? colors.brand.red : colors.brand.redDeep}
        pokeballColor={isWinner ? colors.brand.red : colors.brand.redDeep}
        headerClassName="py-3"
        cardSize={{ width: 300, height: 200 }}
        pokeballSize={150}
        header={
          <h2 className="font-display text-xl tracking-wide text-white">
            {name} {isWinner && <span style={{ filter: 'grayscale(1)', marginLeft: '0.5rem' }}>👑</span>}
          </h2>
        }
        className="flex-1 transition-all"
        style={{
          boxShadow: isWinner ? `0 8px 24px ${colors.brand.red}40` : undefined,
        }}
      >
        <div className="p-6 flex flex-col h-full text-center rounded-b-xl">
          {pending && (
            <span
              className="mx-auto inline-block text-xs font-medium px-2 py-1 rounded-full mb-3 animate-pulse border"
              style={{ color: colors.brand.red, borderColor: colors.brand.red }}
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
                <span className="px-2 py-1 rounded-md shadow-sm border" style={{ backgroundColor: colors.ui.surface, borderColor: colors.ui.bgRight }}>
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
      <PlayerCard name={myName} playerResult={myResult} isWinner={iWon} />
      {!isSolo && (
        <>
          <div className="flex items-center justify-center text-2xl font-bold px-2 py-4 md:py-0" style={{ color: colors.ui.textMuted }}>
            VS
          </div>
          <PlayerCard
            name="Adversaire"
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
        headerColor={colors.brand.redDeep}
        headerClassName="py-4"
        header={
          <h2 className="font-display text-2xl tracking-wide text-white">
            C'était... {results.correctPokemonNameFr}
          </h2>
        }
      >
        <div className="p-6 flex flex-col items-center gap-4">
          <img
            src={results.spriteUrl}
            alt={results.correctPokemonNameFr}
            style={{
              width: SPRITE_SIZE * DISPLAY_SCALE,
              height: SPRITE_SIZE * DISPLAY_SCALE,
              imageRendering: 'pixelated',
            }}
          />
          <p className="font-display text-2xl" style={{ color: colors.ui.textPrimary }}>
            {results.correctPokemonNameFr}
          </p>
        </div>
      </Card>
    </>
  )

  return (
    <GameResultsLayout
      title="Résultats — DéZoom"
      sessionCode={state?.sessionCode}
      pokeballColor={colors.brand.red}
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
          relancerColor={colors.brand.red}
          nouvellePartieColor={colors.brand.red}
        />
      }
    />
  )
}
