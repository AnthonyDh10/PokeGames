import { useState, useEffect, useRef, useCallback } from 'react'
import { useChatStore } from '../store/chatStore'
import { useSessionStore } from '../store/sessionStore'
import { chatService } from '../services/chatService'
import { colors } from '../design/colors'

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
    return () => {
      // Don't disconnect on every re-render, only when component unmounts entirely
    }
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

  // Don't render if there's no active partie
  if (!partieId) return null

  return (
    <>
      {/* Toggle tab — always visible on the right edge */}
      <button
        onClick={toggleOpen}
        aria-label={isOpen ? 'Fermer le chat' : 'Ouvrir le chat'}
        className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-1 py-4 px-1.5 rounded-l-xl shadow-lg transition-all duration-200"
        style={{
          backgroundColor: colors.brand.red,
          color: '#fff',
          writingMode: 'vertical-rl',
        }}
      >
        <span className="text-xs font-bold tracking-widest" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
          {isOpen ? '▶' : '◀'} Chat
        </span>
        {!isSolo && messages.length > 0 && !isOpen && (
          <span
            className="absolute -top-1 -left-1 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: colors.brand.yellow, color: colors.ui.textPrimary }}
          >
            {messages.length > 9 ? '9+' : messages.length}
          </span>
        )}
      </button>

      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-full flex flex-col shadow-2xl transition-transform duration-300"
        style={{
          width: '320px',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          backgroundColor: '#fff',
          borderLeft: `3px solid ${colors.brand.redDark}`,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ backgroundColor: colors.brand.red }}
        >
          <span className="font-heading text-white text-base tracking-wide">💬 Chat</span>
          <button
            onClick={() => setOpen(false)}
            className="text-white hover:text-yellow-200 transition text-xl leading-none"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Solo invite section */}
        {isSolo && sessionCode && (
          <div className="px-4 py-4 border-b border-gray-100 shrink-0">
            <p className="font-body text-sm text-gray-500 mb-2">
              Tu es seul pour l'instant. Invite un ami avec ce code :
            </p>
            <div className="flex items-center gap-2">
              <span
                className="flex-1 text-center font-display text-sm tracking-[0.3em] rounded-lg px-3 py-2 select-all"
                style={{ backgroundColor: colors.brand.yellow + '33', color: colors.ui.textPrimary }}
              >
                {sessionCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="px-3 py-2 rounded-lg font-body text-sm font-semibold transition shrink-0"
                style={{
                  backgroundColor: copied ? '#22c55e' : colors.brand.red,
                  color: '#fff',
                }}
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          {messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="font-body text-sm text-gray-400 text-center px-4">
                {isSolo
                  ? 'Le chat sera disponible quand un adversaire rejoindra la partie.'
                  : "Aucun message pour l\u2019instant. Dites bonjour ! 👋"}
              </p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] ${msg.isOwn ? 'self-end items-end' : 'self-start items-start'}`}
              >
                {!msg.isOwn && (
                  <span className="font-body text-xs text-gray-400 mb-0.5 ml-1">{msg.senderName}</span>
                )}
                <div
                  className="px-3 py-1.5 rounded-2xl font-body text-sm leading-snug break-words"
                  style={
                    msg.isOwn
                      ? { backgroundColor: colors.brand.red, color: '#fff', borderBottomRightRadius: '4px' }
                      : { backgroundColor: '#f3f4f6', color: '#111827', borderBottomLeftRadius: '4px' }
                  }
                >
                  {msg.text}
                </div>
                <span className="font-body text-[10px] text-gray-400 mt-0.5 mx-1">{msg.timestamp}</span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!isSolo && (
          <form
            onSubmit={handleSend}
            className="shrink-0 flex gap-2 px-3 py-3 border-t border-gray-100"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrire un message…"
              maxLength={500}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 font-body text-sm outline-none focus:ring-2 transition"
              style={{ '--tw-ring-color': colors.brand.red } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="px-3 py-2 rounded-xl font-body text-sm font-semibold transition disabled:opacity-40"
              style={{ backgroundColor: colors.brand.red, color: '#fff' }}
            >
              ➤
            </button>
          </form>
        )}
      </div>

      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          onClick={() => setOpen(false)}
        />
      )}
    </>
  )
}
