import { useEffect } from "react";
import GameCard from "../components/GameCard";
import SectionTitle from "../components/SectionTitle";
import { useBackgroundStore } from "../store/backgroundStore";
import { colors } from "../design/colors";
import oakWebp from "../components/images/oak.webp";
import dialogueImg from "../components/images/dialogue.png";
import rulesIcon from "../components/images/rules-icon.png";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";

export default function HomePage() {
  const { setBackground } = useBackgroundStore();

  useEffect(() => {
    setBackground({ colorLeft: colors.ui.bgLeft, colorStripe: colors.ui.bgStripe, colorRight: colors.ui.bgRight });
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

        {/* Droite (masqué sur mobile) */}
        <div className="hidden md:flex flex-col flex-1 items-center justify-start h-screen pt-8">
          <img
            src={oakWebp}
            alt="Professeur Chen"
            className="w-128 h-128 object-contain"
          />
          <div className="relative inline-block w-64 md:w-80 lg:w-96">
            <img
              src={dialogueImg}
              alt="Bulle de dialogue"
              className="mt-4 w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center px-4 md:px-6">
              {/* Texte centré verticalement, ne bouge pas */}
              <p className="w-full text-center lg:text-left lg:pr-20 text-sm md:text-lg leading-relaxed min-w-0 break-words">
                N'hésite pas à aller regarder les règles en cliquant ici !
              </p>
              {/* Icône positionnée absolument: bottom-center sur petits écrans, right-center sur grands */}
              <button
                onClick={() => window.location.href = "/regles"}
                className="absolute left-1/2 top-full transform -translate-x-1/2 translate-y-3 lg:left-auto lg:right-4 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2 flex-shrink-0 p-3 rounded-lg animate-pulse-scale hover:scale-110 transition-transform cursor-pointer"
                aria-label="Voir les règles"
              >
                <img src={rulesIcon} alt="Règles" className="h-14 w-14 md:h-16 md:w-16 lg:h-14 lg:w-14 object-contain" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
