import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useSessionStore } from '../store/sessionStore'
import { useBackgroundStore } from '../store/backgroundStore'
import { useChatStore } from '../store/chatStore'
import { usePokemonStore } from '../store/pokemonStore'
import { colors } from '../design/colors'
import Card from '../components/Card'
import PokemonSearchInput from '../components/PokemonSearchInput'
import Timer from '../components/Timer'
import PageLoader from '../components/PageLoader'
import PageError from '../components/PageError'
import { formatGenerations, generationToNumber } from '../utils/generation'
import { getCensoredDescription, getHints } from '../services/pokemonService'
import { getPartie, submitGuess, useHint, getTimer, resetTimer, markPlayerFinished } from '../services/partieService'
import type { PokemonHintsDto } from '../types/pokemon'
import type { PartieDto, GuessResultDto } from '../types/partie'


interface ModalState {
  type: 'success' | 'failure' | null
  sprite: string
  isFinal: boolean
  isTimeout: boolean
}

const HINT_PENALTIES: Record<string, number> = {
  Type1: 10,
  Type2: 10,
  Generation: 10,
  Category: 3,
  Stats: 7,
  Height: 2,
  Weight: 2,
  Abilities: 8,
  Sprite: 30,
}

const HINTS_CONFIG = [
  { key: 'Type1', icon: '🔷', label: 'Type 1' },
  { key: 'Type2', icon: '🔶', label: 'Type 2' },
  { key: 'Generation', icon: '📅', label: 'Génération' },
  { key: 'Category', icon: '🏷️', label: 'Catégorie' },
  { key: 'Stats', icon: '📊', label: 'Statistiques' },
  { key: 'Height', icon: '📏', label: 'Taille' },
  { key: 'Weight', icon: '⚖️', label: 'Poids' },
  { key: 'Abilities', icon: '⚡', label: 'Talents' },
  { key: 'Sprite', icon: '👤', label: 'Silhouette' },
]

interface RevealedHints {
  'Type 1'?: string
  'Type 2'?: string
  'Génération'?: string
  'Catégorie'?: string
  'Statistiques'?: string
  'Taille'?: string
  'Poids'?: string
  'Talents'?: string
  'Silhouette'?: string
}

