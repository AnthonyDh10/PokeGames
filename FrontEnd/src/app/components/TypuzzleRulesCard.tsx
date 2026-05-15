import { useState } from "react";
import { colors } from "../design/colors";
import Card from "./Card";
import PixelButton, { pixelClipPathSm } from "./PixelButton";

interface GameRulesPage {
  title: string;
  content: React.ReactNode;
}

const TYPUZZLE_RULES: GameRulesPage[] = [
  {
    title: "Le but du jeu",
    content: (
      <div className="space-y-4">
        <p>
          Analyse un tableau d'interactions de types (faiblesses, résistances, immunités) et sois le meilleur pour deviner quelle paire de types s'y cache !
        </p>
        <p>
          En multijoueur, affronte ton ami pour trouver la combinaison exacte le plus rapidement possible.
        </p>
      </div>
    ),
  },
  {
    title: "1. Déroulement d'une manche",
    content: (
      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Observe :</strong> Un tableau d'interactions s'affiche (faiblesses x2 et x4, résistances x2 et x4, dégâts normaux et immunités). <br/><span className="text-sm text-gray-500 mt-1 block">⚠️ Attention, la paire générée peut être inédite et ne correspondre à aucun Pokémon existant dans le jeu officiel !</span></span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Devine :</strong> Saisis les deux types qui composent cette paire dans le champ de réponse.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Transition :</strong> La manche se termine instantanément dès que tu as deviné correctement les deux types.</span>
        </li>
      </ul>
    ),
  },
  {
    title: "2. Fin de partie",
    content: (
      <div className="space-y-4">
        <p>En multijoueur, le joueur qui parvient à deviner la bonne combinaison le plus rapidement remporte la manche.</p>
        <p>Depuis l'écran de fin, tu peux :</p>
        <ul className="space-y-3 mt-4">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Relancer.</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Retourner au lobby.</strong></span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Revenir au menu principal.</strong> </span>
          </li>
        </ul>
      </div>
    ),
  },
];

const GAME_COLORS = {
  primary: colors.brand.yellow,
  light: colors.brand.yellowLight,
  dark: colors.brand.yellowWarm,
  deep: colors.brand.yellowDark,
};

export default function TypuzzleRulesCard() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const activePage = TYPUZZLE_RULES[currentPageIndex];
  const totalPages = TYPUZZLE_RULES.length;

  const goToPrev = () => {
    if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1);
  };

  const goToNext = () => {
    if (currentPageIndex < totalPages - 1) setCurrentPageIndex(currentPageIndex + 1);
  };

  return (
    <Card
      showHeader
      headerColor={GAME_COLORS.primary}
      borderColor={GAME_COLORS.deep}
      pokeballColor={GAME_COLORS.light}
      pokeballOpacity={0.1}
      pokeballSize={220}
      headerClassName="py-5"
      animation={false}
      header={
        <div className="flex flex-col items-center gap-1.5 w-full">
          <span className="font-display text-2xl tracking-wider text-white drop-shadow-md text-center">
            Règles — Typuzzle
          </span>
          <div className="flex items-center gap-2">
            <span className="h-1 w-8 rounded-full bg-white/30"></span>
            <span className="font-heading text-sm text-white/90 font-medium">
              Page {currentPageIndex + 1} sur {totalPages}
            </span>
            <span className="h-1 w-8 rounded-full bg-white/30"></span>
          </div>
        </div>
      }
    >
      <div className="flex flex-col flex-1 p-4 sm:p-6 gap-6 min-h-0">
        <h3 className="font-heading text-lg sm:text-xl font-semibold" style={{ color: GAME_COLORS.primary }}>
          {activePage.title}
        </h3>

        <div className="flex-1 overflow-y-auto font-heading text-sm sm:text-base leading-relaxed text-gray-700 min-h-0 pr-2 custom-scrollbar">
          {activePage.content}
        </div>

        <div className="flex items-center justify-between gap-4 mt-2 pt-4 border-t border-gray-100">
          <PixelButton
            colorBorder={GAME_COLORS.deep}
            colorLight={GAME_COLORS.light}
            colorDark={GAME_COLORS.dark}
            color={GAME_COLORS.primary}
            onClick={goToPrev}
            disabled={currentPageIndex === 0}
            className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95"
            clipPath={pixelClipPathSm}
          >
            <span className="font-heading text-white text-xl pb-1">◀</span>
          </PixelButton>

          {totalPages > 1 && (
            <div className="flex flex-col items-center">
              <span className="font-heading font-bold text-lg tabular-nums text-gray-800">
                {currentPageIndex + 1} <span className="text-gray-400 mx-1">/</span> {totalPages}
              </span>
            </div>
          )}

          <PixelButton
            colorBorder={GAME_COLORS.deep}
            colorLight={GAME_COLORS.light}
            colorDark={GAME_COLORS.dark}
            color={GAME_COLORS.primary}
            onClick={goToNext}
            disabled={currentPageIndex === totalPages - 1}
            className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95"
            clipPath={pixelClipPathSm}
          >
            <span className="font-heading text-white text-xl pb-1">▶</span>
          </PixelButton>
        </div>
      </div>
    </Card>
  );
}
