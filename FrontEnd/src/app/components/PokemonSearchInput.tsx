import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { colors } from '../design/colors'

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
      setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
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
      <input
        type="text"
        value={value}
        onChange={(e) => { onChange(e.target.value); setShowDropdown(true) }}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="font-body w-full px-3 py-2.5 border border-gray-300 rounded-xl text-base focus:outline-none focus:ring-2 transition disabled:opacity-50"
        style={{ '--tw-ring-color': colors.brand.blue + '33' } as React.CSSProperties}
      />

      {showDropdown && items.length > 0 && createPortal(
        <div
          ref={portalRef}
          className="max-h-72 overflow-y-auto bg-white border-2 rounded-xl shadow-lg"
          style={{
            position: 'fixed',
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            width: `${dropdownPos.width}px`,
            zIndex: 9999,
            borderColor: colors.brand.blue,
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleSelect(item)}
              className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
            >
              {item.pokedexNumber !== undefined && (
                <span className="text-gray-400 text-sm min-w-[48px]">#{item.pokedexNumber}</span>
              )}
              <span className="font-medium text-gray-900">{item.nameFr}</span>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}
