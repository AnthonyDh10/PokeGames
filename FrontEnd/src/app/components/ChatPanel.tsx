import { useState, useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { useSessionStore } from '../store/sessionStore'
import { chatService } from '../services/chatService'
import { colors } from '../design/colors'
import PixelButton, { pixelClipPathSm } from './PixelButton'
import { color } from 'framer-motion'

const pixelClipPath = `polygon(
  16px 0px, calc(100% - 16px) 0px, 
  calc(100% - 16px) 4px, calc(100% - 8px) 4px, calc(100% - 8px) 8px, calc(100% - 4px) 8px, calc(100% - 4px) 16px, 100% 16px, 
  100% calc(100% - 16px), 
  calc(100% - 4px) calc(100% - 16px), calc(100% - 4px) calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) calc(100% - 4px), calc(100% - 16px) calc(100% - 4px), calc(100% - 16px) 100%, 
  16px 100%, 
  16px calc(100% - 4px), 8px calc(100% - 4px), 8px calc(100% - 8px), 4px calc(100% - 8px), 4px calc(100% - 16px), 0px calc(100% - 16px), 
  0px 16px, 
  4px 16px, 4px 8px, 8px 8px, 8px 4px, 16px 4px
)`;

export default function ChatPanel() {
  const { partieId, sessionCode, isSolo, isOpen, messages, toggleOpen, setOpen } = useChatStore()
  const { playerName, sessionId } = useSessionStore()

  const [inputText, setInputText] = useState('')
  const [copied, setCopied] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const senderName = playerName || `Joueur-${sessionId.slice(0, 4)}`

  // Connect / disconnect when partieId changes
  useEffect(() => {
    if (!partieId) {
      chatService.disconnect()
      return
    }
    chatService.connect(partieId, senderName)
    return () => {}
  }, [partieId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom when new messages arrive or panel opens
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && !isSolo) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen, isSolo])

  const handleSend = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      const text = inputText.trim()
      if (!text || !partieId) return
      setInputText('')
      await chatService.sendMessage(partieId, senderName, text)
    },
    [inputText, partieId, senderName]
  )

  const handleCopyCode = useCallback(() => {
    if (!sessionCode) return
    navigator.clipboard.writeText(sessionCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [sessionCode])

  if (!partieId) return null

  return (
    <>
      {/* ═══════════════════════════════════════ */}
      {/* Chat Panel — Drawer Retro avec bouton intégré */}
      {/* ═══════════════════════════════════════ */}
      <div
        className="fixed right-4 bottom-0 z-[50] flex flex-col w-[calc(50vw-1.5rem)] md:w-[400px] h-[45vh] md:h-[450px] transition-transform duration-200 ease-linear"
        style={{
          backgroundColor: colors.brand.white,
          clipPath: pixelClipPath,
          // Si ouvert : position normale (0). Si fermé : descend de 100% de sa taille moins la hauteur du header (3rem/48px)
          transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 3rem))',
        }}
      >
        {/* Header clickable (fait office de bouton d'ouverture/fermeture) */}
        <button
          onClick={toggleOpen}
          className="flex items-center justify-between px-4 h-12 w-full shrink-0 outline-none hover:brightness-110"
          style={{ backgroundColor: colors.brand.red }}
          aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-white tracking-wide uppercase ml-2">
              Messagerie
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isSolo && messages.length > 0 && !isOpen && (
              <span
                className="w-6 h-6 font-bold flex items-center justify-center font-display"
                style={{ color: colors.brand.yellow }}
              >
                {messages.length > 9 ? '9+' : messages.length + '!'}
              </span>
            )}
            <span className="text-white text-sm font-bold">
              {isOpen ? '▼' : '▲'}
            </span>
          </div>
        </button>

        {/* Solo invite section */}
        {isSolo && sessionCode && (
          <div className="px-4 py-3 shrink-0 bg-gray-100">
            <p className="font-heading text-xs text-gray-600 mb-2 uppercase tracking-wide">
              Code de session
            </p>
            <div className="flex items-center gap-2">
              <span
                className="flex-1 text-center font-display text-sm tracking-[0.3em] px-3 py-2 select-all"
                style={{
                  backgroundColor: colors.brand.yellow + '30',
                  color: colors.ui.textPrimary,
                }}
              >
                {sessionCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 font-heading text-xs font-semibold hover:brightness-110 shrink-0"
                style={{
                  backgroundColor: copied ? '#22c55e' : colors.brand.red,
                  color: colors.brand.white,
                }}
              >
                {copied ? '✓ Copié' : '📋 Copier'}
              </button>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3" style={{ backgroundColor: colors.brand.white }}>
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-heading text-sm text-gray-400 text-center px-4 uppercase">
                {isSolo
                  ? 'En attente d\'un adversaire…'
                  : "Aucun message."}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] ${msg.isOwn ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {!msg.isOwn && (
                  <span className="font-heading text-xs text-gray-500 mb-1 font-semibold uppercase">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className="px-3 py-2 font-heading text-sm leading-snug break-words rounded-none shadow-sm"
                  style={
                    msg.isOwn
                      ? { backgroundColor: colors.brand.red, color: colors.brand.white }
                      : { backgroundColor: colors.ui.grayLight, color: colors.ui.textPrimary }
                  }
                >
                  {msg.text}
                </div>
                <span className="font-heading text-[10px] text-gray-400 mt-1 uppercase">
                  {msg.timestamp}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — Bottom */}
        {!isSolo && (
          <form
            onSubmit={handleSend}
            className="shrink-0 flex gap-2 px-4 py-3"
            style={{ backgroundColor: colors.brand.white }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Message…"
              maxLength={500}
              className="flex-1 px-3 py-2 font-heading text-sm outline-none rounded-none"
              style={{ backgroundColor: colors.ui.grayLight, color: colors.ui.textPrimary }}
            />
            <PixelButton
              type="submit"
              disabled={!inputText.trim()}
              className='mb-1'
              innerClassName="flex items-center justify-center  font-heading text-sm font-bold w-full h-full px-3 py-2"
              colorBorder={colors.brand.redDeep}
              colorLight={colors.brand.redLight}
              colorDark={colors.brand.redDark}
              color={colors.brand.red}
              style={{ color: '#fff' }}
              clipPath={pixelClipPathSm}
            >
              ▶
            </PixelButton>
          </form>
        )}
      </div>

      {/* Overlay — Mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[40] md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}