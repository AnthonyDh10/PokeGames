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
}

export default function GameCard({
  title,
  description,
  color,
  icon,
  to,
  image,
  onClick,
}: GameCardProps) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => onClick ? onClick() : navigate(to)}
      style={{ backgroundColor: color }}
      className="rounded-3xl shadow-[0_8px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-1 flex flex-row overflow-hidden w-full text-left cursor-pointer"
    >
      {/* Gauche — image ou icône */}
      <div className="hidden md:flex items-center justify-center w-40 md:w-52 shrink-0 bg-black/10">
        {image ? (
          <img src={image} alt={title} className="w-32 md:w-40 h-auto object-contain" />
        ) : (
          <span className="text-5xl md:text-6xl">{icon}</span>
        )}
      </div>

      {/* Droite — texte */}
      <div className="relative flex flex-col justify-center flex-1 p-6 md:p-8 overflow-hidden">
        <PokeballDecor
          size={130}
          opacity={0.10}
          className="absolute top-1/2 right-6 -translate-y-1/2"
        />
        <h2 className="font-display text-4xl tracking-wide text-white mb-3">{title}</h2>
        <p className="text-white/90 text-lg md:text-xl leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}