import { useState, useEffect, useRef, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import GameCard from "../components/GameCard";
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

interface Game {
  title: string;
  description: ReactNode;
  color: string;
  secondColor: string;
  colorLight: string;
  colorDark: string;
  image?: string;
  icon?: string;
  to: string;
  isOak?: boolean;
  text_color?: string;
}

const games: Game[] = [
  {
    title: "PROF. CHEN",
    description: (
      <span className="font-heading">
        Bienvenue dresseur ! Relève les défis du Professeur pour tester tes connaissances sur les pokémon ! Chaque pokéball renferme un défi différent, survole les pour les découvrir ! Prends connaissance de leurs règles en cliquant sur le {" "}
        <img src={rulesIconImg} alt="règles" className="inline-block align-middle w-5 h-5" style={{ verticalAlign: "middle" }} />
        {" "}!
      </span>
    ),
    color: colors.brand.chen,
    secondColor: colors.brand.chenDeep,
    colorLight: colors.brand.chenLight,
    colorDark: colors.brand.chenDark,
    image: rulesIconImg,
    to: "/regles",
    isOak: true,
    text_color: colors.ui.grayBorderDark,
  },
  {
    title: "POKÉDESC",
    description: <span className="font-heading">Connais-tu ton pokédex sur le bout des doigts ? Devine le pokémon à partir d'une description et d'autres indices !</span>,
    color: colors.brand.blue,
    secondColor: colors.brand.blueDeep,
    image: pokedescLogo,
    to: "/pokedesc",
    colorLight: colors.brand.blueLight,
    colorDark: colors.brand.blueDark,
  },
  {
    title: "TYPUZZLE",
    description: <span className="font-heading">J'espère que tu connais ta table de types ! Devine les types à partir de leurs forces, faiblesses et immunités !</span>,
    color: colors.brand.yellow,
    secondColor: colors.brand.yellowDark,
    colorLight: colors.brand.yellowLight,
    colorDark: colors.brand.yellowWarm,
    image: typeLogo,
    to: "/types",
  },
  {
    title: "DEX-ZOOM",
    description: <span className="font-heading">Penses-tu reconnaître un pokémon du premier coup d'œil ? Devine le pokémon à partir d'une partie de son corps !</span>,
    color: colors.brand.red,
    secondColor: colors.brand.redDeep,
    colorLight: colors.brand.redLight,
    colorDark: colors.brand.redDark,
    image: dezoomLogo,
    to: "/dezoom",
  },
];

export default function HomePage() {
  const { clearContext, setOpen } = useChatStore();

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(0);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const activeIndex = hoveredIndex !== null ? hoveredIndex : selectedIndex;

  const gifRef = useRef<HTMLImageElement | null>(null);

  const navigate = useNavigate();
  const lastTapRef = useRef<number | null>(null);

  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Distance minimale pour qu'un swipe soit validé
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); // Réinitialiser à chaque nouvelle touche
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleCarouselNext();
    } else if (isRightSwipe) {
      handleCarouselPrev();
    }
  };

  // Calcul des index adjacents
  const prevIndex = (carouselIndex - 1 + games.length) % games.length;
  const nextIndex = (carouselIndex + 1) % games.length;

  useEffect(() => {
    const img = new window.Image();
    img.src = pokeballShaking;
    gifRef.current = img;
  }, []);


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
  // Espace sous la TopBar — identique à la hauteur utilisée dans TopBar.tsx
  const topbarHeight = "clamp(1rem, 5vh, 2rem)";

  // Ajouts / Ajustements des tailles pour la nouvelle grille :
  const lgPokeballSize = "clamp(110px, 16vw, 220px)"; // Légèrement affiné pour la ligne de 4
  const lgGapSize = "clamp(1rem, 4vw, 6rem)";
  const mdPokeballSize = "clamp(120px, 25vw, 200px)"; // Plus grand car il y a seulement 2 éléments par ligne
  const smPokeballSize = "clamp(130px, 45vw, 220px)"; 

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
        onDoubleClick={() => navigate(game.to)}
        onTouchEnd={(e) => {
          const touchX = e.changedTouches?.[0]?.clientX;
          if (touchX == null) return;
          if (touchStart != null) {
            const distance = Math.abs(touchStart - touchX);
            if (distance > minSwipeDistance) return; // ignore swipes
          }
          const now = Date.now();
          const DOUBLE_TAP_DELAY = 300;
          if (lastTapRef.current && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            lastTapRef.current = null;
            navigate(game.to);
          } else {
            lastTapRef.current = now;
          }
        }}
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
    <div className="space-y-8" style={{ marginTop: topbarHeight }}>
      <div onMouseLeave={() => setHoveredIndex(null)}>

        {/* ≥1024px (lg) : Ligne unique - S'affiche quand la GameCard est complète */}
        <div className="hidden lg:flex items-end justify-center py-6" style={{ gap: lgGapSize }}>
          {games.map((game, index) => renderItem(game, index, { pokeballSize: lgPokeballSize }))}
        </div>

        {/* 640px–1023px (sm à lg) : Quinconce sur 2 LIGNES (Grille 2 colonnes) 
            S'active en même temps que le responsive de la GameCard */}
        <div className="hidden sm:grid lg:hidden grid-cols-2 gap-x-6 gap-y-4 max-w-2xl mx-auto pt-4 pb-12">
          {games.map((game, index) => (
            <div 
              key={index} 
              className={`flex justify-center ${
                index % 2 !== 0 ? "mt-16" : "mb-8" // Pousse les éléments pairs vers le haut et les impairs vers le bas
              }`}
            >
              {renderItem(game, index, { pokeballSize: mdPokeballSize })}
            </div>
          ))}
        </div>

        {/* <640px (sm) : Carrousel mobile avec Swipe et Rotation (Framer Motion) */}
        <div 
          className="sm:hidden flex flex-col items-center py-4 w-full"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Conteneur du carousel avec une hauteur définie pour le positionnement absolu */}
          <div className="relative flex items-center justify-center w-full min-h-[250px] mb-4">
            {games.map((game, index) => {
              // Détermination de la position de chaque élément par rapport à l'index actif
              let position = "hidden";
              if (index === carouselIndex) position = "center";
              else if (index === prevIndex) position = "left";
              else if (index === nextIndex) position = "right";

              // Configuration des animations de rotation pour Framer Motion
              const variants = {
                center: { x: "0%", y: 0, scale: 1, zIndex: 10, opacity: 1, filter: "blur(0px)" },
                left: { x: "-65%", y: -30, scale: 0.65, zIndex: 5, opacity: 0.4, filter: "blur(1px)" },
                right: { x: "65%", y: -30, scale: 0.65, zIndex: 5, opacity: 0.4, filter: "blur(1px)" },
                hidden: { x: "0%", y: -40, scale: 0.4, zIndex: 0, opacity: 0, filter: "blur(2px)" }
              };

              return (
                <motion.div
                  key={game.title}
                  className="absolute cursor-pointer"
                  variants={variants}
                  initial={false}
                  animate={position}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  style={{ pointerEvents: position === "hidden" ? "none" : "auto" }}
                  onClick={() => {
                    if (position === "left") handleCarouselPrev();
                    if (position === "right") handleCarouselNext();
                  }}
                >
                  {renderItem(game, index, { 
                    forceActive: position === "center", 
                    noInteraction: true, 
                    pokeballSize: smPokeballSize 
                  })}
                </motion.div>
              );
            })}
          </div>
          
          {/* Indicateurs / Dots */}
          <div className="flex gap-3">
            {games.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCarouselIndex(i); setSelectedIndex(i); }}
                className={`w-2 h-2 mt-5 rounded-full transition-all duration-300 ${i === carouselIndex ? "bg-white scale-125" : "bg-white/30"}`}
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

        {/* GameCard */}
        <div className="mt-4 flex justify-center w-full px-4">
          <AnimatePresence mode="wait">
            {activeIndex !== null && (
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="w-full sm:w-[85%] md:w-[75%] lg:w-[70%] min-h-[30vh] sm:min-h-[25vh]"
              >
                <GameCard
                  title={games[activeIndex].title}
                  description={games[activeIndex].description}
                  color={games[activeIndex].color}
                  text_color={games[activeIndex].text_color}
                  secondColor={games[activeIndex].secondColor}
                  colorLight={games[activeIndex].colorLight}
                  colorDark={games[activeIndex].colorDark}
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