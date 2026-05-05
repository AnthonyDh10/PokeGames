import { useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import GameCard from "../components/GameCard";
import SectionTitle from "../components/SectionTitle";
import { useBackgroundStore } from "../store/backgroundStore";
import { useNavDirectionStore } from "../store/navDirectionStore";
import { colors } from "../design/colors";
import oakWebp from "../components/images/oak.webp";
import dialogueImg from "../components/images/dialogue.png";
import rulesIcon from "../components/images/rules-icon.png";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";

// Chen : slide horizontal basé sur la direction
// forward (home→regles) : Chen sort par la gauche, entre depuis la droite
// backward (regles→home) : Chen sort par la droite, entre depuis la gauche
const chenVariants = {
  initial: (dir: string) => ({
    x: dir === "backward" ? -120 : 120,
    opacity: 0,
  }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: (dir: string) => ({
    x: dir === "forward" ? -120 : 120,
    opacity: 0,
    transition: { duration: 0.35, ease: "easeIn" as const },
  }),
};

// GameCards : slide vertical
// forward : cards sortent vers le haut, entrent depuis le bas
// backward : cards sortent vers le bas, entrent depuis le haut
const cardsVariants = {
  initial: (dir: string) => ({
    y: dir === "backward" ? -40 : 40,
    opacity: 0,
  }),
  animate: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: (dir: string) => ({
    y: dir === "forward" ? -40 : 40,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" as const },
  }),
};

export default function HomePage() {
  const { setBackground } = useBackgroundStore();
  const { direction, setDirection } = useNavDirectionStore();
  const navigate = useNavigate();

  useEffect(() => {
    setBackground({ colorLeft: colors.ui.bgLeft, colorStripe: colors.ui.bgStripe, colorRight: colors.ui.bgRight });
  }, []);

  return (
    <div className="space-y-6">
      <SectionTitle>Teste tes connaissances en Pokémon !</SectionTitle>

      <div className="flex items-stretch min-h-screen gap-8">
        {/* Gauche — GameCards */}
        <motion.div
          className="flex-1 space-y-6"
          custom={direction}
          variants={cardsVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
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
        </motion.div>

        {/* Droite (masqué sur mobile) */}
        <motion.div
          className="hidden md:flex flex-col flex-1 items-center justify-start h-screen pt-8"
          custom={direction}
          variants={chenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
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
              <p className="mt-4 w-full text-center lg:text-left lg:pr-20 text-sm md:text-lg leading-relaxed min-w-0 break-words">
                N'hésite pas à aller regarder les règles en cliquant ici !
              </p>
              {/* Icône positionnée absolument: bottom-center sur petits écrans, right-center sur grands */}
              <button
                onClick={() => {
                  setDirection("forward");
                  navigate("/regles");
                }}
                className="mt-2 absolute left-1/2 top-full transform -translate-x-1/2 translate-y-3 lg:left-auto lg:right-4 lg:top-1/2 lg:translate-x-0 lg:-translate-y-1/2 flex-shrink-0 p-3 rounded-lg animate-pulse-scale hover:scale-110 transition-transform cursor-pointer"
                aria-label="Voir les règles"
              >
                <img src={rulesIcon} alt="Règles" className="h-14 w-14 md:h-16 md:w-16 lg:h-14 lg:w-14 object-contain" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
