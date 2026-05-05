import { useEffect } from "react";
import GameCard from "../components/GameCard";
import SectionTitle from "../components/SectionTitle";
import { useBackgroundStore } from "../store/backgroundStore";
import { useChatStore } from "../store/chatStore";
import { colors } from "../design/colors";
import redGif from "../components/images/red-gif.gif";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";

export default function HomePage() {
  const { setBackground } = useBackgroundStore();
  const { clearContext, setOpen } = useChatStore();

  useEffect(() => {
    setBackground({ colorLeft: colors.ui.bgLeft, colorStripe: colors.ui.bgStripe, colorRight: colors.ui.bgRight });
    clearContext();
    setOpen(false);
  }, []);

  return (
    <div className="space-y-6">
      <SectionTitle>Teste tes connaissances en Pokémon !</SectionTitle>

      <div className="flex items-stretch min-h-screen gap-8">
        {/* Gauche — GameCards */}
        <div className="flex-1 space-y-6">
          <GameCard
            title="PokéDesc"
            description="Connais-tu ton pokédex sur le bout des doigts ? Devine le pokémon à partir d'une description et d'autres indices !"
            color={colors.brand.blue}
            image={pokedescLogo}
            to="/pokedesc"
          />

          <GameCard
            title="Quel est ce type ?"
            description="J'espère que tu connais ta table de types ! Devine les types à partir de leurs forces, faiblesses et immunités !"
            color={colors.brand.yellow}
            image={typeLogo}
            to="/types"
          />

          <GameCard
            title="Dézoom"
            description="Penses-tu reconnaître un pokémon du premier coup d'œil ? Devine le pokémon à partir d'une partie de son corps !"
            color={colors.brand.red}
            image={dezoomLogo}
            to="/dezoom"
          />
        </div>

        {/* Droite — Gif (masqué sur mobile) */}
        <div className="hidden md:flex flex-1 justify-center h-screen">
          <img
            src={redGif}
            alt="Dresseur Red"
            className="h-3/4 object-contain"
          />
        </div>
      </div>
    </div>
  );
}
