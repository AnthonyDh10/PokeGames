import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { PokeballDecor } from "../primitives/Pokeball";

interface GameCardProps {
  title: ReactNode;
  description: ReactNode;
  /** Couleur de fond de la carte — utiliser `colors.brand.xxx` depuis design/colors.ts */
  color: string;
  /** Couleur claire pour l'effet de relief (bordures Haut et Gauche) */
  colorLight: string;
  /** Couleur sombre pour l'effet de relief (bordures Bas et Droite) */
  colorDark: string;
  /** Couleur du texte (ex: '#ffffff' ou 'white') — défaut: blanc */
  text_color?: string;
  /** Icône emoji affichée si `image` est absent. */
  icon?: string;
  /** Route vers laquelle naviguer au clic. */
  to: string;
  /** Image affichée côté gauche de la carte (sprite Pokémon, logo jeu…). */
  image?: string;
  /** Si fourni, remplace la navigation par cet handler au clic */
  onClick?: () => void;
  /** Couleur secondaire pour les bordures (par défaut: 'black') */
  secondColor?: string;
}

/**
 * Carte de jeu cliquable avec style rétro pixel.
 * Sur desktop (≥720px), affiche une image/icône à gauche et le contenu à droite.
 * Sur mobile, n'affiche que le bloc droit (image masquée via container query).
 */
export default function GameCard({
  title,
  description,
  color,
  colorLight,
  colorDark,
  icon,
  to,
  image,
  onClick,
  secondColor,
  text_color = "#ffffff",
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
      onClick={() => (onClick ? onClick() : navigate(to))}
      className="relative w-full text-left cursor-pointer flex items-stretch gamecard-container group"
    >
      <style>{`
        .gamecard-container { container-type: inline-size; }
        .gamecard-left { display: none; }
        .gamecard-gap { display: none; }
        @container (min-width: 720px) {
          .gamecard-left { display: flex; }
          .gamecard-gap { display: block; }
        }
      `}</style>
      
      {/* ======================================================== */}
      {/* PARTIE GAUCHE — Image ou icône                             */}
      {/* ======================================================== */}
      <div
        className="gamecard-left flex-col shrink-0 drop-shadow-[6px_6px_0px_rgba(0,0,0,0.8)] hover:drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:translate-x-1 hover:translate-y-1 active:drop-shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-none w-40 md:w-52 p-[4px]"
        style={{
          backgroundColor: secondColor || "black",
          clipPath: pixelClipPath,
        }}
      >
        {/* Bordure Lumière (Haut & Gauche) */}
        <div
          className="flex flex-col flex-1 pt-[4px] pl-[4px]"
          style={{
            backgroundColor: colorLight,
            clipPath: pixelClipPath,
          }}
        >
          {/* Bordure Ombre (Bas & Droite) */}
          <div
            className="flex flex-col flex-1 pr-[4px] pb-[4px]"
            style={{
              backgroundColor: colorDark,
              clipPath: pixelClipPath,
            }}
          >
            {/* Contenu GAUCHE — Fond interne */}
            <div
              className="flex-1 flex items-center justify-center w-full h-full"
              style={{
                backgroundColor: color,
                clipPath: pixelClipPath,
              }}
            >
              {image ? (
                <img
                  src={image}
                  alt={typeof title === "string" ? title : ""}
                  style={{ imageRendering: "pixelated" }}
                  className="w-32 md:w-40 h-auto object-contain"
                />
              ) : (
                <span className="text-5xl md:text-6xl">{icon}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GAP VIDE — 1% de la largeur (desktop seulement) */}
      <div className="gamecard-gap" style={{ width: gapSize, flexShrink: 0 }} />

      {/* ======================================================== */}
      {/* PARTIE DROITE — Texte                                      */}
      {/* ======================================================== */}
      <div
        className="flex flex-col flex-1 drop-shadow-[6px_6px_0px_rgba(0,0,0,0.8)] hover:drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:translate-x-1 hover:translate-y-1 active:drop-shadow-none active:translate-x-[6px] active:translate-y-[6px] transition-none p-[4px]"
        style={{
          backgroundColor: secondColor || "black",
          clipPath: pixelClipPath,
        }}
      >
        {/* Bordure Lumière (Haut & Gauche) */}
        <div
          className="flex flex-col flex-1 pt-[4px] pl-[4px]"
          style={{
            backgroundColor: colorLight,
            clipPath: pixelClipPath,
          }}
        >
          {/* Bordure Ombre (Bas & Droite) */}
          <div
            className="flex flex-col flex-1 pr-[4px] pb-[4px]"
            style={{
              backgroundColor: colorDark,
              clipPath: pixelClipPath,
            }}
          >
            {/* Contenu DROIT — Fond interne */}
            <div
              className="flex-1 font-heading flex flex-col justify-center p-4 md:p-6 overflow-hidden relative"
              style={{
                backgroundColor: color,
                clipPath: pixelClipPath,
              }}
            >
              <PokeballDecor
                size={130}
                opacity={0.15}
                className="absolute top-1/2 right-6 -translate-y-1/2"
                color={text_color}
              />
              <h2
                className="font-display uppercase font-bold text-2xl tracking-wide mb-3 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.6)]"
                style={{ color: text_color }}
              >
                {title}
              </h2>
              <p
                className="font-body text-base md:text-lg leading-relaxed drop-shadow-[1px_1px_0px_rgba(0,0,0,0.4)]"
                style={{ color: text_color, opacity: 0.9 }}
              >
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}