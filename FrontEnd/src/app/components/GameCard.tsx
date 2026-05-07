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

  return (
    <button
      onClick={() => onClick ? onClick() : navigate(to)}
      style={{ backgroundColor: color, borderColor: secondColor ?? "black" }}
      // Remplacement des ombres floues par des ombres dures (blocks), ajout d'une bordure noire épaisse
      // et modification de l'effet de survol/clic pour un mouvement "mécanique"
      className="border-4 shadow-[6px_6px_0px_rgba(0,0,0,0.8)] hover:shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:translate-x-1 hover:translate-y-1 active:shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-none flex flex-row overflow-hidden w-full text-left cursor-pointer"
    >
      {/* Gauche — image ou icône */}
      {/* Ajout d'une bordure interne droite pour séparer les sections */}
      <div className="hidden md:flex items-center justify-center w-40 md:w-52 shrink-0 bg-black/20 border-r-4" style={{ borderRightColor: secondColor ?? "black" }}>
        {image ? (
          <img 
            src={image} 
            alt={title} 
            // Rendu pixélisé pour garder l'aspect brut si tu utilises des sprites
            style={{ imageRendering: "pixelated" }}
            className="w-32 md:w-40 h-auto object-contain" 
          />
        ) : (
          <span className="text-5xl md:text-6xl">{icon}</span>
        )}
      </div>

      {/* Droite — texte */}
      <div className="relative flex flex-col justify-center flex-1 p-6 md:p-8 overflow-hidden">
        <PokeballDecor
          size={130}
          opacity={0.15}
          className="absolute top-1/2 right-6 -translate-y-1/2"
        />
        {/* Typographie "monospace" ou pixel, avec une ombre portée dure sur le texte pour le style rétro */}
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