import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router'
import SectionTitle from './SectionTitle'
import { PokeballDecor } from './Pokeball'
import Card from './Card'
import PixelButton, { pixelClipPathSm, pixelClipPathLg } from './PixelButton'
import { useSessionStore } from '../store/sessionStore'
import { useBackgroundStore } from '../store/backgroundStore'
import { useChatStore } from '../store/chatStore'
import { createPartie, joinPartie, getPartie, startPartie, updateGameSettings } from '../services/partieService'
import type { PartieDto } from '../types/partie'
import type { GameSettings } from '../pages/LobbyPokedescPage'
import { colors } from '../design/colors'
import redGif from './images/red-gif.gif'
import dittoGif from './images/ditto-gif.gif'
import SubCard from './SubCard'

export interface LobbyTheme {
  primary: string
  primaryLight: string
  primaryDark: string
  textOnColor: string
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
  const { setBackground } = useBackgroundStore()
  const { setContext: setChatContext, clearContext: clearChatContext } = useChatStore()

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

  // Sync partie state to chat context
  useEffect(() => {
    if (partie?.id) {
      setChatContext({
        partieId: partie.id,
        sessionCode: partie.codeSession ?? '',
        isSolo: !partie.dresseur2Id,
      })
    } else {
      clearChatContext()
    }
  }, [partie?.id, partie?.dresseur2Id, partie?.codeSession]) // eslint-disable-line react-hooks/exhaustive-deps

  const gameTitle = (() => {
    const route = (gameRoute || '').toLowerCase()
    if (route.includes('pokedesc')) return 'PokéDesc'
    if (route.includes('dezoom')) return 'Dezoom'
    if (route.includes('types')) return 'Quel est ce type ?'
    if (startMode) return startMode
    return 'Explication'
  })()

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
      JSON.stringify(prevSettingsRef.current.generations) !== JSON.stringify(currentSettings.generations) ||
      prevSettingsRef.current.timerDuration !== currentSettings.timerDuration

