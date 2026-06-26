import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import SectionTitle from '../primitives/SectionTitle'
import { PokeballDecor } from '../primitives/Pokeball'
import Card from '../primitives/Card'
import PixelButton, { pixelClipPathSm, pixelClipPathLg } from '../primitives/PixelButton'
import { useSessionStore } from '../../store/sessionStore'
import { useChatStore } from '../../store/chatStore'
import { useLobbyStore } from '../../store/lobbyStore'
import { createPartie, joinPartie, getPartie, startPartie, updateGameSettings, kickPlayer, leaveGame } from '../../services/partieService'
import { lobbyService } from '../../services/lobbyService'
import type { PartieDto } from '../../types/partie'
import type { GameSettings } from '../../pages/LobbyPokedescPage'
import { colors } from '../../design/colors'
import redGif from '../images/red-gif.gif'
import dittoGif from '../images/ditto-gif.gif'
import SubCard from '../primitives/SubCard'

/** Thème visuel passé au `LobbyPage` pour personnaliser les couleurs selon le jeu. */
export interface LobbyTheme {
  primary: string
  primaryLight: string
  primaryDark: string
  borderColor: string
  textOnColor: string
}

/** Props du composant `LobbyPage`. */
interface LobbyPageProps {
  gameRoute: string
  theme: LobbyTheme
  explanationText: React.ReactNode
  /** Rendu du panneau de paramètres — `isHost` remplace l'ancien `isPlayer1`. */
  settingsPanel?: (isHost: boolean, partie: PartieDto | null) => React.ReactNode
  getSettings?: () => GameSettings
  defaultSettings?: GameSettings
  startMode?: string
  onSettingsChange?: (settings: GameSettings) => void
}

