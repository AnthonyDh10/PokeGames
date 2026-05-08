import { useMemo } from "react";
import { useNavigate } from "react-router";
import Pokeball from "../components/images/pokéball_face.png";
import { colors } from "../design/colors";

interface TopBarProps {
  onToggleSidebar: () => void;
  /** Nombre de marches pour l'escalier (ex: 8, 10) */
  steps?: number;
  /** Position centrale de la séparation en pourcentage (default 50) */
  split?: number;
  /** Décalage total en pourcentage entre le point haut et bas (ex: 8 => +/-4%) */
  diagonalOffset?: number;
}

export default function TopBar({
  onToggleSidebar,
  steps = 30,
  split = 70,
  diagonalOffset = 12,
}: TopBarProps) {
  const navigate = useNavigate();

  const handlePokeballClick = () => {
    // Utilisation de la largeur standard des breakpoints Tailwind (md = 768px)
    if (window.innerWidth < 768) {
      onToggleSidebar();
    } else {
      navigate("/");
    }
  };

  // Tailles fluides (Responsive)
  const sidebarWidth = "clamp(3.75rem, 12vw, 8rem)";
  const pokeballSize = "clamp(2.25rem, 8vw, 4.8rem)";
  const topbarHeight = "clamp(2.8rem, 10vh, 6rem)";

  // Génération du clip-path polygon (forme d'escalier gauche)
  const leftClip = useMemo(() => {
    const topX = split + diagonalOffset / 2;
    const bottomX = split - diagonalOffset / 2;
    const dx = bottomX - topX;

    const leftPoints: string[] = ["0% 0%", `${topX}% 0%`];

    for (let i = 0; i < steps; i++) {
      const y = ((i + 1) / steps) * 100;
      const xPrev = topX + (i / steps) * dx;
      const xNext = topX + ((i + 1) / steps) * dx;
      leftPoints.push(`${xPrev}% ${y}%`, `${xNext}% ${y}%`);
    }

    leftPoints.push("0% 100%");
    return `polygon(${leftPoints.join(",")})`;
  }, [steps, split, diagonalOffset]);

  return (
    <header 
      className="relative w-full flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 z-[100]"
      style={{ height: topbarHeight }}
    >
      {/* Fine barre rouge en arrière-plan (visible sur la partie droite transparente) */}
      <div
        className="absolute left-0 right-0 top-0 z-0"
        style={{ height: "clamp(2.8rem, 10vh, 3rem)", backgroundColor: colors.brand.red }}
      />

      {/* Zone de gauche : Fond rouge coupé en escalier + Titre */}
      <div
        className="absolute inset-0 z-10 flex items-center"
        style={{
          backgroundColor: colors.brand.red,
          clipPath: leftClip,
          WebkitClipPath: leftClip,
        }}
      >
        <h2 
          className="font-display tracking-wide text-white uppercase"
          style={{
            fontSize: "clamp(0.9rem, 3vw, 1.875rem)",
            // Décalage calculé pour laisser la place à la Pokéball et son espacement
            marginLeft: `calc(${sidebarWidth} + clamp(0.5rem, 1vw, 2rem))`
          }}
        >
          PokéGames
        </h2>
      </div>

      {/* Pokéball / Bouton d'action */}
      <button
        onClick={handlePokeballClick}
        aria-label="Menu principal"
        className="absolute z-[100000] top-1/2 -translate-y-1/2 transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none"
        style={{
          // Centrage par rapport à la largeur de la sidebar
          left: `calc(${sidebarWidth} / 2 - ${pokeballSize} / 2)`,
          width: pokeballSize,
          height: pokeballSize,
        }}
      >
        <img
          src={Pokeball}
          alt=""
          className="w-full h-full object-contain"
          draggable={false}
        />
      </button>
    </header>
  );
}