import { useNavigate, useLocation } from "react-router";
import { colors } from "../design/colors";
import Pokeball from "./Pokeball";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";

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
    { icon: pokedescLogo, label: "PokéDesc", to: "/pokedesc" },
    { icon: typeLogo, label: "Quel est ce type ?", to: "/types" },
    { icon: dezoomLogo, label: "Dézoom", to: "/dezoom" },
    { icon: "📄", label: "Règles", to: "/regles" }
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
        w-20 flex-col items-center py-6 gap-4 shadow-lg z-50
        transition-transform duration-300
        ${isOpen ? "flex translate-x-0" : "flex -translate-x-full md:translate-x-0"}
      `}
        style={{ backgroundColor: colors.brand.red }}
      >
        <Pokeball
          onClick={() => {
            navigate("/");
            onClose();
          }}
        />

        {/* Home button */}
        <button
          onClick={() => {
            navigate("/");
            onClose();
          }}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
            location.pathname === "/"
              ? "bg-white shadow-md scale-110"
              : "bg-pokered hover:bg-pokered-dark hover:scale-105"
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
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              location.pathname.startsWith(item.to)
                ? "bg-white shadow-md scale-110"
                : "bg-pokered hover:bg-pokered-dark hover:scale-105"
            }`}
            title={item.label}
          >
            <img src={item.icon} alt={item.label} className="w-8 h-8 object-contain" />
          </button>
        ))}
      </aside>
    </>
  );
}