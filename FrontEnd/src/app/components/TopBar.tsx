import { useNavigate } from "react-router-dom";
import Pokeball from "../components/images/pokéball_face.png";
import { colors } from "../design/colors";

/** Props du composant `TopBar`. */
interface TopBarProps {
  /** Callback pour ouvrir/fermer la sidebar (mobile uniquement). */
  onToggleSidebar: () => void;
}

/**
 * Barre de navigation supérieure sticky.
 * Sur desktop, la Pokéball redirige vers l'accueil.
 * Sur mobile, elle ouvre/ferme la sidebar.
 */
export default function TopBar({ onToggleSidebar }: TopBarProps) {
  const navigate = useNavigate();

  const handlePokeballClick = () => {
    if (window.innerWidth < 768) {
      onToggleSidebar();
    } else {
      navigate("/");
    }
  };

  // Tailles fluides (Responsive) — valeurs synchronisées avec les variables CSS (theme.css)
  const sidebarWidth = "clamp(3.75rem, 12vw, 8rem)";
  const pokeballSize = "clamp(2.25rem, 8vw, 4.8rem)";
  const topbarHeight = "var(--topbar-height)";

  return (
    <header 
      className="sticky top-0 w-full flex items-center px-2 sm:px-4 md:px-6 lg:px-8 z-[20]"
      style={{ height: topbarHeight, backgroundColor: colors.brand.red, borderTop: `6px solid ${colors.brand.redLight}` }}
    >
      {/* Titre (cliquable) */}
      <h2
        className="font-display tracking-wide text-white uppercase"
        role="link"
        tabIndex={0}
        onClick={() => navigate("/")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate("/");
          }
        }}
        style={{
          fontSize: "clamp(0.9rem, 3vw, 1.875rem)",
          cursor: "pointer",
          // Décalage pour laisser la place à la Pokéball
          marginLeft: `calc(${sidebarWidth} + clamp(0.5rem, 1vw, 2rem))`
        }}
      >
        PokéMini Games
      </h2>

      {/* Pokéball / Bouton d'action */}
      <button
        onClick={handlePokeballClick}
        aria-label="Menu principal"
        className="absolute z-[25] top-1/2 -translate-y-1/2 transition-transform hover:scale-105 active:scale-95 cursor-pointer outline-none"
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

      {/* ══ Angle de transition (Escalier en pixels) Sidebar / TopBar ══ */}
      {/* Affiché uniquement sur desktop (md:block). Relie la bordure droite de la sidebar à la bordure basse de la topbar */}
      <div
        className="absolute z-30 hidden md:block"
        style={{
          left: sidebarWidth,
          top: "100%",
          width: "16px",
          height: "16px",
        }}
      >
        <svg 
          width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ shapeRendering: "crispEdges" }}
        >
          {/* Couche d'ombre (redDark - 6px) */}
          <path d="M0 0 H 16 V 6 H 14 V 8 H 12 V 10 H 10 V 12 H 8 V 14 H 6 V 16 H 0 Z" fill={colors.brand.redDark} />
          {/* Couche interne pleine (red - fond) */}
          <path d="M0 0 H 10 V 2 H 8 V 4 H 6 V 6 H 4 V 8 H 2 V 10 H 0 Z" fill={colors.brand.red} />
          {/* Couche de contour extérieur (redDeep - 2px) */}
          <path d="M14 6 H 16 V 8 H 14 V 10 H 12 V 12 H 10 V 14 H 8 V 16 H 6 V 14 H 8 V 12 H 10 V 10 H 12 V 8 H 14 Z" fill={colors.brand.redDeep} />
        </svg>
      </div>

      {/* ══ Bordures bas (Adaptatives Desktop/Mobile) ══ */}
      
      {/* --- Version Desktop (md:block) --- */}
      {/* Commence APRÈS le coin de transition SVG pour ne pas barrer la Sidebar */}
      <div
        className="absolute right-0 pointer-events-none z-20 hidden md:block"
        style={{ left: `calc(${sidebarWidth} + 16px)`, top: "100%", height: "6px", backgroundColor: colors.brand.redDark }}
      />
      <div
        className="absolute right-0 pointer-events-none z-20 hidden md:block"
        style={{ left: `calc(${sidebarWidth} + 16px)`, top: "calc(100% + 6px)", height: "2px", backgroundColor: colors.brand.redDeep }}
      />

      {/* --- Version Mobile (md:hidden) --- */}
      {/* Restent pleines largeurs car la Sidebar bascule en mode overlay/menu tiroir */}
      <div
        className="absolute left-0 right-0 pointer-events-none z-20 md:hidden"
        style={{ top: "100%", height: "6px", backgroundColor: colors.brand.redDark }}
      />
      <div
        className="absolute left-0 right-0 pointer-events-none z-20 md:hidden"
        style={{ top: "calc(100% + 6px)", height: "2px", backgroundColor: colors.brand.redDeep }}
      />
    </header>
  );
}