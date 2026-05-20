import { useEffect, useRef } from 'react'
import { useChenStore } from '../store/chenStore'
import { colors } from '../design/colors'
import oakChibi from './images/oak-chibi.png'

const pixelClipPath = `polygon(
  16px 0px, calc(100% - 16px) 0px,
  calc(100% - 16px) 4px, calc(100% - 8px) 4px, calc(100% - 8px) 8px, calc(100% - 4px) 8px, calc(100% - 4px) 16px, 100% 16px,
  100% calc(100% - 16px),
  calc(100% - 4px) calc(100% - 16px), calc(100% - 4px) calc(100% - 8px), calc(100% - 8px) calc(100% - 8px), calc(100% - 8px) calc(100% - 4px), calc(100% - 16px) calc(100% - 4px), calc(100% - 16px) 100%,
  16px 100%,
  16px calc(100% - 4px), 8px calc(100% - 4px), 8px calc(100% - 8px), 4px calc(100% - 8px), 4px calc(100% - 16px), 0px calc(100% - 16px),
  0px 16px,
  4px 16px, 4px 8px, 8px 8px, 8px 4px, 16px 4px
)`

const AUTO_CLOSE_DELAY = 5000

export default function ChenPanel() {
  const { isOpen, messages, toggleOpen, setOpen } = useChenStore()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  // Ouvrir automatiquement et fermer après AUTO_CLOSE_DELAY
  useEffect(() => {
    if (messages.length === 0) return

    setOpen(true)

    if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    autoCloseTimerRef.current = setTimeout(() => setOpen(false), AUTO_CLOSE_DELAY)

    return () => {
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current)
    }
  }, [messages.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close panel when clicking/tapping outside
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target
      if (!containerRef.current || !(target instanceof Node)) return
      if (!containerRef.current.contains(target)) {
        setOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [isOpen, setOpen])

  return (
    <div
      ref={containerRef}
      className="fixed left-4 bottom-0 z-50 flex flex-col w-[calc(100vw-2rem)] md:w-[380px] h-[50vh] md:h-[400px] transition-transform duration-200 ease-linear"
      style={{
        backgroundColor: colors.brand.white,
        clipPath: pixelClipPath,
        transform: isOpen ? 'translateY(0)' : 'translateY(calc(100% - 3rem))',
      }}
    >
      {/* Header cliquable */}
      <button
        onClick={toggleOpen}
        className="flex items-center justify-between px-4 h-12 w-full shrink-0 outline-none hover:brightness-110"
        style={{ backgroundColor: colors.brand.yellow }}
        aria-label={isOpen ? 'Fermer les indices du Prof. Chen' : 'Ouvrir les indices du Prof. Chen'}
      >
        <div className="flex items-center gap-2">
          <img
            src={oakChibi}
            alt="Prof. Chen"
            className="w-7 h-7"
            style={{ imageRendering: 'pixelated' }}
          />
          <span
            className="font-display tracking-wide uppercase ml-1"
            style={{ color: colors.ui.textPrimary }}
          >
            Prof. Chen
          </span>
          {/* Badge visible quand le panel est fermé */}
          {messages.length > 0 && !isOpen && (
            <span
              className="w-6 h-6 text-[11px] font-bold flex items-center justify-center"
              style={{ backgroundColor: colors.brand.red, color: colors.brand.white }}
            >
              {messages.length > 9 ? '9+' : messages.length}
            </span>
          )}
        </div>
        <span className="text-sm font-bold" style={{ color: colors.ui.textPrimary }}>
          {isOpen ? '▼' : '▲'}
        </span>
      </button>

      {/* Zone des messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-4"
        style={{ backgroundColor: colors.brand.white }}
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="font-heading text-sm text-gray-400 text-center px-4 uppercase">
              Le professeur s'exprimera après chaque mauvaise réponse.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-start gap-2">
                <img
                  src={oakChibi}
                  alt="Prof. Chen"
                  className="w-8 h-8 shrink-0 mt-0.5"
                  style={{ imageRendering: 'pixelated' }}
                />
                <p
                  className="font-heading text-sm leading-snug"
                  style={{ color: colors.brand.red }}
                >
                  {msg.text}
                </p>
              </div>

              {msg.proximityResult && (
                <div className="flex flex-wrap gap-1.5 pl-10">
                  {msg.proximityResult.hasPerfectTypeMatch ? (
                    <span className="inline-flex items-center bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 border border-green-200 font-heading font-bold uppercase tracking-wide">
                      Types exacts
                    </span>
                  ) : msg.proximityResult.hasOneTypeInCommon ? (
                    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 border border-blue-200 font-heading font-bold uppercase tracking-wide">
                      1 Type en commun
                    </span>
                  ) : null}

                  {msg.proximityResult.hasSameGeneration && (
                    <span className="inline-flex items-center bg-yellow-100 text-yellow-800 text-[10px] px-1.5 py-0.5 border border-yellow-200 font-heading font-bold uppercase tracking-wide">
                      Même Génération
                    </span>
                  )}

                  {msg.proximityResult.isInSameEvolutionChain && (
                    <span className="inline-flex items-center bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 border border-purple-200 font-heading font-bold uppercase tracking-wide">
                      Même Famille
                    </span>
                  )}
                </div>
              )}

              {msg.partialMatchTypeFr && (
                <div className="flex flex-wrap gap-1.5 pl-10">
                  <span className="inline-flex items-center bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 border border-green-200 font-heading font-bold uppercase tracking-wide">
                    ✓ Type trouvé : {msg.partialMatchTypeFr}
                  </span>
                </div>
              )}

              <span className="font-heading text-[10px] text-gray-400 uppercase pl-10">
                {msg.timestamp}
              </span>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
