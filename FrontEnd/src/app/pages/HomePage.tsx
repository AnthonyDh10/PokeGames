import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameCard from "../components/GameCard";
import SectionTitle from "../components/SectionTitle";
import { useBackgroundStore } from "../store/backgroundStore";
import { useChatStore } from "../store/chatStore";
import { colors } from "../design/colors";
import pokeballFace from "../components/images/pokéball_face.png";
import pokeballShaking from "../components/images/pokéball_shaking.gif";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import pointerImg from "../components/images/pointer.png";

const games = [
  {
    title: "PokéDesc",
    description: "Connais-tu ton pokédex sur le bout des doigts ? Devine le pokémon à partir d'une description et d'autres indices !",
    color: colors.brand.blue,
    secondColor: colors.brand.blueDark,
    image: pokedescLogo,
    to: "/pokedesc",
  },
  {
    title: "Quel est ce type ?",
    description: "J'espère que tu connais ta table de types ! Devine les types à partir de leurs forces, faiblesses et immunités !",
    color: colors.brand.yellow,
    secondColor: colors.brand.yellowWarm,
    image: typeLogo,
    to: "/types",
  },
  {
    title: "Dézoom",
    description: "Penses-tu reconnaître un pokémon du premier coup d'œil ? Devine le pokémon à partir d'une partie de son corps !",
    color: colors.brand.red,
    secondColor: colors.brand.redDark,
    image: dezoomLogo,
    to: "/dezoom",
  },
];

export default function HomePage() {
  const { setBackground } = useBackgroundStore();
  const { clearContext, setOpen } = useChatStore();

  // hoveredIndex : survol souris (desktop)
  // selectedIndex : tap / clic (mobile + desktop pour épingler la card)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Le hover a priorité sur la sélection; sinon on affiche la sélection
  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;

  // Préchargement du GIF dès le montage du composant
  const gifRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new window.Image();
    img.src = pokeballShaking;
    gifRef.current = img;
  }, []);

  useEffect(() => {
    setBackground({ colorLeft: colors.ui.bgLeft, colorStripe: colors.ui.bgStripe, colorRight: colors.ui.bgRight });
    clearContext();
    setOpen(false);
  }, []);

  const handlePokeballClick = (index: number) => {
    // Mobile : bascule la sélection ; desktop : épingle/désépingle
    setSelectedIndex(prev => prev === index ? null : index);
  };

  return (
    <div className="space-y-8">
      <SectionTitle>Teste tes connaissances en Pokémon !</SectionTitle>

      {/* Zone interactive : pokéballs + card — mouseleave sur le wrapper global */}
      <div onMouseLeave={() => setHoveredIndex(null)}>

        {/* Rangée des 3 pokéballs */}
        <div className="flex items-end justify-center gap-10 md:gap-20 lg:gap-32 py-6">
          {games.map((game, index) => {
            const isActive = activeIndex === index;
            return (
              <div
                key={index}
                className="flex flex-col items-center gap-3 cursor-pointer select-none"
                onMouseEnter={() => setHoveredIndex(index)}
                onClick={() => handlePokeballClick(index)}
                role="button"
                aria-label={`Choisir ${game.title}`}
              >
                {/* Indicative pointer image above the pokéball */}
                <div className="h-7 flex items-end justify-center">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: [0, -6, 0] }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{
                          opacity: { duration: 0.15 },
                          y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
                        }}
                      >
                        <img
                          src={pointerImg}
                          alt={`${game.title} pointer`}
                          className="rotate-205"
                          style={{
                            width: "32px",
                            height: "32px",
                            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.45))",
                          }}
                          draggable={false}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pokéball — swap PNG statique / GIF animé */}
                <div className={`w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 transition-transform duration-150 ${isActive ? "scale-125" : "scale-100"}`}>
                  <img
                    src={isActive ? pokeballShaking : pokeballFace}
                    alt={game.title}
                    className={`w-full h-full object-contain transition-filter duration-150 ${!isActive ? "grayscale-[0.4]" : ""}`}
                    draggable={false}
                  />
                </div>

                {/* Nom du jeu */}
                <span
                  className={`font-display text-base md:text-lg text-white transition-all duration-150 ${isActive ? "text-lg md:text-xl" : ""}`}
                  style={{ opacity: isActive ? 1 : 0.55 }}
                >
                  {game.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Message d'invite quand aucune pokéball n'est active */}
        <div className="flex justify-center h-6">
          <AnimatePresence>
            {activeIndex === null && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-white/50 text-sm italic"
              >
                Survole ou appuie sur une Pokéball pour découvrir le jeu
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* GameCard révélée sous les pokéballs */}
        <div className="mt-4">
          <AnimatePresence mode="wait">
            {activeIndex !== null && (
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <GameCard
                  title={games[activeIndex].title}
                  description={games[activeIndex].description}
                  color={games[activeIndex].color}
                  secondColor={games[activeIndex].secondColor}
                  image={games[activeIndex].image}
                  to={games[activeIndex].to}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
