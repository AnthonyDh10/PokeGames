import { useState } from "react";
import GameCard from "../components/GameCard";
import { colors } from "../design/colors";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import Card from "../components/Card";
import PokéDescRulesCard from "../components/PokéDescRulesCard";
import TypuzzleRulesCard from "../components/TypuzzleRulesCard";
import DézoomRulesCard from "../components/DézoomRulesCard";

const GAMES = [
  {
    key: "pokedesc" as const,
    title: "POKÉDESC",
    description: "Lis les descriptions du Pokédex et sois le plus rapide à deviner !",
    color: colors.brand.blue,
    secondColor: colors.brand.blueDeep,
    colorLight: colors.brand.blueLight,
    colorDark: colors.brand.blueDark,
    image: pokedescLogo,
    to: "/pokedesc",
  },
  {
    key: "types" as const,
    title: "TYPUZZLE",
    description: "Devine la paire de types cachée derrière le tableau d'interactions !",
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
    description: "Identifie le Pokémon caché avant que le dézoom ne le révèle !",
    color: colors.brand.red,
    secondColor: colors.brand.redDeep,
    colorLight: colors.brand.redLight,
    colorDark: colors.brand.redDark,
    image: dezoomLogo,
    to: "/dezoom",
  },
];

export default function ReglesPage() {
  const [activeGame, setActiveGame] = useState<"pokedesc" | "types" | "dezoom">("pokedesc");

  const handleSelectGame = (gameKey: "pokedesc" | "types" | "dezoom") => {
    setActiveGame(gameKey);
  };

  const renderGameCard = () => {
    switch (activeGame) {
      case "pokedesc":
        return <PokéDescRulesCard />;
      case "types":
        return <TypuzzleRulesCard />;
      case "dezoom":
        return <DézoomRulesCard />;
      default:
        return <PokéDescRulesCard />;
    }
  };

  const getGameColor = (gameKey: string) => {
    switch (gameKey) {
      case "pokedesc":
        return colors.brand.blue;
      case "types":
        return colors.brand.yellow;
      case "dezoom":
        return colors.brand.red;
      default:
        return colors.brand.blue;
    }
  };

  return (
    // Conteneur principal avec des marges adaptées
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row py-6 px-4 sm:px-6 gap-6 xl:gap-8 h-full">

      {/* ── Gauche — Menu de sélection ───────────────────────── */}
      {/* On augmente la largeur à lg:w-80 (320px) ou xl:w-96 (384px) pour éviter le rognage */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col">
        <Card
          showHeader
          headerColor={getGameColor(activeGame)}
          borderColor={getGameColor(activeGame)}
          pokeballColor={getGameColor(activeGame)}
          pokeballOpacity={0.15}
          pokeballSize={160}
          headerClassName="py-4"
          animation={false}
          header={
            <span className="font-display text-xl tracking-wide text-white drop-shadow-sm">Sélection du jeu</span>
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
                  {/* Flèche d'indication améliorée */}
                  <span
                    className={`font-heading font-bold text-lg w-6 text-center shrink-0 transition-all duration-300 ${isActive ? 'translate-x-0 opacity-100' : '-translate-x-2 opacity-0'}`}
                    style={{ color: game.color }}
                  >
                    ▶
                  </span>
                  
                  {/* Le conteneur w-full et min-w-0 empêche le contenu de déborder de son parent flex */}
                  <div className="flex-1 w-full min-w-0 pointer-events-none">
                    <GameCard
                      title={game.title}
                      description={game.description}
                      color={game.color}
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
          </div>
        </Card>
      </div>

      {/* ── Droite — Règles toujours visibles ─────────────────── */}
      <div className="flex-1 w-full min-w-0 flex flex-col h-full">
        {renderGameCard()}
      </div>
      
    </div>
  );
}