import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../design/colors";
import Card from "./Card";
import PixelButton, { pixelClipPathSm } from "./PixelButton";
// N'oublie pas d'importer le logo de Dex-Zoom
import dexzoomLogo from "./images/dezoom-logo.png";

interface GameRulesPage {
  title: React.ReactNode;
  content: React.ReactNode;
}

const DEXZOOM_RULES: GameRulesPage[] = [
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.redDark, fontSize: "1.5rem" }}>L'objectif du Dresseur</p>,
    content: (
      <div className="space-y-4">
        <p className="font-heading" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          Aiguise ton regard de Dresseur ! Dans Dex-Zoom, ton objectif est de reconnaître un Pokémon à partir d'un tout petit bout de son image.
        </p>
        <p className="font-heading" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          Un seul détail visuel te sépare de la victoire. En multijoueur, sois le premier à identifier le Pokémon caché pour remporter la manche !
        </p>
        <div className="flex justify-center mt-16">
          <img
            src={dexzoomLogo}
            alt="Dex-Zoom logo"
            className="w-full max-w-full object-contain"
            style={{ maxHeight: "200px" }}
            loading="lazy"
          />
        </div>
      </div>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.redDark, fontSize: "1.5rem" }}>1. Préparation</p>,
    content: (
      <div className="space-y-4">
        <p className="font-heading mb-8" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>Avant de lancer l'observation, l'hote configure la partie :</p>
        <ul className="space-y-3 mt-2" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Générations :</strong> Sélectionne les générations qui apparaîtront dans la partie.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Multijoueur :</strong> Joue en solo ou invite des rivaux avec ton code de session.</span>
          </li>
        </ul>
        <p className="font-heading text-sm italic text-gray-500 mt-8">Seul l'hôte de la partie peut modifier ces paramètres.</p>
      </div>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.redDark, fontSize: "1.5rem" }}>2. Le Déroulement du combat</p>,
    content: (
      <ul className="space-y-4 mt-2" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Observe bien :</strong> Au début de la manche, seule une petite partie du Pokémon est visible.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Poké Balls restantes :</strong> Tu disposes de  <strong style={{ color: colors.brand.redDark }}>3 tentatives</strong> pour deviner l'identité du Pokémon. Tape son nom dans la barre de recherche et valide.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Le Zoom :</strong> <strong style={{ color: colors.brand.redDark }}>À chaque tentative ratée, la zone affichée s'agrandit.</strong> Le Pokémon devient donc plus facile à reconnaître !</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-red-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Fuite :</strong> La partie se termine si tu trouves le Pokémon caché ou si tu rates tes 3 essais.</span>
        </li>
      </ul>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.redDark, fontSize: "1.5rem" }}>3. Outils et Astuces</p>,
    content: (
      <div className="font-heading space-y-4" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
        <p className="font-heading" style={{ fontSize: "1.25rem" }}>
          Un bout d'oreille ou de queue te dit quelque chose, mais le nom t'échappe ? Tu peux t'aider des <strong style={{ color: colors.brand.redDark, fontSize: "1.25rem" }}>filtres manuels !</strong>
        </p>
        
        <ul className="space-y-3 mt-6">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-600 mt-1.5 flex-shrink-0" />
            <span>Sous la barre de recherche, tu trouveras des filtres de <strong className="text-gray-900">Type 1 et Type 2</strong>.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-600 mt-1.5 flex-shrink-0" />
            <span>Si tu as une intuition sur le type du Pokémon grâce à ses couleurs, sélectionne-le : cela réduira drastiquement les propositions de la liste déroulante !</span>
          </li>
        </ul>

        <p className="font-heading text-sm mt-8 italic" style={{ color: colors.ui.textMuted }}>
          <strong style={{ color: colors.brand.redDark }}>Astuce de Dresseur :</strong> En multijoueur, le gagnant est celui qui trouve la bonne réponse le plus vite mais attention à ne pas gaspiller tes 3 essais !
        </p>
        
        <p className="font-display mt-8 text-center text-xl">Ouvre l'œil et attrape-les tous !</p>
      </div>
    ),
  },
];

// Adaptation des couleurs pour le thème Dex-Zoom (Rouge)
const GAME_COLORS = {
  primary: colors.brand.red || "#DC2626",
  light: colors.brand.redLight || "#FCA5A5",
  dark: colors.brand.redDark || "#991B1B",
  deep: colors.brand.redDeep || "#7F1D1D",
};

/**
 * Carte de règles DeZoom avec pagination.
 * Affiche les règles page par page via `DEXZOOM_RULES`, avec bouton "Jouer" sur la dernière page.
 */
export default function DexZoomRulesCard() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const navigate = useNavigate();
  const activePage = DEXZOOM_RULES[currentPageIndex];
  const totalPages = DEXZOOM_RULES.length;

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
              onClick={() => navigate("/dezoom")}
              className="h-12 flex items-center justify-center transition-transform active:scale-95"
              clipPath={pixelClipPathSm}
            >
              <span className="font-heading text-white mr-2 ml-2">  Lancer l'observation  </span>
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