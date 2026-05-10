import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { colors } from '../design/colors'
import SubCard from './SubCard' // Assure-toi que le chemin est correct

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
    .normalize('NFD') // Sépare les lettres de leurs accents (ex: 'è' devient 'e' + '̀')
    .replace(/[\u0300-\u036f]/g, '') // Supprime tous les accents
    .toLowerCase(); // Met tout en minuscules
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
  const containerRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  function updatePos() {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      // J'ai légèrement augmenté l'espace (8 au lieu de 4) pour bien séparer les SubCards
      setDropdownPos({ top: rect.bottom + 8, left: rect.left, width: rect.width })
    }
  }

  // Outside click
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

  // Recalculate position when dropdown opens or value changes
  useEffect(() => {
    if (showDropdown) updatePos()
  }, [showDropdown, value])

  // Follow scroll while dropdown is open
  useEffect(() => {
    if (!showDropdown) return
    window.addEventListener('scroll', updatePos, true)
    return () => window.removeEventListener('scroll', updatePos, true)
  }, [showDropdown])

  function handleSelect(item: T) {
    onSelect(item)
    setShowDropdown(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Input enveloppé dans une SubCard pour rester cohérent avec le design pixelisé */}
      <SubCard
        borderColor={colors.ui?.grayMid || '#d1d5db'}
        bodyColor="white"
        borderThickness="p-[2px]"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="font-body w-full px-3 py-2.5 text-base focus:outline-none bg-transparent disabled:opacity-50 transition-colors"
        />
      </SubCard>

      {/* Portal pour la liste */}
      {showDropdown && items.length > 0 && createPortal(
        <div
          ref={portalRef}
          className="drop-shadow-lg" // Utilisation de drop-shadow pour que l'ombre respecte le clip-path de SubCard
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 2000,
          }}
        >
          <SubCard
            borderColor={colors.brand.blue}
            bodyColor="white"
            borderThickness="p-[2px]"
            className="max-h-72 overflow-y-auto custom-scrollbar"
          >
            {items.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                {item.pokedexNumber !== undefined && (
                  <span className="text-gray-400 font-body text-sm min-w-[48px]">#{item.pokedexNumber}</span>
                )}
                <span className="font-body font-medium text-gray-900">{item.nameFr}</span>
              </div>
            ))}
          </SubCard>
        </div>,
        document.body
      )}
    </div>
  )
}