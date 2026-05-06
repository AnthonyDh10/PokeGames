import { useNavigate, useLocation } from "react-router";
import { colors } from "../design/colors";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import rulesLogo from "../components/images/rules-icon.png";
import "../../styles/sidebar-retro.css";

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
        md:w-[8%] w-full flex-col items-center py-6 gap-4 z-50
        transition-transform duration-300 retro-sidebar-container
        ${isOpen ? "flex translate-x-0" : "flex -translate-x-full md:translate-x-0"}
      `}
        style={{
          backgroundColor: colors.brand.red,
          ["--sidebar-border-top-left" as any]: colors.brand.redDark,
          ["--sidebar-border-right-bottom" as any]: colors.brand.redDeep,
          ["--retro-gray-base" as any]: colors.ui.grayLight,
          ["--retro-gray-mid" as any]: colors.ui.grayMid,
          ["--retro-gray-border-light" as any]: colors.ui.grayBorderLight,
          ["--retro-gray-border-dark" as any]: colors.ui.grayBorderDark,
          ["--retro-gray-shadow" as any]: colors.ui.grayShadow,
          ["--retro-gray-active" as any]: colors.ui.grayActive,
        } as any}
      >
        {/* Pokéball moved to TopBar — keep sidebar with only nav buttons */}

        {/* Home button */}
        <button
          onClick={() => {
            navigate("/");
            onClose();
          }}
          className={`retro-button flex items-center justify-center transition-none ${
            location.pathname === "/"
              ? "retro-button-active"
              : ""
          }`}
          title="Home"
        >
          <svg
            className="w-8 h-8"
            fill="currentColor"
            viewBox="0 0 24 24"
            stroke="white"
            strokeWidth="0"
          >
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={location.pathname === "/" ? colors.brand.red : "white"} />
          </svg>
        </button>

        {navItems.map((item, index) => (
          <button
            key={index}
            onClick={() => {
              navigate(item.to);
              onClose();
            }}
            className={`retro-button flex items-center justify-center transition-none ${
              location.pathname.startsWith(item.to)
                ? "retro-button-active"
                : ""
            }`}
            title={item.label}
          >
            <img src={item.icon} alt={item.label} className="w-8 h-8 object-contain retro-icon" />
          </button>
        ))}
      </aside>
    </>
  );
}