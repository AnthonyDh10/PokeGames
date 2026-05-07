import { useMemo } from "react";
import { useNavigate } from "react-router";
import Pokeball from "../components/images/pokéball_face.png";
import { colors } from "../design/colors";
import "../../styles/sidebar-retro.css";

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
    if (window.innerWidth < 768) {
      onToggleSidebar();
    } else {
      navigate("/");
    }
  };
  // Génère les clip-paths polygon qui tracent la diagonale en "escalier":
  // - leftClip : la partie gauche (forme principale)
  // - rightClip: la partie droite (complémentaire) utilisée pour l'ombre de la fine barre
  const { leftClip, rightClip } = useMemo(() => {
    // Symétrie axiale verticale: inverse la direction de l'escalier
    const topX = split + diagonalOffset / 2;
    const bottomX = split - diagonalOffset / 2;
    const dx = bottomX - topX;

    const leftPoints: string[] = [];
    leftPoints.push(`0% 0%`);
    leftPoints.push(`${topX}% 0%`);

    for (let i = 0; i < steps; i++) {
      const y = ((i + 1) / steps) * 100;
      const xPrev = topX + (i / steps) * dx;
      const xNext = topX + ((i + 1) / steps) * dx;
      leftPoints.push(`${xPrev}% ${y}%`);
      leftPoints.push(`${xNext}% ${y}%`);
    }

    leftPoints.push(`0% 100%`);
    const leftClip = `polygon(${leftPoints.join(",")})`;

    // Build right-side polygon (complement of left) so the thin-bar shadow
    // can be shown on the transparent/right side of the header.
    const rightPoints: string[] = [];
    rightPoints.push(`${topX}% 0%`);
    rightPoints.push(`100% 0%`);
    rightPoints.push(`100% 100%`);
    rightPoints.push(`${bottomX}% 100%`);
    for (let i = steps - 1; i >= 0; i--) {
      const y = ((i + 1) / steps) * 100;
      const xPrev = topX + (i / steps) * dx;
      const xNext = topX + ((i + 1) / steps) * dx;
      rightPoints.push(`${xNext}% ${y}%`);
      rightPoints.push(`${xPrev}% ${y}%`);
    }
    const rightClip = `polygon(${rightPoints.join(",")})`;

    return { leftClip, rightClip };
  }, [steps, split, diagonalOffset]);

  return (
    <header
      className="w-full flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 relative retro-topbar"
      style={{
        height: "clamp(2.8rem, 10vh, 6rem)",
        // header itself stays transparent so the right side shows the page background
        backgroundColor: "transparent",
        ["--topbar-text-color" as any]: colors.ui.textOnColor,
        // remove decorative borders coming from .retro-topbar
        borderTop: "none",
        borderBottom: "none",
        // remove any shadow that produces a floating line under transparent area
        boxShadow: "none",
        WebkitBoxShadow: "none",
      } as any}
    >
      {/* Thin red bar behind TopBar — visible through the transparent area */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "clamp(2.8rem, 10vh, 3rem)",
          backgroundColor: colors.brand.red,
          zIndex: 9,
          boxShadow: "none",
        } as any}
      />

      {/* Thin bar shadow: stepped shadow matching the stair shape (slightly offset) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "clamp(2.8rem, 10vh, 3rem)",
          backgroundColor: "rgba(0,0,0,0.35)",
          clipPath: rightClip,
          WebkitClipPath: rightClip,
          transform: "translate(3px, 3px)",
          zIndex: 8,
          pointerEvents: "none",
        } as any}
      />

      {/* Left area: background + clipped shape + content */}
      <div
        className="absolute inset-0 flex items-center px-4 md:px-8"
        style={{
          backgroundColor: "transparent",
        } as any}
      >
        {/* Shadow stair: same leftClip, slightly offset to simulate shadow */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            clipPath: leftClip,
            WebkitClipPath: leftClip,
            transform: "translate(3px, 3px)",
            zIndex: 8,
            boxShadow: "none",
            WebkitBoxShadow: "none",
            pointerEvents: "none",
          } as any}
        />
        <div
          className="relative flex items-center gap-3"
          style={{
            // element covers the full header box but is clipped to the left 'stair' shape
            position: "absolute",
            inset: 0,
            backgroundColor: colors.brand.red,
            ["--topbar-text-color" as any]: colors.ui.textOnColor,
            clipPath: leftClip,
            WebkitClipPath: leftClip,
            zIndex: 10,
            // ensure no inner shadow adds an extra line
            boxShadow: "none",
            WebkitBoxShadow: "none",
            paddingLeft: "1rem",
            paddingRight: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          } as any}
        >
          <img
            src={Pokeball}
            alt="Pokéball"
            className="object-contain cursor-pointer retro-pokeball-btn"
            style={{ width: "clamp(2.5rem, 8vw, 4rem)", height: "clamp(2.5rem, 8vw, 4rem)", flexShrink: 0 }}
            onClick={handlePokeballClick}
          />

          <h2 className="font-display tracking-wide text-white uppercase"
            style={{
              fontSize: "clamp(0.9rem, 3vw, 1.875rem)",
              lineHeight: "1.2",
              marginLeft: "clamp(0.5rem, 2vw, 1rem)"
            }}>
            PokéGames
          </h2>
        </div>
      </div>
    </header>
  );
}
