import { useNavigate, useLocation } from "react-router";
import { colors } from "../design/colors";
import PixelButton, { pixelClipPathLg } from "./PixelButton";
import Pokeball from "../components/images/pokéball_face.png";
import pokedescLogo from "../components/images/pokedesc-logo.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import rulesLogo from "../components/images/rules-icon.png";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}



// Sous-composant gérant les états Actif/Inactif et les 3 couches de bordure (Ombre / Lumière / Fond)
interface NavButtonProps {
  onClick: () => void;
  isActive: boolean;
  title: string;
  size: string;
  children: React.ReactNode;
}

function NavButton({ onClick, isActive, title, size, children }: NavButtonProps) {
  const color = isActive ? colors.ui.grayDark : colors.ui.grayMid;
  const colorLight = isActive ? colors.ui.grayDark : colors.ui.grayLight;
  const colorDark = isActive ? colors.ui.grayLight : colors.ui.grayDark;

  return (
    <PixelButton
      onClick={onClick}
      title={title}
      style={{ width: size, height: size }}
      colorBorder={colors.ui.grayBorderDark}
      colorLight={colorLight}
      colorDark={colorDark}
      color={color}
      clipPath={pixelClipPathLg}
    >
      {children}
    </PixelButton>
  );
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: rulesLogo, label: "Règles", to: "/regles" },
    { icon: pokedescLogo, label: "PokéDesc", to: "/pokedesc" },
    { icon: typeLogo, label: "Typuzzle", to: "/types" },
    { icon: dezoomLogo, label: "Dex-zoom", to: "/dezoom" },
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
        fixed md:relative top-0 left-0 h-full md:h-auto md:self-stretch
        flex flex-col items-center py-6 gap-4 z-50
        transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}
        style={{
          backgroundColor: colors.brand.red,
          width: sidebarWidth,
        }}
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

        {/* Bordure droite : redDark (6px) → redDeep (2px), depuis la sidebar vers la page */}
        <div
          className="absolute top-0 h-full pointer-events-none"
          style={{
            right: "-8px",
            width: "8px",
            background: `linear-gradient(to right, ${colors.brand.redDark} 0px, ${colors.brand.redDark} 6px, ${colors.brand.redDeep} 6px, ${colors.brand.redDeep} 8px)`,
            zIndex: 60,
          }}
        />
      </aside>
    </>
  );
}