const DEFAULT_SETTINGS: GameSettings = { nbPokemons: 3, generations: [1, 2, 3, 4, 5, 6, 7, 8], timerDuration: 60 }

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
  const { setContext: setChatContext, clearContext: clearChatContext } = useChatStore()
  const lobbyStore = useLobbyStore()

  const [pseudoInput, setPseudoInput] = useState('')
  const [codeSession, setCodeSession] = useState('')
  const [currentPartieId, setCurrentPartieId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [joinErrorMessage, setJoinErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const prevSettingsRef = useRef<GameSettings | null>(null)

  const { partie, players, isHost } = lobbyStore

  const gameTitle = useMemo(() => {
    const route = (gameRoute || '').toLowerCase()
    if (route.includes('pokedesc')) return 'PokéDesc'
    if (route.includes('dezoom')) return 'Dex-Zoom'
    if (route.includes('types')) return 'Typuzzle'
    if (startMode) return startMode
    return 'Explication'
  }, [gameRoute, startMode])

  // Sync partie vers le contexte chat
  useEffect(() => {
    if (partie?.id) {
      setChatContext({
        partieId: partie.id,
        sessionCode: partie.codeSession ?? '',
        isSolo: partie.modeSolo || players.length <= 1,
      })
    } else {
      clearChatContext()
    }
  }, [partie?.id, partie?.codeSession, players.length, partie?.modeSolo, setChatContext, clearChatContext])

  // Déconnexion SignalR au démontage
  useEffect(() => {
    return () => {
      lobbyService.disconnect()
    }
  }, [])

  // Charger une partie pré-créée (depuis la page résultats "Nouvelle partie")
  useEffect(() => {
    const state = location.state as { existingPartieId?: string } | null
    if (!state?.existingPartieId) return
    setIsLoading(true)
    getPartie(state.existingPartieId)
      .then((p) => {
        lobbyStore.setPartie(p, sessionId)
        setCurrentPartieId(p.id)
        subscribeToLobby(p.id)
      })
      .catch((err: any) => {
        const detail = err?.response?.status ? `HTTP ${err.response.status}` : (err?.message ?? String(err))
        setErrorMessage(`Impossible de charger la partie (${detail})`)
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync des settings vers le serveur (hôte uniquement)
  useEffect(() => {
    if (!isHost || !currentPartieId || !partie) return

    const currentSettings = getSettings?.()
    if (!currentSettings) return

    const settingsChanged =
      !prevSettingsRef.current ||
      prevSettingsRef.current.nbPokemons !== currentSettings.nbPokemons ||
      JSON.stringify(prevSettingsRef.current.generations) !== JSON.stringify(currentSettings.generations) ||
      prevSettingsRef.current.timerDuration !== currentSettings.timerDuration

    if (settingsChanged) {
      prevSettingsRef.current = currentSettings
      updateGameSettings(
        currentPartieId,
        sessionId,
        currentSettings.nbPokemons,
        currentSettings.generations,
        currentSettings.timerDuration
      )
        .then((updated) => {
          lobbyStore.setPartie(updated, sessionId)
          onSettingsChange?.(currentSettings)
        })
        .catch(() => {})
    }
  }, [isHost, currentPartieId, getSettings])

  function subscribeToLobby(partieId: string) {
    lobbyService.connect(partieId, {
      onLobbyUpdated: (updated) => {
        lobbyStore.setPartie(updated, sessionId)
      },
      onGameStarted: (updated) => {
        lobbyStore.setPartie(updated, sessionId)
        navigate(`${gameRoute}/${updated.id}`)
      },
      onPlayerKicked: (kickedId) => {
        if (kickedId === sessionId) {
          lobbyService.disconnect()
          lobbyStore.reset()
          setCurrentPartieId('')
          setSuccessMessage('')
          setErrorMessage("Vous avez été expulsé de la partie par l'hôte.")
        }
      },
    })
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
      const p = await createPartie(sessionId, playerName)
      lobbyStore.setPartie(p, sessionId)
      setCurrentPartieId(p.id)
      setSuccessMessage(`Partie créée ! Code : ${p.codeSession}`)
      subscribeToLobby(p.id)
    } catch (err: any) {
      const detail = err?.response?.data?.message ?? err?.message ?? String(err)
      setErrorMessage(`Erreur création : ${detail}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleJoin() {
    if (!codeSession.trim()) {
      setJoinErrorMessage('Entre le code de session')
      return
    }
    setIsLoading(true)
    setJoinErrorMessage('')
    setErrorMessage('')
    try {
      const p = await joinPartie(codeSession.trim().toUpperCase(), sessionId, playerName)
      lobbyStore.setPartie(p, sessionId)
      setCurrentPartieId(p.id)
      setSuccessMessage('Vous avez rejoint la partie !')
      subscribeToLobby(p.id)
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) setJoinErrorMessage('Code de session invalide ou partie introuvable')
      else if (status === 409) setJoinErrorMessage('La partie est pleine ou déjà démarrée')
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
      await startPartie(currentPartieId, isSolo, settings, startMode, sessionId)
      if (isSolo) navigate(`${gameRoute}/${currentPartieId}`)
    } catch (err: any) {
      const status = err?.response?.status
      const detail = err?.response?.data?.message ?? err?.response?.data ?? err?.message ?? String(err)
      setErrorMessage(`Erreur démarrage (${status ?? '?'}) : ${detail}`)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleKick(targetId: string) {
    try {
      await kickPlayer(currentPartieId, sessionId, targetId)
    } catch {
      setErrorMessage("Impossible d'expulser ce joueur.")
      setTimeout(() => setErrorMessage(''), 3000)
    }
  }

  async function handleLeave() {
    if (currentPartieId) {
      try {
        await leaveGame(currentPartieId, sessionId)
      } catch {
        // Silencieusement ignoré : on quitte quoi qu'il arrive
      }
    }
    lobbyService.disconnect()
    lobbyStore.reset()
    setCurrentPartieId('')
    setSuccessMessage('')
    setErrorMessage('')
    setJoinErrorMessage('')
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
              <h1 className="font-display text-2xl tracking-wide mb-1" style={{ color: theme.textOnColor }}>
                Bienvenue !
              </h1>
              <p className="font-heading text-center" style={{ color: theme.textOnColor, opacity: 0.8 }}>
                Choisissez un pseudo pour jouer
              </p>
            </>
          }
        >
          <div className="p-8">
            <form onSubmit={handleSetPseudo} className="space-y-4">
              <SubCard
                borderColor={colors.ui?.grayMid || '#d1d5db'}
                borderThickness="p-[2px]"
                bodyColor={colors.brand.white}
              >
                <input
                  type="text"
                  value={pseudoInput}
                  onChange={(e) => setPseudoInput(e.target.value)}
                  placeholder="Votre pseudo..."
                  maxLength={20}
                  className="font-heading w-full px-4 py-3 text-base focus:outline-none bg-transparent"
                />
              </SubCard>
              <PixelButton
                type="submit"
                disabled={!pseudoInput.trim()}
                className="font-heading w-full"
                innerClassName="flex items-center justify-center w-full h-full px-4 py-3"
                colorBorder={theme.borderColor}
                colorLight={theme.primaryLight}
                colorDark={theme.primaryDark}
                color={theme.primary}
              >
                <span style={{ color: theme.textOnColor }} className="font-semibold">Continuer</span>
              </PixelButton>
            </form>
          </div>
        </Card>
      </div>
    )
  }

  // --- Lobby actif ---
  if (currentPartieId && partie) {
    const maxSlots = partie.maxPlayers || 8

    const waitingRoomCard = (
      <Card
        headerColor={theme.primary}
        pokeballOpacity={0}
        header={
          <>
            <h2 className="font-display text-2xl text-center tracking-wide mb-4" style={{ color: theme.textOnColor, fontSize: '1.5rem' }}>
              Salle d'attente <br /> {gameTitle}
              <p className="font-heading mt-2" style={{ color: theme.textOnColor, opacity: 0.8, fontSize: '0.7rem' }}>
                Partage ce code pour inviter des joueurs !
              </p>
            </h2>

            <div className="inline-flex justify-center">
              <SubCard
                borderColor={colors.brand.white}
                bodyColor={theme.primaryLight}
                borderThickness="p-[2px]"
              >
                <div className="flex flex-row items-center gap-3 px-5 py-2">
                  <span className="font-display text-xl tracking-widest" style={{ color: theme.textOnColor }}>
                    {partie.codeSession}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center p-1"
                    title="Copier"
                  >
                    <span style={{ color: theme.textOnColor, opacity: 0.9 }} className="text-lg">📋</span>
                  </button>
                </div>
              </SubCard>
            </div>
          </>
        }
      >
        <div className="relative p-3 sm:p-6 overflow-hidden">
          <PokeballDecor
            size={150}
            opacity={0.1}
            color={theme.primary}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
          />

          {/* Grille de joueurs */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {/* Slots occupés */}
            {players.map((player) => {
              const isMe = player.dresseurId === sessionId
              const isPlayerHost = player.dresseurId === partie.hostId
              const canKick = isHost && !isMe

              return (
                <div key={player.dresseurId} className="relative">
                  <SubCard
                    borderColor={isMe ? theme.primary : (colors.ui?.grayMid || '#e5e7eb')}
                    borderThickness="p-[2px]"
                    bodyColor={colors.brand.white}
                    className="text-center p-2 relative transition"
                  >
                    {/* Badge Hôte */}
                    {isPlayerHost && (
                      <div className="absolute top-1 left-1">
                        <SubCard
                          bodyColor={theme.primary}
                          borderColor={theme.primaryDark}
                          borderThickness="p-[1px]"
                          className="px-1 py-0.5 flex items-center justify-center"
                        >
                          <span className="font-heading font-bold" style={{ color: theme.textOnColor, fontSize: '0.5rem' }}>
                            HÔTE
                          </span>
                        </SubCard>
                      </div>
                    )}

                    {/* Badge Vous */}
                    {isMe && (
                      <div className="absolute top-1 right-1">
                        <SubCard
                          bodyColor={theme.primary}
                          borderColor={theme.primaryDark}
                          borderThickness="p-[1px]"
                          className="px-1 py-0.5 flex items-center justify-center"
                        >
                          <span className="font-heading font-bold" style={{ color: theme.textOnColor, fontSize: '0.5rem' }}>
                            VOUS
                          </span>
                        </SubCard>
                      </div>
                    )}

                    <img src={redGif} alt={player.name} className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 mt-2" />
                    <div className="font-heading font-semibold text-gray-800 truncate" style={{ fontSize: '0.65rem' }}>
                      {player.name || 'Joueur'}
                    </div>

                    {/* Bouton Kick (hôte seulement, sur les invités) */}
                    {canKick && (
                      <button
                        onClick={() => handleKick(player.dresseurId)}
                        title={`Expulser ${player.name}`}
                        className="mt-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                        style={{ fontSize: '0.6rem' }}
                      >
                        ✕ Expulser
                      </button>
                    )}
                  </SubCard>
                </div>
              )
            })}

            {/* Slots vides */}
            {Array.from({ length: Math.max(0, maxSlots - players.length) }).map((_, i) => (
              <div key={`empty-${i}`}>
                <SubCard
                  borderColor={colors.ui?.grayMid || '#e5e7eb'}
                  borderThickness="p-[2px]"
                  bodyColor="#f9fafb"
                  className="text-center p-2"
                >
                  <img src={dittoGif} alt="En attente" className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-1 mt-2 opacity-40" />
                  <div className="font-heading text-gray-400 truncate" style={{ fontSize: '0.65rem' }}>
                    En attente...
                  </div>
                </SubCard>
              </div>
            ))}
          </div>

          {/* Compteur de joueurs */}
          <div className="relative z-10 text-center mb-3">
            <span className="font-heading text-xs text-gray-500">
              {players.length} / {maxSlots} joueur{players.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Actions */}
          <div className="relative z-10 text-center space-y-3">
            {partie.statut === 'EnAttente' && (
              <>
                {isHost ? (
                  <div className="flex flex-wrap justify-center gap-3">
                    <PixelButton
                      onClick={() => handleStart(false)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-2"
                      innerClassName="inline-flex items-center gap-2 px-6 py-2.5"
                      colorBorder={colors.brand.greenDeep}
                      colorLight={colors.brand.greenLight}
                      colorDark={colors.brand.greenDark}
                      color={colors.brand.green}
                    >
                      <span style={{ color: '#ffffff' }} className="font-heading">▶ Démarrer</span>
                    </PixelButton>
                    {players.length === 1 && (
                      <PixelButton
                        onClick={() => handleStart(true)}
                        disabled={isLoading}
                        className="inline-flex items-center gap-2"
                        innerClassName="inline-flex items-center gap-2 px-6 py-2.5"
                        colorBorder={theme.borderColor}
                        colorLight={theme.primaryLight}
                        colorDark={theme.primaryDark}
                        color={theme.primary}
                      >
                        <span style={{ color: theme.textOnColor }} className="font-semibold font-heading">Jouer en solo</span>
                      </PixelButton>
                    )}
                  </div>
                ) : (
                  <SubCard
                    borderColor={colors.ui?.grayMid || '#d1d5db'}
                    bodyColor="#f3f4f6"
                    borderThickness="p-[2px]"
                    className="font-heading inline-flex items-center justify-center gap-2 px-6 py-2.5 text-gray-600"
                  >
                    ⏳ En attente de l'hôte...
                  </SubCard>
                )}
              </>
            )}

            {successMessage && (
              <SubCard
                borderColor={colors.brand.greenDeep}
                bodyColor={colors.brand.green}
                borderThickness="p-[2px]"
                className="font-heading px-4 py-3 font-medium text-white"
              >
                {successMessage}
              </SubCard>
            )}

            {errorMessage && (
              <SubCard
                borderColor="#991b1b"
                bodyColor="#dc2626"
                borderThickness="p-[2px]"
                className="font-heading px-4 py-3 font-medium text-white"
              >
                {errorMessage}
              </SubCard>
            )}

            <PixelButton
              onClick={handleLeave}
              className="inline-flex items-center gap-2 mx-4"
              innerClassName="inline-flex items-center gap-2 px-6 py-2.5"
              colorBorder={colors.ui.grayBorderDark}
              colorLight={colors.ui.grayLight}
              colorDark={colors.ui.grayDark}
              color={colors.ui.grayMid}
            >
              <span style={{ color: colors.ui.textMuted }} className="font-semibold font-heading">Quitter</span>
            </PixelButton>
          </div>
        </div>
      </Card>
    )

    if (settingsPanel) {
      return (
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-4 items-start px-4 md:px-0 py-4 md:py-0">
          {waitingRoomCard}
          {settingsPanel(isHost, partie)}
        </div>
      )
    }

    return <div className="max-w-2xl mx-auto px-4 sm:px-0">{waitingRoomCard}</div>
  }

  // --- Options create/join ---
  return (
    <div className="space-y-6 py-10 px-4 sm:px-6 lg:px-8">
      {errorMessage && (
        <div className="max-w-xl mx-auto">
          <SubCard
            borderColor="#dc262633"
            bodyColor="transparent"
            borderThickness="p-[2px]"
            className="font-heading px-4 py-3 font-medium text-center text-red-600"
          >
            {errorMessage}
          </SubCard>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 max-w-7xl mx-auto">

        {/* Explication */}
        <Card
          hoverable
          headerColor={theme.primaryDark}
          headerClassName="py-6"
          pokeballColor={theme.primaryDark}
          cardSize={{ height: 380 }}
          header={
            <div className="text-center flex flex-col flex-1">
              <h3 className="font-display text-xl md:text-2xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                {gameTitle}
              </h3>
            </div>
          }
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-heading text-lg md:text-xl mb-5 text-gray-500">
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
          cardSize={{ height: 380 }}
          header={
            <div className="text-center flex flex-col flex-1">
              <h3 className="font-display text-xl md:text-2xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                Créer une partie
              </h3>
            </div>
          }
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-heading text-lg md:text-xl mb-5 text-gray-500" style={{ fontSize: '1.25rem' }}>
              Crée un lobby jusqu'à 8 joueurs et partage le code !
            </p>
            <div className="flex-1" />
            <PixelButton
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full mt-auto mb-2"
              innerClassName="flex items-center justify-center w-full h-full px-4 py-2.5"
              colorBorder={theme.borderColor}
              colorLight={theme.primaryLight}
              colorDark={theme.primaryDark}
              color={theme.primary}
            >
              <span style={{ color: theme.textOnColor }} className="font-semibold font-heading">
                {isLoading ? 'Chargement...' : 'Créer une nouvelle partie'}
              </span>
            </PixelButton>
          </div>
        </Card>

        {/* Rejoindre */}
        <Card
          hoverable
          headerColor={theme.primaryLight}
          headerClassName="py-6"
          pokeballColor={theme.primaryLight}
          cardSize={{ height: 380 }}
          header={
            <div className="text-center flex flex-col flex-1">
              <h3 className="font-display text-xl md:text-2xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                Rejoindre une partie
              </h3>
            </div>
          }
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-heading text-lg md:text-xl mb-4 text-gray-500" style={{ fontSize: '1.25rem' }}>
              Entre le code de session fourni par l'hôte
            </p>
            <div className="mb-3 text-left">
              <div className="mb-4">
                <SubCard
                  borderColor={joinErrorMessage ? '#ef4444' : (colors.ui?.grayMid || '#d1d5db')}
                  borderThickness="p-[2px]"
                  bodyColor="white"
                >
                  <input
                    type="text"
                    value={codeSession}
                    onChange={(e) => setCodeSession(e.target.value)}
                    placeholder="Code de session"
                    className="font-heading text-lg w-full px-3 py-2.5 text-base focus:outline-none bg-transparent"
                  />
                </SubCard>
              </div>
              {joinErrorMessage && (
                <p className="font-heading text-sm text-red-500">{joinErrorMessage}</p>
              )}
            </div>
            <div className="flex-1" />
            <PixelButton
              onClick={handleJoin}
              disabled={isLoading}
              className="w-full mt-auto mb-2"
              innerClassName="flex items-center justify-center w-full h-full px-4 py-2.5"
              colorBorder={theme.borderColor}
              colorLight={theme.primaryLight}
              colorDark={theme.primaryDark}
              color={theme.primaryLight}
            >
              <span style={{ color: theme.textOnColor }} className="font-semibold font-heading">
                {isLoading ? 'Chargement...' : 'Rejoindre la partie'}
              </span>
            </PixelButton>
          </div>
        </Card>

      </div>
    </div>
  )
}
