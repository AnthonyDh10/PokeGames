import { useState, useRef } from "react";
import GameCard from "../components/GameCard";
import { colors } from "../design/colors";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import Card from "../components/Card";
import PokéDescRulesCard from "../components/PokéDescRulesCard";
import TypuzzleRulesCard from "../components/TypuzzleRulesCard";
import DézoomRulesCard from "../components/DézoomRulesCard";
import MultiplayerRulesCard from "../components/MultiplayerRulesCard";

const GAMES = [
  {
    key: "pokedesc" as const,
    title: "POKÉDESC",
    color: colors.brand.blue,
    secondColor: colors.brand.blueDeep,
    colorLight: colors.brand.blueLight,
    colorDark: colors.brand.blueDark,
    image: pokedescLogo,
    to: "/pokedesc",
  },
  {
    key: "types" as const,
    title: <span style={{color: colors.ui.textMuted}}>TYPUZZLE</span>,
    color: colors.brand.yellow,
    secondColor: colors.brand.yellowDark,
    colorLight: colors.brand.yellowLight,
    colorDark: colors.brand.yellowWarm,
    image: typeLogo,
    to: "/types",
  },
  {
    key: "dezoom" as const,
    title: "DEX-ZOOM",
    color: colors.brand.red,
    secondColor: colors.brand.redDeep,
    colorLight: colors.brand.redLight,
    colorDark: colors.brand.redDark,
    image: dezoomLogo,
    to: "/dezoom",
  },
];

/**
 * Page des règles.
 * Affiche un menu de sélection de jeu à gauche et la carte de règles correspondante à droite.
 * Sur mobile/tablette, la carte de règles est scrolle-jumpée au clic.
 */
export default function ReglesPage() {
  const [activeGame, setActiveGame] = useState<"pokedesc" | "types" | "dezoom" | "multiplayer">("pokedesc");
  const rulesRef = useRef<HTMLDivElement>(null);
  
  const handleSelectGame = (gameKey: "pokedesc" | "types" | "dezoom" | "multiplayer") => {
    setActiveGame(gameKey);
    // Scroll automatique vers les règles en mobile/tablette
    if (rulesRef.current && window.innerWidth < 1024) {
      setTimeout(() => {
        rulesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const RULE_CARDS: Record<typeof activeGame, JSX.Element> = {
    pokedesc: <PokéDescRulesCard />,
    types: <TypuzzleRulesCard />,
    dezoom: <DézoomRulesCard />,
    multiplayer: <MultiplayerRulesCard />,
  };

  // Couleurs simplifiées pour la Card (tons de gris)
  const CARD_COLORS = {
    color: colors.ui.grayMid,
    secondColor: colors.ui.grayBorderDark,
    colorLight: colors.brand.white,
    colorDark: colors.ui.grayDark,
  };

  return (
    // Conteneur principal avec des marges adaptées
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row py-6 px-4 sm:px-6 gap-6 xl:gap-8 h-full">

      {/* ── Gauche — Menu de sélection ───────────────────────── */}
      {/* On augmente la largeur à lg:w-80 (320px) ou xl:w-96 (384px) pour éviter le rognage */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col">
        <Card
          showHeader
          headerColor={CARD_COLORS.colorLight}
          borderColor={CARD_COLORS.secondColor}
          pokeballColor={CARD_COLORS.color}
          bodyColor={CARD_COLORS.colorLight}
          pokeballOpacity={0.15}
          pokeballSize={160}
          headerClassName="py-4"
          animation={false}
          header={
            <span className="font-display text-xl tracking-wide drop-shadow-sm" style={{color: CARD_COLORS.secondColor}}>Choisis un jeu</span>
          }
        >
          <div className="flex flex-col gap-3 p-3 sm:p-4">
            {GAMES.map((game) => {
              const isActive = activeGame === game.key;
              return (
                <div 
                  key={game.key} 
                  className={`flex items-center gap-2 sm:gap-3 transition-all duration-200 cursor-pointer ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01] opacity-90 hover:opacity-100'}`}
                  onClick={() => handleSelectGame(game.key)}
                >
                  {/* Flèche d'indication (visible seulement à partir de md:) */}
                  <span
                    className={`font-heading font-bold text-lg w-6 text-center shrink-0 hidden md:inline ${isActive ? 'opacity-100' : 'opacity-0'}`}
                    style={{ color: CARD_COLORS.secondColor }}
                  >
                    ▶
                  </span>
                  
                  {/* Le conteneur w-full et min-w-0 empêche le contenu de déborder de son parent flex */}
                  <div className="flex-1 w-full min-w-0 pointer-events-none">
                    <GameCard
                      title={game.title}
                      color={game.color}
                      description=""
                      secondColor={game.secondColor}
                      colorLight={game.colorLight}
                      colorDark={game.colorDark}
                      image={game.image}
                      to="#" // Empêche la navigation réelle si le composant GameCard utilise un <Link> en interne
                      onClick={() => handleSelectGame(game.key)}
                    />
                  </div>
                </div>
              );
            })}

            {/* Section multijoueur séparée par une ligne fine grise */}
            <div className="border-t border-gray-200 mt-3 pt-3">
              <div className="pt-3">
                <div
                  className={`flex items-center gap-2 sm:gap-3 transition-all duration-200 cursor-pointer ${activeGame === 'multiplayer' ? 'scale-[1.02]' : 'hover:scale-[1.01] opacity-90 hover:opacity-100'}`}
                  onClick={() => handleSelectGame('multiplayer')}
                >
                  <span
                    className={`font-heading font-bold text-lg w-6 text-center shrink-0 hidden md:inline ${activeGame === 'multiplayer' ? 'opacity-100' : 'opacity-0'}`}
                    style={{ color: CARD_COLORS.secondColor }}
                  >
                    ▶
                  </span>

                  <div className="flex-1 w-full min-w-0 pointer-events-none">
                    <GameCard
                      title={<span style={{ color: colors.ui.textMuted }}>MULTI</span>}
                      description=""
                      color={CARD_COLORS.color}
                      secondColor={CARD_COLORS.secondColor}
                      colorLight={CARD_COLORS.colorLight}
                      colorDark={CARD_COLORS.colorDark}
                      text_color={colors.ui.textPrimary}
                      to="#"
                      onClick={() => handleSelectGame('multiplayer')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Droite — Règles toujours visibles ─────────────────── */}
      <div ref={rulesRef} className="flex-1 w-full min-w-0 flex flex-col h-full">
        {RULE_CARDS[activeGame]}
      </div>
      
    </div>
  );
}