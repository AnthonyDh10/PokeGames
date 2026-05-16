import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getDeZoomResults, markDeZoomRematchReady } from '../services/dezoomService'
import { createPartie, startPartie } from '../services/partieService'
import GameResultsLayout from '../components/GameResultsLayout'
import ResultsActions from '../components/ResultsActions'
import Card from '../components/Card'
import SubCard from '../components/SubCard'
import WinnerCard from '../components/WinnerCard'
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
    if (!results) return
    setIsRelaunching(true)
    try {
      const newPartie = await createPartie(sessionId)
      await startPartie(newPartie.id, true, { nbPokemons: 1, generations: results.generations ?? [1, 2, 3, 4, 5, 6, 7, 8, 9], timerDuration: -1 }, 'DeZoom')
      navigate(`/dezoom/${newPartie.id}`)
    } catch {
      setErrorMessage('Erreur lors du relancement de la partie.')
      setIsRelaunching(false)
    }
  }

  async function handleNewGame() {
    if (!results) return
    setIsCreatingNew(true)
    try {
      const newPartie = await createPartie(sessionId)
      navigate('/dezoom', {
        state: {
          existingPartieId: newPartie.id,
          previousSettings: {
            nbPokemons: 1,
            generations: results.generations ?? [1, 2, 3, 4, 5, 6, 7, 8, 9],
            timerDuration: 60,
          },
        },
      })
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
          header={<h3 className="font-heading text-base tracking-wide text-white">Erreur</h3>}
        >
          <div className="p-12 text-center">
            <p className="text-red-600 font-medium mb-4">{errorMessage || 'Erreur inconnue'}</p>
            <button
              onClick={() => navigate('/dezoom')}
              className="px-6 py-2.5 text-white font-semibold rounded hover:-translate-y-0.5 transition"
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
  const opponentName = 'Adversaire'

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
        header={
          <h2 className="font-heading text-lg tracking-wide text-white">
            {name} {isWinner && <span style={{ filter: 'grayscale(1)', marginLeft: '0.5rem' }}>👑</span>}
          </h2>
        }
        className="flex-1 transition-all"
        style={{
          boxShadow: isWinner ? `0 8px 24px ${colors.brand.red}40` : undefined,
        }}
      >
        <div className="p-6 flex flex-col h-full text-center">
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
              <div className="mt-auto flex justify-center">
                <div
                  className="px-3 py-2 border-2 bg-white font-heading text-xs uppercase tracking-widest text-gray-800"
                  style={{
                    borderColor: isWinner ? colors.brand.red : colors.brand.redDeep,
                    boxShadow: `3px 3px 0px ${isWinner ? colors.brand.red : colors.brand.redDeep}`,
                  }}
                >
                  {playerResult.attemptCount} tentative{(playerResult.attemptCount ?? 0) > 1 ? 's' : ''}
                </div>
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
    <div className="flex flex-col gap-6">
      <Card
        borderColor={colors.brand.redDeep}
        className="border-4 bg-slate-50 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.1)]"
        pokeballOpacity={0}
      >
      <div className="p-6">
        <h3 className="font-heading text-center text-xl mb-6 uppercase tracking-widest" style={{ color: colors.brand.redDark }}>
          SCORES FINAUX
        </h3>

        <div className={`grid ${isSolo ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-2'} gap-6`}>
          {/* --- SECTION JOUEUR --- */}
          <div className="flex flex-col space-y-3 w-full">
            <div className="font-display text-xs py-1 px-3 self-start uppercase tracking-wider" style={{ color: colors.brand.redDark }}>
              {myName}
            </div>

            {myResult.elapsedSeconds !== undefined ? (
              <>
                <div className="flex justify-between items-end border-b-4 border-dashed pb-2" style={{ borderColor: colors.brand.redDark }}>
                  <span className={`font-heading font-bold text-sm ${myResult.wasCorrect ? 'text-gray-600' : 'text-red-500'}`}>
                    {myResult.wasCorrect ? 'TEMPS' : 'X ÉCHEC'}
                  </span>
                  {myResult.wasCorrect && (
                    <span className="font-heading text-2xl font-bold" style={{ color: colors.brand.redDark }}>
                      {formatElapsed(myResult.elapsedSeconds)}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div 
                    className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
                    style={{ borderColor: colors.brand.redDark, boxShadow: `3px 3px 0px ${colors.brand.redDark}` }}
                  >
                    <div className="text-[10px] text-gray-500 mb-1">TENTATIVE(S)</div>
                    <div className="font-bold text-lg text-gray-800">{myResult.attemptCount}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-gray-400 italic py-4">—</div>
            )}
          </div>

          {/* --- SECTION ADVERSAIRE --- */}
          {!isSolo && (
            <div className="flex flex-col space-y-3 w-full">
              <div className="font-display text-xs py-1 px-3 self-start uppercase tracking-wider" style={{ color: colors.brand.redDark }}>
                {opponentName}
              </div>

              {opponentResult?.elapsedSeconds !== undefined ? (
                <>
                  <div className="flex justify-between items-end border-b-4 border-dashed pb-2" style={{ borderColor: colors.brand.redDark }}>
                    <span className={`font-heading font-bold text-sm ${!results.bothFinished ? 'text-gray-500 animate-pulse' : (opponentResult.wasCorrect ? 'text-gray-600' : 'text-red-500')}`}>
                      {!results.bothFinished ? 'EN ATTENTE...' : (opponentResult.wasCorrect ? 'TEMPS' : 'X ÉCHEC')}
                    </span>
                    {results.bothFinished && opponentResult.wasCorrect && (
                      <span className="font-heading text-2xl font-bold" style={{ color: colors.brand.redDark }}>
                        {formatElapsed(opponentResult.elapsedSeconds)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div 
                      className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
                      style={{ borderColor: colors.brand.redDark, boxShadow: `3px 3px 0px ${colors.brand.redDark}` }}
                    >
                      <div className="text-[10px] text-gray-500 mb-1">TENTATIVE(S)</div>
                      <div className="font-bold text-lg text-gray-800">
                        {!results.bothFinished ? '...' : opponentResult.attemptCount}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="font-heading animate-pulse" style={{ color: colors.brand.red }}>⏳ EN ATTENTE...</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
      {!isSolo && (
        <WinnerCard
          winner={iWon ? myName : (opponentWon ? opponentName : null)}
          isSolo={isSolo}
          bothFinished={results.bothFinished}
          borderColor={colors.brand.redDeep}
          mainColor={colors.brand.red}
        />
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
        showHeader={false}
        borderColor={colors.brand.redDeep}
        bodyColor={colors.brand.white}
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
          <p className="font-display" style={{ color: colors.ui.textMuted }}>
            C'était... <strong style={{ fontSize: '1.5rem', color: colors.brand.redDeep }}>{results.correctPokemonNameFr}</strong>
          </p>
        </div>
      </Card>
    </>
  )

  return (
    <GameResultsLayout
      title="DEX-ZOOM"
      sessionCode={state?.sessionCode}
      pokeballColor='white'
      bodyColor={colors.brand.red}
      textColor="white"
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
          buttonColor={colors.brand.red}
          buttonColorDark={colors.brand.redDark}
          buttonColorLight={colors.brand.redLight}
          buttonColorBorder={colors.brand.redDeep}
        />
      }
    />
  )
}
