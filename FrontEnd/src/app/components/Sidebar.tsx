import { useMemo } from "react";
import { useNavigate, useLocation } from "react-router";
import { colors } from "../design/colors";
import Pokeball from "../components/images/pokéball_face.png";
import pokedescLogo from "../components/images/pokedesc-logo.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import rulesLogo from "../components/images/rules-icon.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Découpe pixélisée adaptée aux petits boutons (marches de 3px, total 9px par coin)
const miniPixelClipPath = `polygon(
  9px 0px, calc(100% - 9px) 0px, 
  calc(100% - 9px) 3px, calc(100% - 6px) 3px, calc(100% - 6px) 6px, calc(100% - 3px) 6px, calc(100% - 3px) 9px, 100% 9px, 
  100% calc(100% - 9px), 
  calc(100% - 3px) calc(100% - 9px), calc(100% - 3px) calc(100% - 6px), calc(100% - 6px) calc(100% - 6px), calc(100% - 6px) calc(100% - 3px), calc(100% - 9px) calc(100% - 3px), calc(100% - 9px) 100%, 
  9px 100%, 
  9px calc(100% - 3px), 6px calc(100% - 3px), 6px calc(100% - 6px), 3px calc(100% - 6px), 3px calc(100% - 9px), 0px calc(100% - 9px), 
  0px 9px, 
  3px 9px, 3px 6px, 6px 6px, 6px 3px, 9px 3px
)`;

// Sous-composant gérant les états Actif/Inactif et les 3 couches de bordure (Ombre / Lumière / Fond)
interface NavButtonProps {
  onClick: () => void;
  isActive: boolean;
  title: string;
  size: string;
  children: React.ReactNode;
}

function NavButton({ onClick, isActive, title, size, children }: NavButtonProps) {
  // Couleurs conditionnelles basées sur l'état de la route
  const color = isActive ? colors.ui.grayDark : colors.ui.grayMid;
  const colorLight = isActive ? colors.ui.grayDark : colors.ui.grayLight;
  const colorDark = isActive ? colors.ui.grayLight : colors.ui.grayDark;
  const borderColor = colors.ui.grayBorderDark;

  return (
    <button
      onClick={onClick}
      title={title}
      className="relative block cursor-pointer group drop-shadow-[4px_4px_0px_rgba(0,0,0,0.8)] hover:drop-shadow-[2px_2px_0px_rgba(0,0,0,0.8)] hover:translate-x-[2px] hover:translate-y-[2px] active:drop-shadow-none active:translate-x-[4px] active:translate-y-[4px] transition-none p-[3px] shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: borderColor,
        clipPath: miniPixelClipPath,
      }}
    >
      {/* Bordure Lumière (Haut & Gauche) */}
      <div
        className="flex flex-col w-full h-full pt-[3px] pl-[3px]"
        style={{
          backgroundColor: colorLight,
          clipPath: miniPixelClipPath,
        }}
      >
        {/* Bordure Ombre (Bas & Droite) */}
        <div
          className="flex flex-col w-full h-full pr-[3px] pb-[3px]"
          style={{
            backgroundColor: colorDark,
            clipPath: miniPixelClipPath,
          }}
        >
          {/* Fond Interne */}
          <div
            className="flex-1 flex items-center justify-center w-full h-full"
            style={{
              backgroundColor: color,
              clipPath: miniPixelClipPath,
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: rulesLogo, label: "Règles", to: "/regles" },
    { icon: pokedescLogo, label: "PokéDesc", to: "/pokedesc" },
    { icon: typeLogo, label: "Quel est ce type ?", to: "/types" },
    { icon: dezoomLogo, label: "Dézoom", to: "/dezoom" },
  ];

  const sidebarWidth = "clamp(3.75rem, 12vw, 8rem)";
  const buttonSize = "clamp(2.25rem, 8vw, 4.8rem)";
  const iconScale = 0.6;

  const isHomeActive = location.pathname === "/";

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
        flex flex-col items-center py-6 gap-4 z-50
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
        style={{ backgroundColor: colors.brand.red, width: sidebarWidth }}
      >
        {/* Placeholder for TopBar pokéball (mobile) */}
        <div
          className="md:hidden shrink-0"
          aria-hidden="true"
          style={{ width: buttonSize, height: buttonSize, pointerEvents: "none" }}
        />

        {/* Home button */}
        <NavButton
          onClick={() => {
            navigate("/");
            onClose();
          }}
          isActive={isHomeActive}
          title="Home"
          size={buttonSize}
        >
          <svg
            fill="currentColor"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth="0"
            style={{ width: `${iconScale * 100}%`, height: `${iconScale * 100}%` }}
          >
            <path
              d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"
              fill={isHomeActive ? colors.brand.red : colors.ui.grayDark}
            />
          </svg>
        </NavButton>

        {/* Nav Items */}
        {navItems.map((item, index) => {
          const isActive = location.pathname.startsWith(item.to);
          return (
            <NavButton
              key={index}
              onClick={() => {
                navigate(item.to);
                onClose();
              }}
              isActive={isActive}
              title={item.label}
              size={buttonSize}
            >
              <img
                src={item.icon}
                alt={item.label}
                style={{
                  width: `${iconScale * 100}%`,
                  height: `${iconScale * 100}%`,
                  objectFit: "contain",
                  imageRendering: "pixelated"
                }}
              />
            </NavButton>
          );
        })}
      </aside>
    </>
  );
}