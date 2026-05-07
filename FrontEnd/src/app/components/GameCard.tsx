import { useNavigate } from "react-router";
import { PokeballDecor } from "./Pokeball";

interface GameCardProps {
  title: string;
  description: string;
  /** Couleur de fond de la carte — utiliser `colors.brand.xxx` depuis design/colors.ts */
  color: string;
  icon?: string;
  to: string;
  image?: string;
  /** Si fourni, remplace la navigation par cet handler au clic */
  onClick?: () => void;
  /** Couleur secondaire pour les bordures (par défaut: 'black') */
  secondColor?: string;
}

export default function GameCard({
  title,
  description,
  color,
  icon,
  to,
  image,
  onClick,
  secondColor,
}: GameCardProps) {
  const navigate = useNavigate();

  const gapSize = "1%";

  // Découpe générant 5 marches symétriques (style pixelisé)
  const pixelClipPath = `polygon(
    28px 0px, calc(100% - 28px) 0px, 
    calc(100% - 28px) 4px, calc(100% - 20px) 4px, calc(100% - 20px) 8px, calc(100% - 12px) 8px, calc(100% - 12px) 12px, calc(100% - 8px) 12px, calc(100% - 8px) 20px, calc(100% - 4px) 20px, calc(100% - 4px) 28px, 100% 28px, 
    100% calc(100% - 28px), 
    calc(100% - 4px) calc(100% - 28px), calc(100% - 4px) calc(100% - 20px), calc(100% - 8px) calc(100% - 20px), calc(100% - 8px) calc(100% - 12px), calc(100% - 12px) calc(100% - 12px), calc(100% - 12px) calc(100% - 8px), calc(100% - 20px) calc(100% - 8px), calc(100% - 20px) calc(100% - 4px), calc(100% - 28px) calc(100% - 4px), calc(100% - 28px) 100%, 
    28px 100%, 
    28px calc(100% - 4px), 20px calc(100% - 4px), 20px calc(100% - 8px), 12px calc(100% - 8px), 12px calc(100% - 12px), 8px calc(100% - 12px), 8px calc(100% - 20px), 4px calc(100% - 20px), 4px calc(100% - 28px), 0px calc(100% - 28px), 
    0px 28px, 
    4px 28px, 4px 20px, 8px 20px, 8px 12px, 12px 12px, 12px 8px, 20px 8px, 20px 4px, 28px 4px
  )`;

  return (
    <button
      onClick={() => onClick ? onClick() : navigate(to)}
      className="relative w-full text-left cursor-pointer flex items-stretch"
    >
      {/* PARTIE GAUCHE — Image ou icône */}
      <div
        className="hidden md:flex items-center justify-center shrink-0 drop-shadow-[6px_6px_0px_rgba(0,0,0,0.8)] hover:drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:translate-x-1 hover:translate-y-1 active:drop-shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-none w-40 md:w-52"
        style={{
          backgroundColor: color,
          border: `4px solid ${secondColor || "black"}`,
          clipPath: pixelClipPath,
        }}
      >
        {image ? (
          <img 
            src={image} 
            alt={title} 
            style={{ imageRendering: "pixelated" }}
            className="w-32 md:w-40 h-auto object-contain" 
          />
        ) : (
          <span className="text-5xl md:text-6xl">{icon}</span>
        )}
      </div>

      {/* GAP VIDE — 1% de la largeur (desktop seulement) */}
      <div className="hidden md:block" style={{ width: gapSize, flexShrink: 0 }} />

      {/* PARTIE DROITE — Texte */}
      <div
        className="flex flex-col justify-center flex-1 p-6 md:p-8 overflow-hidden relative drop-shadow-[6px_6px_0px_rgba(0,0,0,0.8)] hover:drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:translate-x-1 hover:translate-y-1 active:drop-shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-none"
        style={{
          backgroundColor: color,
          border: `4px solid ${secondColor || "black"}`,
          clipPath: pixelClipPath,
        }}
      >
        <PokeballDecor
          size={130}
          opacity={0.15}
          className="absolute top-1/2 right-6 -translate-y-1/2"
        />
        <h2 className="font-mono uppercase font-bold text-3xl tracking-widest text-white mb-3 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.6)]">
          {title}
        </h2>
        <p className="font-mono text-white/90 text-base md:text-lg leading-relaxed drop-shadow-[1px_1px_0px_rgba(0,0,0,0.4)]">
          {description}
        </p>
      </div>
    </button>
  );
}