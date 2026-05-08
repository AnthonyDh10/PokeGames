import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import GameCard from "../components/GameCard";
import { useBackgroundStore } from "../store/backgroundStore";
import { useChatStore } from "../store/chatStore";
import { colors } from "../design/colors";
import pokeballFace from "../components/images/pokéball_face.png";
import pokeballShaking from "../components/images/pokéball_shaking.gif";
import solHerbes from "../components/images/sol-herbes.png";
import pokedescLogo from "../components/images/pokedesc-logo.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import pointerImg from "../components/images/pointer.png";
import oakImg from "../components/images/oak.png";
import rulesIconImg from "../components/images/rules-icon.png";

// Création d'une interface pour typer correctement tes jeux
interface Game {
  title: string;
  description: string;
  color: string;
  secondColor: string;
  image?: string;
  icon?: string;
  to: string;
  isOak?: boolean;
  text_color?: string;
}

const games: Game[] = [
  {
    title: "Prof. Chen",
    description: "Bienvenue dresseur ! Relève les défis du Professeur pour tester tes connaissances sur les pokémon ! Chaque pokéball renferme un défi différent, survole les pour les découvrir ! Prends connaissance de leurs règles en cliquant sur le livre !",
    color: colors.ui.grayBorderLight,
    secondColor: colors.ui.grayBorderDark,
    image: rulesIconImg,
    to: "/regles",
    isOak: true,
    text_color: colors.ui.grayBorderDark,
  },
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

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;

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
  }, [setBackground, clearContext, setOpen]);

  const handlePokeballClick = (index: number) => {
    setSelectedIndex(prev => prev === index ? null : index);
  };

  const handleCarouselPrev = () => {
    const newIndex = (carouselIndex - 1 + games.length) % games.length;
    setCarouselIndex(newIndex);
    setSelectedIndex(newIndex);
  };

  const handleCarouselNext = () => {
    const newIndex = (carouselIndex + 1) % games.length;
    setCarouselIndex(newIndex);
    setSelectedIndex(newIndex);
  };

  const oakBottomOffset = "8%";
  const pointerSize = "clamp(20px, 2.5vw, 44px)";
  const textSize = "clamp(0.8rem, 1.5vw, 1.25rem)";

  const lgPokeballSize = "clamp(100px, 20vw, 250px)";
  const lgGapSize = "clamp(1rem, 4vw, 6rem)";
  const mdPokeballSize = "clamp(80px, 15vw, 200px)";
  const mdGapSize = "clamp(1.5rem, 6vw, 5rem)";
  const smPokeballSize = "clamp(100px, 40vw, 200px)";

  const renderItem = (
    game: Game,
    index: number,
    opts: { forceActive?: boolean; noInteraction?: boolean; pokeballSize?: string } = {},
  ) => {
    const isActive = opts.forceActive ?? activeIndex === index;
    const isOak = game.isOak;
    const size = opts.pokeballSize ?? lgPokeballSize;
    
    return (
      <div
        key={index}
        className="flex flex-col items-center gap-3 cursor-pointer select-none"
        onMouseEnter={opts.noInteraction ? undefined : () => setHoveredIndex(index)}
        onClick={opts.noInteraction ? undefined : () => handlePokeballClick(index)}
        role="button"
        aria-label={`Choisir ${game.title}`}
      >
        <div
          className="flex items-end justify-center"
          style={isOak ? { marginBottom: oakBottomOffset } : undefined}
        >
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: [0, -6, 0] }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  opacity: { duration: 0.15 },
                  y: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
                }}
              >
                <img
                  src={pointerImg}
                  alt={`${game.title} pointer`}
                  className="rotate-205"
                  style={{
                    width: pointerSize,
                    height: pointerSize,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.45))",
                  }}
                  draggable={false}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div
          className="relative transition-transform duration-150"
          style={{ width: size, height: size, transform: `scale(${isActive ? 1.1 : 0.9})` }}
        >
          <img
            src={solHerbes}
            alt={`${game.title} sol`}
            className="absolute left-0 right-0 w-full h-full object-contain pointer-events-none"
            style={{ bottom: "-35%", zIndex: 0 }}
            draggable={false}
          />
          {isOak ? (
            <img
              src={oakImg}
              alt={game.title}
              className="absolute z-10 left-0 right-0 w-full h-full object-contain transition-all duration-150 pointer-events-none"
              style={{ bottom: oakBottomOffset }}
              draggable={false}
            />
          ) : (
            <img
              src={isActive ? pokeballShaking : pokeballFace}
              alt={game.title}
              className={`relative z-10 w-full h-full object-contain transition-filter duration-150 ${!isActive ? "grayscale-[0.4]" : ""}`}
              draggable={false}
            />
          )}
        </div>

        <span
          className="font-display text-white transition-all duration-150 mt-2 text-center"
          style={{
            fontSize: isActive ? `calc(${textSize} * 1.15)` : textSize,
            opacity: isActive ? 1 : 0.55,
          }}
        >
          {game.title}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div onMouseLeave={() => setHoveredIndex(null)}>

        {/* ≥1024px : Ligne */}
        <div className="hidden lg:flex items-end justify-center py-6" style={{ gap: lgGapSize }}>
          {games.map((game, index) => renderItem(game, index, { pokeballSize: lgPokeballSize }))}
        </div>

        {/* 640px–1023px : Quinconce */}
        <div
          className="hidden sm:flex lg:hidden items-stretch justify-center py-6"
          style={{ gap: mdGapSize, minHeight: `calc(${mdPokeballSize} * 2.4)` }}
        >
          {games.map((game, index) => (
            <div key={index} style={{ alignSelf: index % 2 === 0 ? "flex-start" : "flex-end" }}>
              {renderItem(game, index, { pokeballSize: mdPokeballSize })}
            </div>
          ))}
        </div>

        {/* <640px : Carrousel mobile */}
        <div className="sm:hidden flex flex-col items-center py-4 gap-4 w-full">
          <div className="flex items-center justify-center w-full gap-2">
            <button
              onClick={handleCarouselPrev}
              aria-label="Pokéball précédente"
              className="text-white/60 active:text-white hover:text-white text-5xl font-light transition-colors select-none leading-none p-3"
            >
              ‹
            </button>
            {renderItem(games[carouselIndex], carouselIndex, { forceActive: true, noInteraction: true, pokeballSize: smPokeballSize })}
            <button
              onClick={handleCarouselNext}
              aria-label="Pokéball suivante"
              className="text-white/60 active:text-white hover:text-white text-5xl font-light transition-colors select-none leading-none p-3"
            >
              ›
            </button>
          </div>
          
          <div className="flex gap-3">
            {games.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCarouselIndex(i); setSelectedIndex(i); }}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${i === carouselIndex ? "bg-white scale-125" : "bg-white/30"}`}
                aria-label={`Aller à ${games[i].title}`}
              />
            ))}
          </div>
        </div>

        {/* Helper text */}
        <div className="flex justify-center h-6 mt-2">
          <AnimatePresence>
            {activeIndex === null && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="text-white/50 italic text-center px-4"
                style={{ fontSize: "clamp(0.75rem, 1vw, 0.875rem)" }}
              >
                Survole ou appuie sur une Pokéball pour découvrir le jeu
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* GameCard - Largeur gérée via Tailwind */}
        <div className="mt-4 flex justify-center w-full px-4">
          <AnimatePresence mode="wait">
            {activeIndex !== null && (
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                // Les classes Tailwind gèrent parfaitement le responsive ici
                className="w-full sm:w-[85%] md:w-[75%] lg:w-[60%] min-h-[30vh] sm:min-h-[25vh]"
              >
                <GameCard
                  title={games[activeIndex].title}
                  description={games[activeIndex].description}
                  color={games[activeIndex].color}
                  text_color={games[activeIndex].text_color}
                  secondColor={games[activeIndex].secondColor}
                  image={games[activeIndex].image}
                  icon={games[activeIndex].icon}
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