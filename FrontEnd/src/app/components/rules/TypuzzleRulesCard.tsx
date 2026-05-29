import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../../design/colors";
import Card from "../primitives/Card";
import PixelButton, { pixelClipPathSm } from "../primitives/PixelButton";
// N'oublie pas d'importer le bon logo pour Typuzzle
import typuzzleLogo from "../images/type-logo.png";

interface GameRulesPage {
  title: React.ReactNode;
  content: React.ReactNode;
}

const TYPUZZLE_RULES: GameRulesPage[] = [
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.yellowDark, fontSize: "1.5rem" }}>L'objectif du Dresseur</p>,
    content: (
      <div className="space-y-4">
        <p className="font-heading" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          Bienvenue dans l'arène de Typuzzle ! Ton but ? Analyser un tableau d'interactions défensives et faire appel à tes connaissances pour deviner quelle paire de types s'y cache.
        </p>
        <p className="font-heading" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          Ici, pas de système de points. Seul le chronomètre compte ! En multijoueur, sois le plus rapide à déduire la bonne combinaison pour écraser tes rivaux.
        </p>
        <div className="flex justify-center mt-16">
          <img
            src={typuzzleLogo}
            alt="Typuzzle logo"
            className="w-full max-w-full object-contain"
            style={{ maxHeight: "200px" }}
            loading="lazy"
          />
        </div>
      </div>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.yellowDark, fontSize: "1.5rem" }}>1. Préparation</p>,
    content: (
      <div className="space-y-4">
        <p className="font-heading mb-8" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>Avant de lancer le défi, l'hôte configure la partie :</p>
        <ul className="space-y-3 mt-2" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Multijoueur :</strong> Entraîne-toi en solo ou invite un ami avec ton code de session pour un duel de rapidité.</span>
          </li>
        </ul>
        <p className="font-heading text-sm italic text-gray-500 mt-8">Seul l'hôte de la partie peut modifier ces paramètres.</p>
      </div>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.yellowDark, fontSize: "1.5rem" }}>2. Déroulement du combat</p>,
    content: (
      <ul className="space-y-4 mt-2" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Analyse les interactions :</strong> Observe attentivement les faiblesses (x4, x2), les dégâts normaux (x1), les résistances (x0.5, x0.25) et les immunités affichées à l'écran.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Fais ton choix :</strong> Saisis le Type 1 et le Type 2 dans les barres de recherche, puis clique sur Valider. L'ordre des types n'a pas d'importance !</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-yellow-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Poké Balls restantes :</strong> Tu n'as droit qu'à 3 tentatives par puzzle. Au-delà, c'est un échec !</span>
        </li>
      </ul>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.yellowDark, fontSize: "1.5rem" }}>3. Vitesse et Victoire</p>,
    content: (
      <div className="font-heading space-y-4" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
        <p className="font-heading" style={{ fontSize: "1.25rem" }}>
          Dans Typuzzle, le savoir est une arme, mais la <strong style={{ color: colors.brand.yellowDark, fontSize: "1.25rem" }}>rapidité est la clé de la victoire !</strong>
        </p>
        
        <ul className="space-y-3 mt-6">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-600 mt-1.5 flex-shrink-0" />
            <span>En multijoueur, le gagnant de la manche est celui qui valide la bonne combinaison de types <strong className="text-gray-900">le plus rapidement possible</strong>.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-600 mt-1.5 flex-shrink-0" />
            <span>Si tu utilises tes 3 tentatives ou si le chronomètre tombe à zéro, tu perds la manche. Garde ton sang-froid !</span>
          </li>
        </ul>

        <p className="font-heading text-sm mt-8 italic p-4 bg-yellow-50 border border-yellow-200 rounded" style={{ color: colors.ui.textMuted }}>
          <strong style={{ color: colors.brand.yellowDark }}>💡 Astuce de Dresseur :</strong> Commence toujours par regarder les faiblesses x4, les doubles résistances x0.25 ou les immunités. Ce sont les indices les plus révélateurs pour identifier rapidement un double type !
        </p>
        
        <p className="font-display mt-8 text-center text-xl">Que le plus rapide gagne !</p>
      </div>
    ),
  },
];

// Adaptation des couleurs pour le thème Typuzzle (Jaune/Doré)
const GAME_COLORS = {
  primary: colors.brand.yellow || "#EAB308",
  light: colors.brand.yellowLight || "#FEF08A",
  dark: colors.brand.yellowWarm || "#A16207",
  deep: colors.brand.yellowDark || "#713F12",
};

/**
 * Carte de règles Typuzzle avec pagination.
 * Affiche les règles page par page via `TYPUZZLE_RULES`, avec bouton "Jouer" sur la dernière page.
 */
export default function TypuzzleRulesCard() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const navigate = useNavigate();
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
      pokeballOpacity={0.15}
      pokeballSize={220}
      headerClassName="py-5"
      animation={false}
      header={
        <div className="flex flex-col items-center gap-1.5 w-full">
          <span className="font-display text-2xl tracking-wider text-white drop-shadow-md text-center">
            Règles du Dresseur
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
            className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
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

          {currentPageIndex === totalPages - 1 ? (
            <PixelButton
              colorBorder={GAME_COLORS.deep}
              colorLight={GAME_COLORS.light}
              colorDark={GAME_COLORS.dark}
              color={GAME_COLORS.primary}
              onClick={() => navigate("/types")}
              className="h-12 flex items-center justify-center transition-transform active:scale-95"
              clipPath={pixelClipPathSm}
            >
              <span className="font-heading text-white mr-2 ml-2">  Commencer le défi  </span>
            </PixelButton>
          ) : (
            <PixelButton
              colorBorder={GAME_COLORS.deep}
              colorLight={GAME_COLORS.light}
              colorDark={GAME_COLORS.dark}
              color={GAME_COLORS.primary}
              onClick={goToNext}
              disabled={currentPageIndex === totalPages - 1}
              className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95 disabled:opacity-50"
              clipPath={pixelClipPathSm}
            >
              <span className="font-heading text-white text-xl pb-1">▶</span>
            </PixelButton>
          )}
        </div>
      </div>
    </Card>
  );
}