export default function PokeDescPage() {
  const { partieId } = useParams<{ partieId: string }>()
  const navigate = useNavigate()
  const { sessionId, playerName } = useSessionStore()
  const { setBackground } = useBackgroundStore()
  const { setContext: setChatContext } = useChatStore()

  useEffect(() => {
    setBackground({ colorLeft: colors.ui.bgLeftGame, colorStripe: colors.ui.bgStripeGame, colorRight: colors.ui.bgRightGame });
  }, []);

  // Game state
  const [partie, setPartie] = useState<PartieDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Pokemon data
  const [descriptions, setDescriptions] = useState<string[]>([])
  const [descriptionIndex, setDescriptionIndex] = useState(0)
  const [currentPokemonId, setCurrentPokemonId] = useState('')
  const [currentPokemonSprite, setCurrentPokemonSprite] = useState('')
  const [currentScore, setCurrentScore] = useState(0)
  const [attemptsUsed, setAttemptsUsed] = useState(0)
  const [usedHints, setUsedHints] = useState<string[]>([])
  const [revealedHints, setRevealedHints] = useState<RevealedHints>({})

  // Session info
  const [sessionCode, setSessionCode] = useState('')
  const [isPlayer1, setIsPlayer1] = useState(true)

  // Search
  const { pokemons: allPokemons, load: loadPokemons } = usePokemonStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPokemonName, setSelectedPokemonName] = useState('')

  // Guess result
  const [guessResultMessage, setGuessResultMessage] = useState('')
  const [lastGuessCorrect, setLastGuessCorrect] = useState(false)

  // Modal
  const [modal, setModal] = useState<ModalState>({ type: null, sprite: '', isFinal: false, isTimeout: false })

  // Timer
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [timerShake, setTimerShake] = useState(false)
  const [timerFlash, setTimerFlash] = useState(false)
  const [showTimePenalty, setShowTimePenalty] = useState(false)
  const [currentTimePenalty, setCurrentTimePenalty] = useState(0)
  const [hintAnimations, setHintAnimations] = useState<Record<string, number>>({})

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const serverSyncRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const serverTimeAtSyncRef = useRef<number>(60)
  const clientTimerSyncAtRef = useRef<number>(Date.now())
  const isTimeoutRef = useRef(false)
  const currentPokemonIdRef = useRef<string>('')
  const timerDurationRef = useRef<number>(60)

  // Pre-filter by lobby generations and revealed hints (Type 1, Type 2, Generation — AND logic)
  const hintFilteredPokemons = useMemo(() => allPokemons.filter((p) => {
    // Filter by selected generations from lobby settings
    if (partie?.selectedGenerations?.length) {
      const genNumber = p.generation?.nameEn ? generationToNumber(p.generation.nameEn) : null
      if (genNumber === null || !partie.selectedGenerations.includes(genNumber)) return false
    }
    if (revealedHints['Type 1']) {
      const type1 = p.types?.find((t) => t.slot === 1)
      if (!type1 || type1.name !== revealedHints['Type 1']) return false
    }
    if (revealedHints['Type 2']) {
      const val = revealedHints['Type 2']
      if (val === 'Pas de second type') {
        if (p.types?.some((t) => t.slot === 2)) return false
      } else {
        const type2 = p.types?.find((t) => t.slot === 2)
        if (!type2 || type2.name !== val) return false
      }
    }
    if (revealedHints['Génération']) {
      if (p.generation?.nameFr !== revealedHints['Génération']) return false
    }
    return true
  }), [allPokemons, partie?.selectedGenerations, revealedHints])

  // Filtered pokemons for search
  const filteredPokemons = useMemo(() => searchTerm.trim()
    ? hintFilteredPokemons
        .filter(
          (p) =>
            p.nameFr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.pokedexNumber.toString().includes(searchTerm)
        )
        .sort((a, b) => a.pokedexNumber - b.pokedexNumber)
        .slice(0, 10)
    : [], [searchTerm, hintFilteredPokemons])

  function isHintLocked(hintKey: string): boolean {
    if (usedHints.includes(hintKey)) return false
    if (partie?.timerDurationSeconds === -1) return false // mode infini : jamais bloqué
    const penalty = HINT_PENALTIES[hintKey] ?? 0
    return penalty > timeRemaining
  }

  // Load all pokemons (cached in pokemonStore)
  useEffect(() => {
    loadPokemons().catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Load game data
  const loadGameData = useCallback(async () => {
    if (!partieId) return
    setIsLoading(true)
    setErrorMessage('')
    try {
      const p = await getPartie(partieId)
      setPartie(p)
      timerDurationRef.current = p.timerDurationSeconds
      setSessionCode(p.codeSession ?? 'N/A')
      setChatContext({
        partieId,
        sessionCode: p.codeSession ?? '',
        isSolo: !p.dresseur2Id,
      })

      const player1 = p.dresseur1Id === sessionId
      setIsPlayer1(player1)

      const currentIndex = player1 ? p.currentIndexJ1 : p.currentIndexJ2
      const pokemonId = p.pokemonsToGuess?.[currentIndex]?.id ?? ''

      if (!pokemonId) {
        setErrorMessage('Aucun Pokémon à deviner')
        setIsLoading(false)
        return
      }

      setCurrentPokemonId(pokemonId)
      currentPokemonIdRef.current = pokemonId
      setCurrentScore(player1 ? p.scoreJ1 : p.scoreJ2)
      setAttemptsUsed(player1 ? p.attemptsUsedJ1 : p.attemptsUsedJ2)
      const hints = player1 ? p.usedHintsJ1 : p.usedHintsJ2
      setUsedHints(hints)

      // Load description and hints in parallel
      const [desc, hintData] = await Promise.all([
        getCensoredDescription(pokemonId),
        getHints(pokemonId),
      ])

      // Skip Pokémon without description
      if (!desc.descriptions?.length) {
        setIsLoading(false)
        setErrorMessage('Pokémon sans description — passage au suivant...')
        setTimeout(() => {
          skipPokemonWithoutDescription()
        }, 1500)
        return
      }

      setDescriptions(desc.descriptions)
      setDescriptionIndex(0)
      processRevealedHints(hintData, hints)

      if (hintData.sprites?.frontDefault) {
        setCurrentPokemonSprite(hintData.sprites.frontDefault)
      }
      setIsLoading(false)
    } catch (err: any) {
      setErrorMessage(`Erreur : ${err?.message ?? 'Inconnue'}`)
      setIsLoading(false)
    }
  }, [partieId, sessionId])

  function processRevealedHints(hints: PokemonHintsDto, used: string[]) {
    const revealed: RevealedHints = {}
    if (used.includes('Sprite') && hints.sprites?.frontDefault) {
      revealed['Silhouette'] = hints.sprites.frontDefault
    }
    if (used.includes('Type1') && hints.types) {
      const t = hints.types.find((t) => t.slot === 1)
      if (t) revealed['Type 1'] = t.name
    }
    if (used.includes('Type2') && hints.types) {
      const t = hints.types.find((t) => t.slot === 2)
      revealed['Type 2'] = t ? t.name : 'Pas de second type'
    }
    if (used.includes('Generation') && hints.generation) {
      revealed['Génération'] = hints.generation.nameFr
    }
    if (used.includes('Category') && hints.category) {
      revealed['Catégorie'] = hints.category
    }
    if (used.includes('Stats') && hints.stats) {
      const s = hints.stats
      revealed['Statistiques'] =
        `PV: ${s.PV?.value ?? '?'}, Att: ${s.Attaque?.value ?? '?'}, Déf: ${s['Défense']?.value ?? '?'}, ` +
        `Att Spé: ${s['Attaque Spé.']?.value ?? '?'}, Déf Spé: ${s['Défense Spé.']?.value ?? '?'}, Vit: ${s.Vitesse?.value ?? '?'}`
    }
    if (used.includes('Height') && hints.physical) {
      revealed['Taille'] = `${hints.physical.heightM}m`
    }
    if (used.includes('Weight') && hints.physical) {
      revealed['Poids'] = `${hints.physical.weightKg}kg`
    }
    if (used.includes('Abilities') && hints.abilities?.length) {
      revealed['Talents'] = hints.abilities.map((a) => a.name).join(', ')
    }
    setRevealedHints(revealed)
  }

  // Timer — affichage client-side (100ms), synchronisation serveur toutes les 2s
  function clearAllTimers() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    if (serverSyncRef.current) { clearInterval(serverSyncRef.current); serverSyncRef.current = null }
  }

  async function syncTimerWithServer() {
    if (!partieId) return
    try {
      const result = await getTimer(partieId, sessionId)
      serverTimeAtSyncRef.current = result.timeRemaining
      clientTimerSyncAtRef.current = Date.now()
      if (result.timeRemaining <= 0 && !isTimeoutRef.current && timerDurationRef.current !== -1) {
        isTimeoutRef.current = true
        clearAllTimers()
        handleTimeout()
      }
    } catch {
      // ignore
    }
  }

  function startTimer() {
    clearAllTimers()
    isTimeoutRef.current = false

    // Synchronisation initiale avec le serveur
    syncTimerWithServer()

    // Affichage local à 100ms, sans appel HTTP
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - clientTimerSyncAtRef.current) / 1000
      const remaining = Math.max(0, serverTimeAtSyncRef.current - elapsed)
      setTimeRemaining(remaining)
      if (remaining <= 0 && !isTimeoutRef.current && timerDurationRef.current !== -1) {
        isTimeoutRef.current = true
        clearAllTimers()
        handleTimeout()
      }
    }, 100)

    // Synchronisation serveur toutes les 2s pour corriger la dérive
    serverSyncRef.current = setInterval(syncTimerWithServer, 2000)
  }

  async function handleTimeout() {
    let isFinal = false
    let sprite = currentPokemonSprite
    try {
      const result = await submitGuess(partieId!, sessionId, '__TIMEOUT__')
      isFinal = result.isGameFinished
      try {
        const hints = await getHints(currentPokemonIdRef.current)
        sprite = hints.sprites?.frontDefault ?? currentPokemonSprite
      } catch {
        // keep fallback sprite
      }
    } catch {
      // ignore
    }
    setModal({ type: 'failure', sprite, isFinal, isTimeout: true })
  }

  // Init
  useEffect(() => {
    loadGameData().then(() => startTimer())
    return () => clearAllTimers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function triggerHintAnimation(hintKey: string, penalty: number) {
    setHintAnimations((prev) => ({ ...prev, [hintKey]: penalty }))
    await new Promise((r) => setTimeout(r, 1500))
    setHintAnimations((prev) => {
      const next = { ...prev }
      delete next[hintKey]
      return next
    })
  }

  async function triggerTimerAnimation(penalty: number) {
    setCurrentTimePenalty(penalty)
    setShowTimePenalty(true)
    setTimerFlash(true)
    setTimerShake(true)
    await new Promise((r) => setTimeout(r, 300))
    setTimerFlash(false)
    await new Promise((r) => setTimeout(r, 200))
    setTimerShake(false)
    await new Promise((r) => setTimeout(r, 1000))
    setShowTimePenalty(false)
  }

  async function handleRequestHint(hintKey: string) {
    if (usedHints.includes(hintKey) || isHintLocked(hintKey)) return
    try {
      await useHint(partieId!, sessionId, hintKey)
      // Sync timer so the client-side reference reflects the server-applied penalty
      await syncTimerWithServer()
      const newUsed = [...usedHints, hintKey]
      setUsedHints(newUsed)

      const penalty = HINT_PENALTIES[hintKey]
      if (penalty && timerDurationRef.current !== -1) {
        triggerHintAnimation(hintKey, penalty)
        triggerTimerAnimation(penalty)
      }

      const hintData = await getHints(currentPokemonId)
      processRevealedHints(hintData, newUsed)
    } catch (err: any) {
      setErrorMessage(`Erreur lors de la demande d'indice : ${err?.message ?? ''}`)
    }
  }

  async function handleSubmitGuess() {
    if (!selectedPokemonName || isSubmitting) return
    setIsSubmitting(true)
    setGuessResultMessage('')
    try {
      const result: GuessResultDto = await submitGuess(partieId!, sessionId, selectedPokemonName)
      setLastGuessCorrect(result.isCorrect)
      setGuessResultMessage(result.message)
      setCurrentScore(result.pointsEarned)

      if (result.isCorrect) {
        clearAllTimers()
        setModal({ type: 'success', sprite: currentPokemonSprite, isFinal: result.isGameFinished, isTimeout: false })
      } else if (result.isTurnFinished || result.isTimeout) {
        clearAllTimers()
        setModal({ type: 'failure', sprite: currentPokemonSprite, isFinal: result.isGameFinished, isTimeout: result.isTimeout })
      } else {
        setAttemptsUsed((prev) => prev + 1)
      }
    } catch {
      setGuessResultMessage("Erreur lors de l'envoi de la réponse")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function skipPokemonWithoutDescription() {
    // Skip Pokémon without description and load next one
    try {
      await resetTimer(partieId!, sessionId)
    } catch {
      // Ignore error if timer wasn't started
    }
    resetGuessState()
    setErrorMessage('')
    await loadGameData()
    startTimer()
  }

  async function proceedAfterModal() {
    const isFinal = modal.isFinal
    setModal({ type: null, sprite: '', isFinal: false, isTimeout: false })
    setLastGuessCorrect(false)
    setGuessResultMessage('')

    if (isFinal) {
      try {
        // Prévenir le backend que ce joueur a cliqué sur "Terminer la partie".
        await markPlayerFinished(partieId!, sessionId)
      } catch {
        // ignore errors — on naviguera quand même
      }
      navigate(`/resultats/${partieId}`, { state: { sessionCode } })
      return
    }

    await resetTimer(partieId!, sessionId)
    resetGuessState()
    await loadGameData()
    startTimer()
  }

  function resetGuessState() {
    setSearchTerm('')
    setSelectedPokemonName('')
    setGuessResultMessage('')
    setDescriptionIndex(0)
  }

  // --- States d'affichage ---
  if (isLoading) return <PageLoader />
  if (errorMessage) return <PageError message={`Erreur : ${errorMessage}`} onBack={() => navigate('/pokedesc')} backLabel="Retour au menu" accentColor={colors.brand.blue} />

  const isSolo = partie?.modeSolo ?? true

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 text-gray-900">
      {/* Header */}
      <div className="mb-4">
        <Card
          headerColor={colors.brand.blue}
          headerClassName="py-4"
          header={
            <div className="flex flex-col md:flex-row md:items-center md:gap-3">
              <h1 className="font-display text-2xl md:text-3xl tracking-wide" style={{ color: colors.ui.textOnColor }}>
                Devine le Pokémon !
              </h1>
              {partie?.selectedGenerations && (
                <span className="font-display text-2xl md:text-3xl tracking-wide" style={{ color: colors.ui.textOnColorSoft }}>
                  <span className="hidden md:inline">{formatGenerations(partie.selectedGenerations, false)}</span>
                  <span className="md:hidden">{formatGenerations(partie.selectedGenerations, true)}</span>
                </span>
              )}
            </div>
          }
          pokeballOpacity={0}
          pokeballColor="white"
        >
          <div className="p-4 md:p-6 text-center">
            <div className="flex flex-wrap gap-4 justify-center text-gray-500 text-sm mb-3">
              <span><span className="grayscale opacity-60">🎯</span> Code : {sessionCode}</span>
              {isSolo ? (
                <span className="text-gray-700 font-medium"><span className="grayscale opacity-60">👤</span> Mode Solo — {playerName}</span>
              ) : (
                <span className="text-gray-700 font-medium"><span className="grayscale opacity-60">👥</span> {playerName} VS Adversaire</span>
              )}
            </div>
            <div className="flex flex-wrap gap-6 justify-center text-base">
              <span className="font-body font-semibold" style={{ color: colors.brand.blue }}><span className="grayscale opacity-60">⭐</span> Score : {currentScore}</span>
              <span className="font-body font-semibold text-orange-500"><span className="grayscale opacity-60">🎲</span> Tentatives : {attemptsUsed} / 3</span>
              <Timer
                value={timeRemaining}
                mode={partie?.timerDurationSeconds === -1 ? 'stopwatch' : 'countdown'}
                shake={timerShake}
                flash={timerFlash}
                showPenalty={showTimePenalty && (partie?.timerDurationSeconds !== -1)}
                penaltyValue={currentTimePenalty}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Content grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Colonne gauche */}
        <div className="relative z-10 flex flex-col gap-4">
          {/* Description */}
          <Card
            headerColor={colors.brand.blueLight}
            headerClassName="py-4"
            pokeballColor={colors.brand.blueLight}
            pokeballOpacity={0}
            header={<h2 className="font-display text-2xl tracking-wide text-white">Description du Pokédex</h2>}
          >
            <div className="p-4 md:p-6 flex flex-col pb-6 min-h-[160px] md:min-h-[220px]">
                <div className="flex-1">
                  <div className="font-body bg-blue-50 border-l-4 rounded-xl p-4 text-base leading-relaxed h-full" style={{ borderColor: colors.brand.blue }}>
                    {descriptions[descriptionIndex] || <span className="text-gray-400 italic">Chargement de la description...</span>}
                  </div>
                </div>
                {descriptions.length > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-auto">
                    <button
                      onClick={() => setDescriptionIndex(i => (i - 1 + descriptions.length) % descriptions.length)}
                      className="w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold text-lg hover:-translate-y-0.5 hover:shadow-sm transition"
                      style={{ borderColor: colors.brand.blue, color: colors.brand.blue }}
                    >
                      ‹
                    </button>
                    <span className="font-body text-sm text-gray-500 tabular-nums">{descriptionIndex + 1} / {descriptions.length}</span>
                    <button
                      onClick={() => setDescriptionIndex(i => (i + 1) % descriptions.length)}
                      className="w-9 h-9 flex items-center justify-center rounded-full border-2 font-bold text-lg hover:-translate-y-0.5 hover:shadow-sm transition"
                      style={{ borderColor: colors.brand.blue, color: colors.brand.blue }}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
          </Card>

          {/* Réponse */}
          <Card
            headerColor={colors.brand.blueDark}
            headerClassName="py-4 z-50"
            pokeballColor={colors.brand.white}
            pokeballOpacity={0}
            header={<h3 className="font-display text-2xl tracking-wide text-white">Ta réponse</h3>}
            overflowVisible
          >
            <div className="p-4 md:p-6">
            <div className="mb-3">
              <PokemonSearchInput
                items={filteredPokemons}
                value={searchTerm}
                onChange={setSearchTerm}
                onSelect={(p) => { setSelectedPokemonName(p.nameFr); setSearchTerm(p.nameFr) }}
                disabled={isSubmitting}
              />
            </div>

            {selectedPokemonName && (
              <div className="font-body font-medium px-3 py-2.5 bg-blue-50 border rounded-xl mb-3" style={{ color: colors.brand.blue, borderColor: colors.brand.blue + '66' }}>
                Pokémon sélectionné : {selectedPokemonName}
              </div>
            )}

            <button
              onClick={handleSubmitGuess}
              disabled={!selectedPokemonName || isSubmitting}
              className="font-body font-semibold w-full h-12 text-white rounded-xl hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50 disabled:translate-y-0"
              style={{ backgroundColor: colors.brand.blue }}
            >
              {isSubmitting ? 'Envoi...' : '✓ Valider la réponse'}
            </button>

            {guessResultMessage && (
              <div
                className="font-body font-medium mt-3 px-4 py-3 rounded-xl text-center border"
                style={lastGuessCorrect
                  ? { backgroundColor: colors.game.success + '22', color: colors.game.success, borderColor: colors.game.success + '88' }
                  : { backgroundColor: colors.game.error + '15', color: colors.game.error, borderColor: colors.game.error + '55' }
                }
              >
                {guessResultMessage}
              </div>
            )}
          </div>
          </Card>
        </div>

        {/* Colonne droite — Indices */}
        <Card
          headerColor={colors.brand.blueLight}
          headerClassName="py-4"
          pokeballColor={colors.brand.blueLight}
          pokeballSize={300}
          header={
            <>
              <h3 className="font-display text-2xl tracking-wide text-white">Indices disponibles</h3>
              <p className="font-body text-sm mt-1" style={{ color: colors.ui.textOnColorSoft }}>{partie?.timerDurationSeconds === -1 ? 'Les indices coûtent des points !' : 'Chaque indice coûte du temps !'}</p>
            </>
          
          }
        >
          <div className="p-4 md:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HINTS_CONFIG.map(({ key, icon, label }) => {
              const used = usedHints.includes(key)
              const locked = isHintLocked(key)
              const penalty = HINT_PENALTIES[key]
              const animation = hintAnimations[key]
              const revealedKey = label as keyof RevealedHints
              const revealedValue = revealedHints[revealedKey]

              return (
                <button
                  key={key}
                  onClick={() => handleRequestHint(key)}
                  disabled={used || locked}
                  title={locked ? `Temps insuffisant — il reste ${timeRemaining.toFixed(1)}s, cet indice coûte ${penalty}s` : ''}
                  className={`font-body relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 font-medium min-h-24 transition
                    ${!used ? 'bg-white border-gray-200' : ''}
                    ${!used && !locked ? 'hover:bg-blue-50 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer' : ''}
                    ${locked || used ? 'cursor-not-allowed' : ''}`}
                  style={used ? { backgroundColor: colors.brand.blue + '18', borderColor: colors.brand.blue } : {}}
                >
                  {animation !== undefined && partie?.timerDurationSeconds !== -1 && (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-red-500 font-bold text-lg pointer-events-none z-20 bg-white/95 px-2 py-0.5 rounded-md border-2 border-red-500 animate-[hintFloatUp_1.5s_ease-out_forwards]">
                      -{animation}s
                    </span>
                  )}

                  {used && revealedValue ? (
                    <>
                      {key === 'Sprite' ? (
                        <img src={revealedValue} alt="Silhouette" className="max-w-full h-auto" style={{ imageRendering: 'pixelated', filter: 'brightness(0)' }} />
                      ) : (
                        <span className={`font-body font-semibold text-center leading-tight px-1 ${key === 'Stats' ? 'text-xs' : 'text-sm'}`} style={{ color: colors.brand.blue }}>
                          {revealedValue}
                        </span>
                      )}
                      <span className="absolute top-1.5 right-1.5 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: colors.game.success }}>✓</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl grayscale opacity-70">{icon}</span>
                      <span className="text-sm text-gray-700">{label}</span>
                      {locked && (
                        <span className="absolute top-1.5 right-1.5 bg-gray-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">🔒</span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </div>
          </div>
        </Card>
      </div>

      {/* Modal succès */}
      {modal.type === 'success' && modal.sprite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white border-2 rounded-2xl p-8 max-w-sm w-11/12 text-center shadow-2xl animate-[fadeInScale_0.3s_ease-out]" style={{ borderColor: colors.game.success }}>
            <span className="text-5xl grayscale opacity-70 block mb-3">🎉</span>
            <h4 className="font-body font-bold text-xl mb-4" style={{ color: colors.ui.textPrimary }}>Bravo ! C'était bien :</h4>
            <div>
              <img
                src={modal.sprite}
                alt="Pokémon trouvé"
                className="max-w-48 h-auto mx-auto mb-2 animate-[spriteReveal_0.8s_ease-out]"
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="font-body font-semibold text-lg" style={{ color: colors.ui.textPrimary }}>{selectedPokemonName}</p>
            </div>
            <button
              onClick={proceedAfterModal}
              className="font-body font-semibold mt-6 w-full py-3 text-white rounded-xl hover:-translate-y-0.5 hover:shadow-md transition"
              style={{ backgroundColor: colors.brand.blue }}
            >
              ➡️ {modal.isFinal ? 'Terminer la partie' : 'Passer au Pokémon suivant'}
            </button>
          </div>
        </div>
      )}

      {/* Modal échec */}
      {modal.type === 'failure' && modal.sprite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white border-2 rounded-2xl p-8 max-w-sm w-11/12 text-center shadow-2xl animate-[fadeInScale_0.3s_ease-out]" style={{ borderColor: colors.game.error }}>
            <span className="text-5xl grayscale opacity-70 block mb-3">{modal.isTimeout ? '⏱️' : '😔'}</span>
            <h4 className="font-body font-bold text-xl mb-4" style={{ color: colors.game.error }}>{modal.isTimeout ? "Temps écoulé ! C\u2019était :" : "Dommage ! C\u2019était :"}</h4>
            <div>
              <img
                src={modal.sprite}
                alt="Pokémon à deviner"
                className="max-w-48 h-auto mx-auto mb-2 animate-[spriteReveal_0.8s_ease-out]"
                style={{ imageRendering: 'pixelated' }}
              />
              <p className="font-body font-semibold text-lg" style={{ color: colors.ui.textPrimary }}>
                {allPokemons.find((p) => p.id === currentPokemonId)?.nameFr ?? 'Pokémon inconnu'}
              </p>
            </div>
            <button
              onClick={proceedAfterModal}
              className="font-body font-semibold mt-6 w-full py-3 text-white rounded-xl hover:-translate-y-0.5 hover:shadow-md transition"
              style={{ backgroundColor: colors.brand.blue }}
            >
              ➡️ {modal.isFinal ? 'Terminer la partie' : 'Passer au Pokémon suivant'}
            </button>
          </div>
        </div>
      )}

      {/* Animations CSS */}
      <style>{`
        @keyframes hintFloatUp {
          0% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          50% { opacity: 1; transform: translateX(-50%) translateY(-15px) scale(1.15); }
          100% { opacity: 0; transform: translateX(-50%) translateY(-40px) scale(0.9); }
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spriteReveal {
          from { opacity: 0; filter: brightness(0); transform: scale(0.9); }
          to { opacity: 1; filter: brightness(1); transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
