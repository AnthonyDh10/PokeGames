import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router'
import SectionTitle from './SectionTitle'
import { PokeballDecor } from './Pokeball'
import Card from './Card'
import { useSessionStore } from '../store/sessionStore'
import { useBackgroundStore } from '../store/backgroundStore'
import { createPartie, joinPartie, getPartie, startPartie, updateGameSettings } from '../services/partieService'
import type { PartieDto } from '../types/partie'
import type { GameSettings } from '../pages/LobbyPokedescPage'

export interface LobbyTheme {
  primary: string
  primaryLight: string
  primaryDark: string
  textOnColor: string
  background: {
    colorLeft: string
    colorStripe: string
    colorRight: string
  }
}

interface LobbyPageProps {
  gameRoute: string
  theme: LobbyTheme
  explanationText: React.ReactNode
  settingsPanel?: (isPlayer1: boolean, partie: PartieDto | null) => React.ReactNode
  getSettings?: () => GameSettings
  defaultSettings?: GameSettings
  startMode?: string
  onSettingsChange?: (settings: GameSettings) => void
}

const DEFAULT_SETTINGS: GameSettings = { nbPokemons: 1, generations: [1, 2, 3, 4, 5, 6, 7, 8] }

export default function LobbyPage({
  gameRoute,
  theme,
  explanationText,
  settingsPanel,
  getSettings,
  defaultSettings = DEFAULT_SETTINGS,
  startMode = 'Standard',
  onSettingsChange,
}: LobbyPageProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { sessionId, playerName, setPlayerName } = useSessionStore()
  const { setBackground } = useBackgroundStore()

  const [pseudoInput, setPseudoInput] = useState('')
  const [codeSession, setCodeSession] = useState('')
  const [currentPartieId, setCurrentPartieId] = useState('')
  const [partie, setPartie] = useState<PartieDto | null>(null)
  const [isPlayer1, setIsPlayer1] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [joinErrorMessage, setJoinErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevSettingsRef = useRef<GameSettings | null>(null)

  useEffect(() => {
    setBackground(theme.background)
  }, [])

  useEffect(() => {
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    }
  }, [])

  // Charger une partie pré-créée (depuis la page résultats "Nouvelle partie")
  useEffect(() => {
    const state = location.state as { existingPartieId?: string } | null
    if (!state?.existingPartieId) return
    setIsLoading(true)
    getPartie(state.existingPartieId)
      .then((p) => {
        setPartie(p)
        setCurrentPartieId(p.id)
        setIsPlayer1(p.dresseur1Id === sessionId)
        startAutoRefresh(p.id)
      })
      .catch(() => setErrorMessage('Impossible de charger la partie.'))
      .finally(() => setIsLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Monitor settings changes and update on server (player 1 only)
  useEffect(() => {
    if (!isPlayer1 || !currentPartieId || !partie) return

    const currentSettings = getSettings?.()
    if (!currentSettings) return

    const settingsChanged =
      !prevSettingsRef.current ||
      prevSettingsRef.current.nbPokemons !== currentSettings.nbPokemons ||
      JSON.stringify(prevSettingsRef.current.generations) !== JSON.stringify(currentSettings.generations)

    if (settingsChanged) {
      prevSettingsRef.current = currentSettings
      updateGameSettings(currentPartieId, currentSettings.nbPokemons, currentSettings.generations)
        .then((updated) => {
          setPartie(updated)
          onSettingsChange?.(currentSettings)
        })
        .catch(() => {
          // Silently fail
        })
    }
  }, [isPlayer1, currentPartieId, getSettings])

  function startAutoRefresh(partieId: string) {
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current)
    autoRefreshRef.current = setInterval(async () => {
      try {
        const updated = await getPartie(partieId)
        setPartie((prev) => {
          if (prev?.statut !== updated.statut) {
            if (updated.statut === 'Prêt') {
              setSuccessMessage('Le joueur 2 a rejoint ! Vous pouvez démarrer la partie.')
            }
            if (updated.statut === 'EnCours') {
              clearInterval(autoRefreshRef.current!)
              navigate(`${gameRoute}/${partieId}`)
            }
          }
          return updated
        })
      } catch {
        // silent
      }
    }, 2000)
  }

  function stopAutoRefresh() {
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current)
      autoRefreshRef.current = null
    }
  }

  function handleSetPseudo(e: React.FormEvent) {
    e.preventDefault()
    if (pseudoInput.trim()) setPlayerName(pseudoInput.trim())
  }

  async function handleCreate() {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const p = await createPartie(sessionId)
      setPartie(p)
      setCurrentPartieId(p.id)
      setIsPlayer1(p.dresseur1Id === sessionId)
      setSuccessMessage(`Partie créée ! Code : ${p.codeSession}`)
      startAutoRefresh(p.id)
    } catch {
      setErrorMessage('Erreur lors de la création de la partie.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleJoin() {
    if (!codeSession.trim()) {
      setJoinErrorMessage('Veuillez entrer un code de session')
      return
    }
    setIsLoading(true)
    setJoinErrorMessage('')
    setErrorMessage('')
    try {
      const p = await joinPartie(codeSession.trim().toUpperCase(), sessionId)
      setPartie(p)
      setCurrentPartieId(p.id)
      setIsPlayer1(p.dresseur1Id === sessionId)
      setSuccessMessage('Vous avez rejoint la partie !')
      startAutoRefresh(p.id)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) setJoinErrorMessage('Code de session invalide ou partie introuvable')
      else if (status === 400) setJoinErrorMessage('Impossible de rejoindre cette partie')
      else setJoinErrorMessage('Erreur lors de la connexion à la partie')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleStart(isSolo: boolean) {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const settings = getSettings?.() ?? defaultSettings
      await startPartie(currentPartieId, isSolo, settings, startMode)
      if (isSolo) navigate(`${gameRoute}/${currentPartieId}`)
    } catch {
      setErrorMessage('Erreur lors du démarrage de la partie.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopyCode() {
    if (partie?.codeSession) {
      try {
        await navigator.clipboard.writeText(partie.codeSession)
        setSuccessMessage('Code copié !')
        setTimeout(() => setSuccessMessage(''), 2000)
      } catch {
        setSuccessMessage('Code : ' + partie.codeSession)
      }
    }
  }

  function handleCancel() {
    stopAutoRefresh()
    setCurrentPartieId('')
    setPartie(null)
    setSuccessMessage('')
    setErrorMessage('')
    setJoinErrorMessage('')
  }

  // --- Rendu pseudo ---
  if (!playerName) {
    return (
      <div className="max-w-md mx-auto mt-16">
        <Card
          headerColor={theme.primary}
          headerClassName="py-10"
          pokeballColor={theme.primaryDark}
          header={
            <>
              <h1 className="font-display text-4xl tracking-wide mb-1" style={{ color: theme.textOnColor }}>
                Bienvenue !
              </h1>
              <p className="font-body text-center" style={{ color: theme.textOnColor, opacity: 0.8 }}>
                Choisissez un pseudo pour jouer
              </p>
            </>
          }
        >
          <div className="p-8">
            <form onSubmit={handleSetPseudo} className="space-y-4">
              <input
                type="text"
                value={pseudoInput}
                onChange={(e) => setPseudoInput(e.target.value)}
                placeholder="Votre pseudo..."
                maxLength={20}
                className="font-body w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={!pseudoInput.trim()}
                className="font-body font-semibold w-full py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                style={{ backgroundColor: theme.primaryDark, color: theme.textOnColor }}
              >
                Continuer
              </button>
            </form>
          </div>
        </Card>
      </div>
    )
  }

  // --- Lobby ---
  if (currentPartieId && partie) {
    const waitingRoomCard = (
      <Card
        headerColor={theme.primary}
        pokeballColor={theme.primaryDark}
        header={
          <>
            <h2 className="font-display text-4xl tracking-wide mb-4" style={{ color: theme.textOnColor }}>
              Salle d'attente
            </h2>
            <div className="inline-flex items-center gap-3 bg-white/20 px-4 py-2 rounded-full">
              <span className="font-body text-sm" style={{ color: theme.textOnColor, opacity: 0.8 }}>
                Code :
              </span>
              <span className="font-display text-2xl tracking-widest" style={{ color: theme.textOnColor }}>
                {partie.codeSession}
              </span>
              <button
                onClick={handleCopyCode}
                className="font-body p-1.5 rounded-md hover:bg-white/20 transition"
                style={{ color: theme.textOnColor, opacity: 0.8 }}
                title="Copier"
              >
                📋
              </button>
            </div>
          </>
        }
      >
        <div className="relative p-6 overflow-hidden">
          <PokeballDecor
            size={280}
            opacity={0.1}
            color={theme.primary}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
          />

          {/* Joueurs */}
          <div className="relative z-10 flex items-center justify-center gap-6 mb-6">
            <div
              className={`flex-1 max-w-48 text-center p-4 rounded-xl border-2 relative transition ${isPlayer1 ? '' : 'border-gray-200'}`}
              style={isPlayer1 ? { borderColor: theme.primary } : {}}
            >
              <div className="text-4xl mb-1">👤</div>
              <div className="font-body font-semibold text-gray-800">
                {isPlayer1 ? playerName : 'Joueur 1'}
              </div>
              {isPlayer1 && (
                <span
                  className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                  style={{ backgroundColor: theme.primary, color: theme.textOnColor }}
                >
                  Vous
                </span>
              )}
            </div>

            <div className="font-display text-2xl tracking-wide" style={{ color: theme.primaryDark }}>VS</div>

            <div
              className={`flex-1 max-w-48 text-center p-4 rounded-xl border-2 relative transition ${!isPlayer1 ? '' : 'border-gray-200'}`}
              style={!isPlayer1 ? { borderColor: theme.primary } : {}}
            >
              <div className="text-4xl mb-1">👤</div>
              <div className="font-body font-semibold text-gray-800">
                {!isPlayer1 ? playerName : partie.dresseur2Id ? 'Adversaire' : 'En attente...'}
              </div>
              {!isPlayer1 && (
                <span
                  className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-body font-semibold"
                  style={{ backgroundColor: theme.primary, color: theme.textOnColor }}
                >
                  Vous
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="relative z-10 text-center space-y-3">
            {partie.statut === 'Prêt' && (
              <>
                <div className="font-body flex items-center justify-center gap-2 bg-green-50 text-green-700 border border-green-200 px-4 py-3 rounded-xl mb-3">
                  <span>✅</span>
                  <span className="font-medium">Les deux joueurs sont connectés !</span>
                </div>
                {isPlayer1 ? (
                  <button
                    onClick={() => handleStart(false)}
                    disabled={isLoading}
                    className="font-body font-semibold inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-xl hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50"
                    style={{ backgroundColor: '#16a34a' }}
                  >
                    Démarrer la partie
                  </button>
                ) : (
                  <div className="font-body inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-gray-600 bg-gray-100 border border-gray-300">
                    ⏳ Attente de l'hôte...
                  </div>
                )}
              </>
            )}
            {partie.statut === 'EnAttente' && (
              <>
                <div
                  className="font-body flex items-start gap-2 px-4 py-3 rounded-xl mb-3 text-left border"
                  style={{ borderColor: theme.primary + '44' }}
                >
                  <span className="text-xl">⏳</span>
                  <div>
                    <p className="font-medium text-gray-700">En attente du second joueur...</p>
                    <p className="text-sm mt-0.5 text-gray-500">
                      Partagez le code <strong>{partie.codeSession}</strong> avec votre ami
                    </p>
                  </div>
                </div>
                {!partie.dresseur2Id && (
                  <button
                    onClick={() => handleStart(true)}
                    disabled={isLoading}
                    className="font-body font-semibold inline-flex items-center gap-2 px-6 py-2.5 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50 mx-4"
                    style={{ backgroundColor: theme.primaryLight, color: theme.textOnColor }}
                  >
                    Jouer en solo
                  </button>
                )}
              </>
            )}

            {errorMessage && (
              <div className="font-body border px-4 py-3 rounded-xl font-medium text-white" style={{ backgroundColor: '#dc2626' }}>
                {errorMessage}
              </div>
            )}

            <button
              onClick={handleCancel}
              className="font-body font-semibold inline-flex items-center gap-2 px-6 py-2.5 text-white rounded-xl hover:-translate-y-0.5 hover:shadow-md transition mx-4"
              style={{ backgroundColor: '#dc2626' }}
            >
              Annuler
            </button>
          </div>
        </div>
      </Card>
    )

    if (settingsPanel) {
      return (
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4 items-start">
          {waitingRoomCard}
          {settingsPanel(isPlayer1, partie)}
        </div>
      )
    }

    return <div className="max-w-2xl mx-auto">{waitingRoomCard}</div>
  }

  // --- Options create/join ---
  return (
    <div className="space-y-6">
      <SectionTitle>Débuter une partie — {playerName}</SectionTitle>

      {errorMessage && (
        <div
          className="max-w-xl mx-auto font-body border px-4 py-3 rounded-xl font-medium text-center"
          style={{ color: '#dc2626', borderColor: '#dc262633' }}
        >
          {errorMessage}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 max-w-7xl mx-auto">

        {/* Explication */}
        <Card
          hoverable
          headerColor={theme.primaryDark}
          headerClassName="py-6"
          pokeballColor={theme.primaryDark}
          header={
            <div className="text-center flex flex-col flex-1">
              <h3 className="font-display text-3xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                Explication
              </h3>
            </div>
          }
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-body text-lg md:text-xl mb-5 text-gray-500">
              {explanationText}
            </p>
          </div>
        </Card>

        {/* Créer */}
        <Card
          hoverable
          headerColor={theme.primary}
          headerClassName="py-6"
          pokeballColor={theme.primary}
          header={
            <div className="text-center flex flex-col flex-1">
              <h3 className="font-display text-3xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                Créer une partie
              </h3>
            </div>
          }
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-body text-lg md:text-xl mb-5 text-gray-500">
              Joue seul ou défie un ami en partageant le code de session !
            </p>
            <button
              onClick={handleCreate}
              disabled={isLoading}
              className="font-body font-semibold w-full py-2.5 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50 disabled:translate-y-0 mt-auto"
              style={{ backgroundColor: theme.primary, color: theme.textOnColor }}
            >
              {isLoading ? 'Chargement...' : 'Créer une nouvelle partie'}
            </button>
          </div>
        </Card>

        {/* Rejoindre */}
        <Card
          hoverable
          headerColor={theme.primaryLight}
          headerClassName="py-6"
          pokeballColor={theme.primaryLight}
          header={
            <div className="text-center flex flex-col flex-1">
              <h3 className="font-display text-3xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                Rejoindre une partie
              </h3>
            </div>
          }
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-body text-lg md:text-xl mb-4 text-gray-500">
              Entre le code de session fourni par ton ami
            </p>
            <div className="mb-3 text-left">
              <input
                type="text"
                value={codeSession}
                onChange={(e) => setCodeSession(e.target.value)}
                placeholder="Code de session"
                className={`font-body text-lg mb-4 w-full px-3 py-2.5 border rounded-xl text-base focus:outline-none transition ${joinErrorMessage ? 'border-red-500' : 'border-gray-300'}`}
              />
              {joinErrorMessage && (
                <p className="font-body text-sm text-red-500">{joinErrorMessage}</p>
              )}
            </div>
            <button
              onClick={handleJoin}
              disabled={isLoading}
              className="font-body font-semibold w-full py-2.5 rounded-xl hover:-translate-y-0.5 hover:shadow-md transition disabled:opacity-50 disabled:translate-y-0 mt-auto"
              style={{ backgroundColor: theme.primaryLight, color: theme.textOnColor }}
            >
              {isLoading ? 'Chargement...' : 'Rejoindre la partie'}
            </button>
          </div>
        </Card>

      </div>
    </div>
  )
}