    if (settingsChanged) {
      prevSettingsRef.current = currentSettings
      updateGameSettings(
        currentPartieId,
        currentSettings.nbPokemons,
        currentSettings.generations,
        currentSettings.timerDuration
      )
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
    
    // Fonction pour mettre à jour la partie
    const refreshPartie = async () => {
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
    }

    // Appel immédiat pour détecter les changements rapides
    refreshPartie()

    // Puis polling toutes les 2 secondes
    autoRefreshRef.current = setInterval(refreshPartie, 2000)
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
      setJoinErrorMessage('Entre le code de session')
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
                colorBorder={theme.primaryDark}
                colorLight={theme.primaryDark}
                colorDark={theme.primary}
                color={theme.primaryDark}
              >
                <span style={{ color: theme.textOnColor }} className="font-semibold">Continuer</span>
              </PixelButton>
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
        pokeballOpacity={0}
        header={
          <>
            <h2 className="font-display text-2xl text-center tracking-wide mb-4" style={{ color: theme.textOnColor, fontSize: '1.5rem' }}>
              Salle d'attente <br/> {gameTitle}
              <p className="font-heading text-sm mt-3" style={{ color: theme.textOnColor, opacity: 0.8, fontSize: '0.85rem' }}>
                Partage ce code pour inviter ton ami ou démarre en solo !
              </p>            
            </h2>

            {/* Ajout d'un conteneur inline-flex pour centrer la SubCard sans qu'elle prenne 100% de la largeur */}
            <div className="inline-flex justify-center">
              <SubCard 
                borderColor={colors.brand.white} 
                bodyColor={colors.brand.blueLight} 
                borderThickness="p-[2px]"
              >
                {/* On force le flex-row ici pour s'assurer que le code et le bouton soient sur la même ligne */}
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
        <div className="relative p-6 overflow-hidden">
          <PokeballDecor
            size={280}
            opacity={0.1}
            color={theme.primary}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
          />

          {/* Joueurs */}
          <div className="relative z-10 flex items-center justify-center gap-6 mb-6">
            <div className="flex-1 max-w-48">
              <SubCard
                borderColor={isPlayer1 ? theme.primary : (colors.ui?.grayMid || '#e5e7eb')}
                borderThickness="p-[2px]"
                bodyColor={colors.brand.white}
                className="text-center p-4 relative transition"
              >
                <img src={redGif} alt="Joueur 1" className="w-12 h-12 mx-auto mb-1" />
                <div className="font-heading font-semibold text-gray-800">
                  {isPlayer1 ? playerName : 'Joueur 1'}
                </div>
              </SubCard>
            </div>

            <div className="font-heading text-2xl tracking-wide" style={{ color: theme.primaryDark }}>VS</div>

            <div className="flex-1 max-w-48 relative">
              <SubCard
                borderColor={!isPlayer1 ? theme.primary : (colors.ui?.grayMid || '#e5e7eb')}
                borderThickness="p-[2px]"
                bodyColor={colors.brand.white}
                className="text-center p-4 relative transition"
              >
                {partie.dresseur2Id ? (
                  <img src={redGif} alt="Joueur 2" className="w-12 h-12 mx-auto mb-1" />
                ) : (
                  <img src={dittoGif} alt="Joueur 2" className="w-12 h-12 mx-auto mb-1" />
                )}
                <div className="font-heading font-semibold text-gray-800">
                  {!isPlayer1 ? playerName : partie.dresseur2Id ? 'Adversaire' : 'En attente...'}
                </div>
                {!isPlayer1 && (
                  <div className="absolute top-2 right-2">
                    <SubCard 
                      bodyColor={theme.primary} 
                      borderColor={theme.primaryDark} 
                      borderThickness="p-[2px]" 
                      className="px-2 py-0.5 text-xs font-heading font-semibold flex items-center justify-center" 
                      style={{ color: theme.textOnColor }}
                    >
                      Vous
                    </SubCard>
                  </div>
                )}
              </SubCard>
            </div>
          </div>

          {/* Actions */}
          <div className="relative z-10 text-center space-y-3">
            {partie.statut === 'Prêt' && (
              <>
                {isPlayer1 ? (
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
                    <span style={{ color: '#ffffff' }} className="font-semibold">Démarrer la partie</span>
                  </PixelButton>
                ) : (
                  <SubCard 
                    borderColor={colors.ui?.grayMid || '#d1d5db'} 
                    bodyColor="#f3f4f6" 
                    borderThickness="p-[2px]" 
                    className="font-heading inline-flex items-center justify-center gap-2 px-6 py-2.5 text-gray-600"
                  >
                    ⏳ Attente de l'hôte...
                  </SubCard>
                )}
              </>
            )}
            {partie.statut === 'EnAttente' && (
              <>
                {!partie.dresseur2Id && (
                  <PixelButton
                    onClick={() => handleStart(true)}
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 mx-4"
                    innerClassName="inline-flex items-center gap-2 px-6 py-2.5"
                    colorBorder={colors.brand.blueDeep}
                    colorLight={theme.primaryLight}
                    colorDark={theme.primaryDark}
                    color={theme.primary}
                  >
                    <span style={{ color: theme.textOnColor }} className="font-semibold font-heading">Jouer en solo</span>
                  </PixelButton>
                )}
              </>
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
              onClick={handleCancel}
              className="inline-flex items-center gap-2 mx-4"
              innerClassName="inline-flex items-center gap-2 px-6 py-2.5"
              colorBorder={colors.brand.redDeep}
              colorLight={colors.brand.redLight}
              colorDark={colors.brand.redDark}
              color={colors.brand.red}
            >
              <span style={{ color: '#ffffff' }} className="font-semibold font-heading">Annuler</span>
            </PixelButton>
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
              <h3 className="font-display text-2xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
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
              <h3 className="font-display text-2xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                Créer une partie
              </h3>
            </div>
          }
          
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-heading text-lg md:text-xl mb-5 text-gray-500" style={{ fontSize: '1.25rem' }}>
              Joue seul ou défie un ami en partageant le code de session !
            </p>
            <div className="flex-1" />
            <PixelButton
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full mt-auto mb-2"
              innerClassName="flex items-center justify-center w-full h-full px-4 py-2.5"
              colorBorder={colors.brand.blueDeep}
              colorLight={theme.primaryLight}
              colorDark={theme.primaryDark}
              color={theme.primary}
            >
              <span style={{ color: theme.textOnColor }} className="font-semibold font-heading">{isLoading ? 'Chargement...' : 'Créer une nouvelle partie'}</span>
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
              <h3 className="font-display text-2xl tracking-wide mb-0" style={{ color: theme.textOnColor }}>
                Rejoindre une partie
              </h3>
            </div>
          }
        >
          <div className="p-6 text-center flex flex-col flex-1">
            <p className="font-heading text-lg md:text-xl mb-4 text-gray-500 " style={{ fontSize: '1.25rem' }}>
              Entre le code de session fourni par ton ami
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
              colorBorder={colors.brand.blueDeep}
              colorLight={theme.primaryLight}
              colorDark={theme.primaryDark}
              color={theme.primaryLight}
            >
              <span style={{ color: theme.textOnColor }} className="font-semibold font-heading">{isLoading ? 'Chargement...' : 'Rejoindre la partie'}</span>
            </PixelButton>
          </div>
        </Card>

      </div>
    </div>
  )
}