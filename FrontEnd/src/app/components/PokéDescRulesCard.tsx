import { useState } from "react";
import { colors } from "../design/colors";
import Card from "./Card";
import PixelButton, { pixelClipPathSm } from "./PixelButton";

interface GameRulesPage {
  title: string;
  content: React.ReactNode;
}

const POKEDESC_RULES: GameRulesPage[] = [
  {
    title: "Le but du jeu",
    content: (
      <div className="space-y-4">
        <p>
          Lis les descriptions issues du Pokédex et sois le plus rapide pour deviner quel Pokémon s'y cache !
        </p>
        <p>
          En multijoueur, affronte ton ami pour trouver la réponse le plus rapidement possible tout en utilisant le moins d'indices.
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
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Nombre de Pokémon :</strong> Choisis la longueur de la partie (de 1 à 6 manches).</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Chronomètre :</strong> Définis le temps accordé par Pokémon (30s, 60s, 120s ou sans limite).</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Générations :</strong> Sélectionne les générations autorisées.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Mode Multijoueur :</strong> Invite un ami en lui envoyant ton code de session.</span>
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
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Navigue :</strong> Fais défiler les différentes descriptions du Pokémon à l'aide des flèches &lt; et &gt;.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Devine :</strong> Tape ta réponse dans la barre de recherche. Une liste déroulante te suggère automatiquement les noms correspondants.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Tentatives :</strong> Tu disposes de 3 essais maximum par Pokémon.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Transition :</strong> La manche passe automatiquement au Pokémon suivant dès que tu trouves la bonne réponse, que tu épuises tes 3 essais, ou que le chronomètre tombe à zéro.</span>
        </li>
      </ul>
    ),
  },
  {
    title: "3. Indices et Scores",
    content: (
      <div className="space-y-4">
        <p>Trouver un Pokémon du premier coup et sans aide te rapporte <strong className="text-gray-900">100 points</strong>.</p>
        <p>Chaque indice filtre automatiquement ta liste déroulante de réponses, mais pénalise ton score et ton chronomètre :</p>
        
        <div className="overflow-x-auto mt-6">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b-2 border-gray-900 text-gray-900">
                <th className="py-3 px-2 font-semibold">Indice dévoilé</th>
                <th className="py-3 px-2 font-semibold">Points perdus</th>
                <th className="py-3 px-2 font-semibold">Temps perdu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-100">
                <td className="py-3 px-2">Type 1 & 2</td>
                <td className="py-3 px-2 text-red-500 font-medium">-10 pts</td>
                <td className="py-3 px-2 text-orange-500">-10 sec</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="py-3 px-2">Génération</td>
                <td className="py-3 px-2 text-red-500 font-medium">-10 pts</td>
                <td className="py-3 px-2 text-orange-500">-10 sec</td>
              </tr>
              <tr className="hover:bg-gray-100">
                <td className="py-3 px-2">Silhouette</td>
                <td className="py-3 px-2 text-red-600 font-medium">-30 pts</td>
                <td className="py-3 px-2 text-orange-600">-30 sec</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-sm mt-4 text-gray-500">En multijoueur, le joueur avec le score final le plus élevé remporte la partie !</p>
      </div>
    ),
  },
  {
    title: "4. Fin de partie",
    content: (
      <div className="space-y-4">
        <p>Une fois tous les Pokémon passés, les scores sont comparés et le grand vainqueur est couronné ! Depuis cet écran, tu peux :</p>
        <ul className="space-y-3 mt-4">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Relancer :</strong> Rejouer immédiatement avec les mêmes paramètres.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Retourner au lobby :</strong> Modifier les règles, le temps ou les générations.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Quitter :</strong> Revenir au menu principal.</span>
          </li>
        </ul>
      </div>
    ),
  },
];

const GAME_COLORS = {
  primary: colors.brand.blue,
  light: colors.brand.blueLight,
  dark: colors.brand.blueDark,
  deep: colors.brand.blueDeep,
};

export default function PokéDescRulesCard() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const activePage = POKEDESC_RULES[currentPageIndex];
  const totalPages = POKEDESC_RULES.length;

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
            Règles — PokéDesc
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
