import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { colors } from "../design/colors";
import Pokeball from "../components/images/pokéball_face.png";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import rulesLogo from "../components/images/rules-icon.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  isOpen,
  onClose,
}: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: rulesLogo, label: "Règles", to: "/regles" },
    { icon: pokedescLogo, label: "PokéDesc", to: "/pokedesc" },
    { icon: typeLogo, label: "Quel est ce type ?", to: "/types" },
    { icon: dezoomLogo, label: "Dézoom", to: "/dezoom" }
  ];

  // Tailles relatives (clamp): largeur de la sidebar et taille carrée des boutons
  const sidebarWidth = "clamp(3.75rem, 12vw, 8rem)"; // min ~60px, max ~128px
  const buttonSize = "clamp(2.25rem, 8vw, 4.8rem)"; // carrés : width et height identiques
  const iconScale = 0.6; // proportion de l'icône à l'intérieur du bouton

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed md:static top-0 left-0 h-full md:h-auto md:self-stretch
        flex-col items-center py-6 gap-4 z-50
        transition-transform duration-300
        ${isOpen ? "flex translate-x-0" : "flex -translate-x-full md:translate-x-0"}
      `}
        style={{ backgroundColor: colors.brand.red, width: sidebarWidth }}
      >
        {/* Placeholder for TopBar pokéball (mobile) — invisible and non-interactive */}
        <div
          className="md:hidden"
          aria-hidden="true"
          style={{ width: buttonSize, height: buttonSize, pointerEvents: "none" }}
        />

        {/* Home button */}
        <button
          onClick={() => {
            navigate("/");
            onClose();
          }}
          className="flex items-center justify-center transition-colors duration-200"
          style={{
            backgroundColor: location.pathname === "/" ? "#4a4a4a" : "#d3d3d3",
            border: "2px solid #808080",
            width: buttonSize,
            height: buttonSize,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="Home"
        >
          <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth="0"
            style={{ width: `${iconScale * 100}%`, height: `${iconScale * 100}%` }}
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={location.pathname === "/" ? "#d3d3d3" : "#4a4a4a"} />
          </svg>
        </button>

        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              navigate(item.to);
              onClose();
            }}
            className="flex items-center justify-center transition-colors duration-200"
            style={{
              backgroundColor: location.pathname.startsWith(item.to) ? "#4a4a4a" : "#d3d3d3",
              border: "2px solid #808080",
              width: buttonSize,
              height: buttonSize,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title={item.label}
          >
            <img src={item.icon} alt={item.label} style={{ width: `${iconScale * 100}%`, height: `${iconScale * 100}%`, objectFit: "contain" }} />
          </button>
        ))}
      </aside>
    </>
  );
}