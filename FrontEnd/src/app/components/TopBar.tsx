import Pokeball from "./Pokeball";
import { colors } from "../design/colors";

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({
  onToggleSidebar,
}: TopBarProps) {
  return (
    <header
      className="h-20 border-b-4 flex items-center justify-between px-4 md:px-8 shadow-lg relative"
      style={{ backgroundColor: colors.brand.redDark, borderBottomColor: colors.brand.redDark }}
    >
      <div className="flex items-center gap-3">
        {/* Pokéball logo - hamburger menu on mobile */}
        <div className="md:hidden">
          <Pokeball onClick={onToggleSidebar} />
        </div>

        <h2 className="text-3xl font-display tracking-wide text-white uppercase">
          PokéGames
        </h2>

      </div>
    </header>
  );
}
