import { colors } from "../design/colors";

interface PokeballProps {
  onClick?: () => void;
  className?: string;
}

interface PokeballDecorProps {
  size?: number;
  opacity?: number;
  color?: string;
  className?: string;
}

export function PokeballDecor({ size = 90, opacity = 0.10, color = colors.brand.white, className = '' }: PokeballDecorProps) {
  const stroke = Math.max(2, size * 0.04);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`pointer-events-none ${className}`}
      style={{ opacity }}
    >
      {/* Cercle extérieur */}
      <circle cx="50" cy="50" r={50 - stroke / 2} stroke={color} strokeWidth={stroke} />

      {/* Ligne horizontale centrale */}
      <line x1={stroke / 2} y1="50" x2={100 - stroke / 2} y2="50" stroke={color} strokeWidth={stroke} />

      {/* Bouton central — plein */}
      <circle cx="50" cy="50" r="14" fill={color} />
    </svg>
  );
}

export default function Pokeball({ onClick, className = '' }: PokeballProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative w-14 h-14 bg-white rounded-full border-[3px] border-gray-900 shadow-inner overflow-hidden cursor-pointer hover:rotate-12 transition-transform duration-300 ${className}`}
    >
      {/* Moitié Rouge (Top) */}
      <div
        className="absolute top-0 left-0 w-full h-1/2 border-b-[3px] border-gray-900"
        style={{ backgroundColor: colors.brand.pokeballRed }}
      ></div>

      {/* Reflet de brillance (Glossy effect) pour le réalisme */}
      <div className="absolute top-1 left-2 w-4 h-2 bg-white/30 rounded-full rotate-[-20deg]"></div>

      {/* Bouton Central */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        {/* Cercle noir extérieur */}
        <div className="w-5 h-5 bg-gray-900 rounded-full flex items-center justify-center">
          {/* Cercle blanc intérieur */}
          <div className="w-3 h-3 bg-white rounded-full border-[1.5px] border-gray-300 shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}
