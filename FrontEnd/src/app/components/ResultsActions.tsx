import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import Card from './Card'

interface ResultsActionsProps {
  isSolo: boolean
  bothFinished: boolean

  // Bouton Nouvelle partie
  onNouvelle: () => void
  isCreatingNew?: boolean

  // Bouton Relancer (solo)
  onRelancer?: () => void
  isRelaunching?: boolean

  // Bouton Revanche (multi)
  onRematch?: () => void
  rematchRequested?: boolean

  // Couleurs — utilisées pour styliser la Card
  buttonColor: string
  buttonColorDark: string
  buttonColorLight: string
  buttonColorBorder: string

  menuColor?: string

  // Désactiver "Nouvelle partie" tant que bothFinished est false
  requireFinishedForNewGame?: boolean
}

export default function ResultsActions({
  isSolo,
  bothFinished,
  onNouvelle,
  isCreatingNew = false,
  onRelancer,
  isRelaunching = false,
  onRematch,
  rematchRequested = false,
  buttonColor,
  buttonColorDark,
  buttonColorLight,
  buttonColorBorder,
  menuColor,
  requireFinishedForNewGame = false,
}: ResultsActionsProps) {
  const navigate = useNavigate()
  const [selectedIndex, setSelectedIndex] = useState(0)

  // 1. On génère dynamiquement la liste des choix disponibles
  const options = useMemo(() => {
    const opts = []

    // Option 1 : Relancer (Solo) ou Revanche (Multi)
    if (isSolo && bothFinished && onRelancer) {
      opts.push({
        id: 'relancer',
        label: isRelaunching ? 'LANCEMENT...' : 'RELANCER',
        onClick: onRelancer,
        disabled: isRelaunching,
      })
    } else if (!isSolo && bothFinished && onRematch) {
      opts.push({
        id: 'revanche',
        label: rematchRequested ? 'EN ATTENTE...' : 'REVANCHE',
        onClick: onRematch,
        disabled: rematchRequested,
      })
    }

    // Option 2 : Nouvelle partie
    opts.push({
      id: 'nouvelle',
      label: isCreatingNew ? 'CRÉATION...' : 'NOUVELLE PARTIE',
      onClick: onNouvelle,
      disabled: (requireFinishedForNewGame && !bothFinished) || isCreatingNew,
    })

    // Option 3 : Menu principal
    opts.push({
      id: 'menu',
      label: 'MENU PRINCIPAL',
      onClick: () => navigate('/home'),
      disabled: false,
    })

    return opts
  }, [
    isSolo, bothFinished, onRelancer, isRelaunching, 
    onRematch, rematchRequested, isCreatingNew, 
    requireFinishedForNewGame, onNouvelle, navigate
  ])

  // Sécurité : si le nombre d'options change (ex: bothFinished devient true)
  useEffect(() => {
    if (selectedIndex >= options.length) {
      setSelectedIndex(Math.max(0, options.length - 1))
    }
  }, [options.length, selectedIndex])

  // 2. Gestion de la navigation au clavier (Flèches + Entrée)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => (prev + 1) % options.length)
      } else if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => (prev - 1 + options.length) % options.length)
      } else if (e.key === 'Enter') {
        const selectedOption = options[selectedIndex]
        if (selectedOption && !selectedOption.disabled) {
          selectedOption.onClick()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [options, selectedIndex])

  return (
    <Card
      bodyColor={buttonColorDark}
      borderColor={buttonColorBorder}
      pokeballColor={menuColor}
      borderThickness="4px"
      className="w-full py-4"
    >
      <div className="flex flex-row justify-around items-center w-full min-h-[4rem]">
        {options.map((opt, index) => {
          const isSelected = selectedIndex === index

          return (
            <div
              key={opt.id}
              onMouseEnter={() => setSelectedIndex(index)}
              onClick={() => !opt.disabled && opt.onClick()}
              className={`
                  flex items-center gap-3 cursor-pointer select-none transition-opacity
                  font-heading font-semibold tracking-wide
                  ${opt.disabled ? 'opacity-40 cursor-not-allowed' : 'opacity-100'}
                `}
                style={{
                  fontSize: '1.5rem',
                  color: (['menu', 'nouvelle', 'relancer', 'revanche'].includes(opt.id) && menuColor)
                    ? menuColor
                    : 'white',
                }}
            >
              {/* L'indicateur de sélection */}
                <span
                  style={{ visibility: isSelected ? 'visible' : 'hidden', color: opt.disabled ? buttonColorLight : 'inherit' }}
                >
                  ▶
                </span>
              
              {/* Le texte du choix */}
              <span style={{ color: opt.disabled ? buttonColorLight : 'inherit' }}>
                {opt.label}
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}