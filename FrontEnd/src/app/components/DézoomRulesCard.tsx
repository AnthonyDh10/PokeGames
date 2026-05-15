import { useState } from "react";
import { colors } from "../design/colors";
import Card from "./Card";
import PixelButton, { pixelClipPathSm } from "./PixelButton";

interface GameRulesPage {
  title: string;
  content: React.ReactNode;
}

const DEZOOM_RULES: GameRulesPage[] = [
  {
    title: "Le but du jeu",
    content: (
      <div className="space-y-4">
        <p>
          Un Pokémon est caché à l'écran, à l'exception d'un petit carré qui dévoile une partie de son corps. Sois le meilleur pour deviner de qui il s'agit !
        </p>
        <p>
          En multijoueur, affronte ton ami pour trouver la bonne réponse le plus rapidement possible et avec le moins d'erreurs.
        </p>
      </div>
    ),
  },
  {
    title: "1. Préparation de la partie (Lobby)",
    content: (
      <div className="space-y-4">
        <p className="font-medium text-gray-900">Avant de lancer le jeu, l'hôte de la partie doit configurer la session :</p>
        <ul className="space-y-3 mt-2">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Générations :</strong> Sélectionne les générations autorisées (ex: jouer uniquement les Pokémon de la 1ère génération).</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Mode Solo ou Multijoueur :</strong> Invite un ami en lui envoyant ton code de session.</span>
          </li>
        </ul>
        <p className="text-sm italic text-gray-500 mt-4">Seul l'hôte peut modifier les paramètres.</p>
      </div>
    ),
  },
  {
    title: "2. Déroulement d'une manche",
    content: (
      <ul className="space-y-4">
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Observe :</strong> Analyse la petite zone visible du Pokémon masqué.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Devine :</strong> Tape ta réponse dans la barre de recherche. Une liste déroulante te suggère des noms et des filtres sont à ta disposition pour affiner tes choix.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Tentatives et Pénalités :</strong> Tu disposes de 4 essais maximum. À chaque mauvaise tentative, le carré visible s'agrandit pour t'aider, mais <strong className="text-red-600">10 secondes de pénalité</strong> s'ajoutent à ton chronomètre !</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Transition :</strong> La manche se termine automatiquement lorsque tu trouves la bonne réponse, que tu épuises tes 4 essais, ou que le temps est écoulé.</span>
        </li>
      </ul>
    ),
  },
  {
    title: "3. Fin de partie",
    content: (
      <div className="space-y-4">
        <p>En multijoueur, le joueur qui parvient à identifier le Pokémon le plus rapidement remporte la manche.</p>
        <p>Une fois toutes les manches terminées, le grand vainqueur est couronné ! Depuis l'écran de fin, tu peux :</p>
        <ul className="space-y-3 mt-4">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Relancer :</strong> Rejouer immédiatement avec les mêmes paramètres.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Retourner au lobby :</strong> Modifier les règles, le temps ou les générations.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Quitter :</strong> Revenir au menu principal.</span>
          </li>
        </ul>
      </div>
    ),
  },
];

const GAME_COLORS = {
  primary: colors.brand.red,
  light: colors.brand.redLight,
  dark: colors.brand.redDark,
  deep: colors.brand.redDeep,
};

export default function DézoomRulesCard() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const activePage = DEZOOM_RULES[currentPageIndex];
  const totalPages = DEZOOM_RULES.length;

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
            Règles — Dézoom
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
