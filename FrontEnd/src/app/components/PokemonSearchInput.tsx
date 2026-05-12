import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { colors } from '../design/colors'
import SubCard from './SubCard'

export interface SearchableItem {
  id: number | string
  nameFr: string
  pokedexNumber?: number
}

interface PokemonSearchInputProps<T extends SearchableItem> {
  items: T[]
  value: string
  onChange: (value: string) => void
  onSelect: (item: T) => void
  disabled?: boolean
  placeholder?: string
}

export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export default function PokemonSearchInput<T extends SearchableItem>({
  items,
  value,
  onChange,
  onSelect,
  disabled = false,
  placeholder = 'Rechercher...',
}: PokemonSearchInputProps<T>) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 })
  const [activeIndex, setActiveIndex] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // NOUVEAU : Références pour régler le conflit souris/clavier
  const ignoreMouseEvents = useRef(false)
  const lastMousePos = useRef({ x: 0, y: 0 })

  function updatePos() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width })
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        (!portalRef.current || !portalRef.current.contains(e.target as Node))
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (showDropdown) updatePos()
  }, [showDropdown, value])

  useEffect(() => {
    if (!showDropdown) return
    window.addEventListener('scroll', updatePos, true)
    return () => window.removeEventListener('scroll', updatePos, true)
  }, [showDropdown])

  // NOUVEAU : On réinitialise à 0 SEULEMENT quand le texte cherché change,
  // ça évite des bugs de reset si le parent re-rend le tableau `items`
  useEffect(() => {
    setActiveIndex(0)
  }, [value])

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, items.length)
  }, [items])

  useEffect(() => {
    if (showDropdown && itemRefs.current[activeIndex]) {
      itemRefs.current[activeIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'auto',
      })
    }
  }, [activeIndex, showDropdown])

  function handleSelect(item: T) {
    onSelect(item)
    setShowDropdown(false)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showDropdown && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setShowDropdown(true)
      return
    }

    // NOUVEAU : On navigue au clavier, on dit au composant d'ignorer la souris
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      ignoreMouseEvents.current = true
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (activeIndex < items.length - 1) {
          setActiveIndex((prev) => prev + 1)
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (activeIndex > 0) {
          setActiveIndex((prev) => prev - 1)
        }
        break
      case 'Enter':
        e.preventDefault()
        if (showDropdown && items.length > 0) {
          handleSelect(items[activeIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        break
    }
  }

  // NOUVEAU : Cette fonction vérifie si la souris a VRAIMENT bougé à l'écran
  function handleMouseMove(e: React.MouseEvent) {
    if (e.clientX !== lastMousePos.current.x || e.clientY !== lastMousePos.current.y) {
      lastMousePos.current = { x: e.clientX, y: e.clientY }
      ignoreMouseEvents.current = false // La souris a bougé, on la réécoute !
    }
  }

  const shouldShowDropdown = showDropdown && (items.length > 0 || value.trim() !== '')

  return (
    <div ref={containerRef} className="relative">
      <SubCard
        borderColor={colors.ui?.grayMid || '#d1d5db'}
        bodyColor="white"
        borderThickness="p-[2px]"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls="pokemon-listbox"
          aria-activedescendant={showDropdown && items.length > 0 ? `pokemon-option-${activeIndex}` : undefined}
          className="font-heading w-full px-3 py-2.5 text-base focus:outline-none bg-transparent disabled:opacity-50 transition-colors"
        />
      </SubCard>

      {shouldShowDropdown && createPortal(
        <div
          ref={portalRef}
          className="drop-shadow-lg"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 2000,
          }}
          role="listbox"
          id="pokemon-listbox"
          onMouseMove={handleMouseMove} 
        >
          <SubCard
            borderColor={colors.brand?.blue || '#3b82f6'}
            bodyColor="white"
            borderThickness="p-[2px]"
            className="max-h-72 overflow-y-auto custom-scrollbar"
          >
            {items.length > 0 ? (
              items.map((item, index) => {
                const isActive = index === activeIndex
                return (
                  <div
                    key={item.id}
                    ref={(el) => (itemRefs.current[index] = el)}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => {
                      if (!ignoreMouseEvents.current) {
                        setActiveIndex(index)
                      }
                    }}
                    role="option"
                    aria-selected={isActive}
                    id={`pokemon-option-${index}`}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors`}
                    style={{
                      backgroundColor: isActive ? colors.ui.grayMid : 'transparent'
                    }}
                  >
                    {item.pokedexNumber !== undefined && (
                      <span className="text-gray-400 font-heading text-sm min-w-[48px]"
                        style={{ color: isActive ? colors.ui.grayBorderDark : colors.ui.grayMid }}>
                        #{item.pokedexNumber}
                      </span>
                    )}
                    <span className="font-heading font-medium text-gray-900">
                      {item.nameFr}
                      {isActive && (
                        <span className="ml-2" style={{ color : colors.ui.grayBorderDark }} aria-hidden="true">◀</span>
                      )}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="px-4 py-3 text-center text-gray-500 font-heading">
                Aucun résultat
              </div>
            )}
          </SubCard>
        </div>,
        document.body
      )}
    </div>
  )
}