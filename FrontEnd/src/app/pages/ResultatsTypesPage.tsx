import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useSessionStore } from '../store/sessionStore'
import { useChatStore } from '../store/chatStore'
import { getTypesGameResults, markRematchReady } from '../services/typesGameService'
import { createPartie, startPartie } from '../services/partieService'
import GameResultsLayout from '../components/GameResultsLayout'
import ResultsActions from '../components/ResultsActions'
import Card from '../components/Card'
import SubCard from '../components/SubCard'
import WinnerCard from '../components/WinnerCard'
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
      // Types game does not accept nbPokemons/generations — start with mode only
      await startPartie(newPartie.id, true, undefined, 'Types')
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

const scoresSection = (
    <div className="flex flex-col gap-6">
      <Card
        borderColor={colors.brand.yellowDark}
        className="border-4 bg-slate-50 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.1)]"
        pokeballOpacity={0}
      >
        <div className="p-3 sm:p-6">
          <h3 className="font-heading text-center text-xl mb-6 uppercase tracking-widest" style={{ color: colors.brand.yellowDark }}>
            SCORES FINAUX
          </h3>
          
          <div className={`grid ${isSolo ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 sm:grid-cols-2'} gap-6`}>
            {/* Joueur 1 */}
            <div className="flex flex-col space-y-3 w-full">
              <div className="font-display text-xs py-1 px-3 self-start uppercase tracking-wider" style={{ color: colors.brand.yellowDark }}>
                {myName}
              </div>
              
              {myResult.elapsedSeconds !== undefined ? (
                <>
                  <div className="flex justify-between items-end border-b-4 border-dashed pb-2" style={{ borderColor: colors.brand.yellowDark }}>
                    <span className={`font-heading font-bold text-sm ${myResult.wasCorrect ? 'text-gray-600' : 'text-red-500'}`}>
                      {myResult.wasCorrect ? 'TEMPS' : 'X ÉCHEC'}
                    </span>
                    {myResult.wasCorrect && (
                      <span className="font-heading text-2xl font-bold" style={{ color: colors.brand.yellowDark }}>
                        {formatElapsed(myResult.elapsedSeconds)}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    <div 
                      className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
                      style={{ borderColor: colors.brand.yellowDark, boxShadow: `3px 3px 0px ${colors.brand.yellowDark}` }}
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
            
            {/* Joueur 2 (si multijoueur) */}
            {!isSolo && (
              <div className="flex flex-col space-y-3 w-full">
                <div className="font-display text-xs py-1 px-3 self-start uppercase tracking-wider" style={{ color: colors.brand.yellowWarm }}>
                  {opponentName}
                </div>
                
                {opponentResult?.elapsedSeconds !== undefined ? (
                  <>
                    <div className="flex justify-between items-end border-b-4 border-dashed pb-2" style={{ borderColor: colors.brand.yellowWarm }}>
                      <span className={`font-heading font-bold text-sm ${!results.bothFinished ? 'text-gray-500 animate-pulse' : (opponentResult.wasCorrect ? 'text-gray-600' : 'text-red-500')}`}>
                        {!results.bothFinished ? 'EN ATTENTE...' : (opponentResult.wasCorrect ? 'TEMPS' : 'X ÉCHEC')}
                      </span>
                      {results.bothFinished && opponentResult.wasCorrect && (
                        <span className="font-heading text-2xl font-bold" style={{ color: colors.brand.yellowWarm }}>
                          {formatElapsed(opponentResult.elapsedSeconds)}
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <div 
                        className="p-2 bg-white border-2 transition-transform hover:-translate-y-0.5"
                        style={{ borderColor: colors.brand.yellowWarm, boxShadow: `3px 3px 0px ${colors.brand.yellowWarm}` }}
                      >
                        <div className="text-[10px] text-gray-500 mb-1">TENTATIVE(S)</div>
                        <div className="font-bold text-lg text-gray-800">
                          {!results.bothFinished ? '...' : opponentResult.attemptCount}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="font-heading animate-pulse text-orange-500 py-4">⏳ EN ATTENTE...</div>
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
          borderColor={colors.brand.yellowDark}
          mainColor={colors.brand.yellow}
        />
      )}
    </div>
  )

  const detailsSection = (
    <>
      <Card
        pokeballOpacity={0}
        headerColor={colors.brand.yellowLight}
        headerClassName="py-4"
        showHeader={false}
        borderColor={colors.brand.yellowDark}
      >
        {correctAnswer && (
            <div className="mt-3 sm:mt-4 text-center">
              <p className="text-xs sm:text-sm font-heading uppercase tracking-widest mb-2 sm:mb-3" style={{color: colors.brand.yellowDark}}>
                Réponse 
              </p>
              <div className="flex justify-center gap-2 sm:gap-3 items-center">
                {results.correctType1NameFr && (
                  <TypeImage name={results.correctType1NameFr} className="h-10 sm:h-12" />
                )}
                {results.correctType2NameFr && (
                  <>
                    <TypeImage name={results.correctType2NameFr} className="h-10 sm:h-12" />
                  </>
                )}
              </div>
            </div>
          )}
          
        <div className="p-4 md:p-6">
          <div className="grid grid-cols-1 gap-4">
            {INTERACTION_ORDER.map((key) => {
              const typeNames = results.interactions[key] ?? []
              if (typeNames.length === 0) return null
              return (
                <SubCard key={key} borderColor={colors.brand.yellowDark} bodyColor={colors.brand.white} className="p-3">
                  <h3 className="font-heading font-semibold text-sm mb-2" style={{ color: colors.ui.textMuted }}>
                    {INTERACTION_LABELS[key]}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {typeNames.map((name) => (
                      <TypeImage key={name} name={name} />
                    ))}
                  </div>
                </SubCard>
              )
            })}
          </div>
        </div>
      </Card>
    </>
  )

  return (
    <GameResultsLayout
      title="TYPUZZLE"
      sessionCode={state?.sessionCode}
      pokeballColor={colors.ui.textMuted}
      bodyColor={colors.brand.yellow}
      textColor={colors.ui.textMuted}
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
          buttonColor={colors.brand.yellow}
          buttonColorDark={colors.brand.yellowWarm}
          buttonColorLight={colors.brand.yellowLight}
          buttonColorBorder={colors.brand.yellowWarm}
          menuColor={colors.ui.textMuted}
        />
      }
    />
  )
}
