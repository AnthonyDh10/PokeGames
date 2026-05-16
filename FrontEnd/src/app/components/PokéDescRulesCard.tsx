import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { colors } from "../design/colors";
import Card from "./Card";
import PixelButton, { pixelClipPathSm } from "./PixelButton";
import pokedescLogo from "./images/pokedesc-logo.png";

interface GameRulesPage {
  title: React.ReactNode;
  content: React.ReactNode;
}

const POKEDESC_RULES: GameRulesPage[] = [
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.blueDark, fontSize: "1.5rem" }}>L'objectif du Dresseur</p>,
    content: (
      <div className="space-y-4">
        <p className="font-heading" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          Bienvenue dans le monde fascinant des Pokémon ! Ton but ? Lire les données du Pokédex et être le plus rapide pour deviner quel Pokémon s'y cache.
        </p>
        <p className="font-heading" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          En multijoueur, affronte tes rivaux pour trouver la réponse avant eux et avec le meilleur score, tout en gérant tes indices avec stratégie !
        </p>
        <div className="flex justify-center mt-16">
          <img
            src={pokedescLogo}
            alt="PokéDesc logo"
            className="w-full max-w-full object-contain"
            style={{ maxHeight: "200px" }}
            loading="lazy"
          />
        </div>

      </div>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.blueDark, fontSize: "1.5rem" }}>1. Préparation</p>,
    content: (
      <div className="space-y-4">
        <p className="font-heading mb-8" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>Avant de partir à l'aventure, l'hote configure la partie</p>
        <ul className="space-y-3 mt-2" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Nombre de Pokémon :</strong> Choisis le nombre de Pokémon que tu vas rencontrer dans la partie (de 1 à 6 manches de suite).</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Chronomètre :</strong> Définis le temps avant que le Pokémon ne s'enfuie. (30s, 60s, 120s ou temps infini).</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Générations :</strong> Choisis ta région préférée ou mélange-les toutes.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
            <span><strong className="text-gray-900">Multijoueur :</strong> Joue seul ou invite un ami en lui partageant le code de session.</span>
          </li>
        </ul>
        <p className="font-heading text-sm italic text-gray-500 mt-8">Seul l'hote de la partie peut modifier ces paramètres.</p>
      </div>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.blueDark, fontSize: "1.5rem" }}>2. Déroulement du combat</p>,
    content: (
      <ul className="space-y-4 mt-2" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Fouille les données :</strong> Utilise les flèches ◀ et ▶ pour faire défiler les descriptions du Pokédex du Pokémon à deviner.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Lance ton attaque :</strong> Tape ta réponse ! La liste déroulante t'aidera à compléter le nom.</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Poké Balls restantes :</strong> Tu n'as droit qu'à 3 tentatives par Pokémon. Utilise-les bien !</span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-2 h-2 bg-blue-500 mt-1.5 flex-shrink-0" />
          <span><strong className="text-gray-900">Fuite :</strong> On passe au Pokémon suivant si tu trouves la réponse, si tu rates 3 fois, ou si le temps tombe à zéro.</span>
        </li>
      </ul>
    ),
  },
  {
    title: <p className="font-heading text-center" style={{ color: colors.brand.blueDark, fontSize: "1.5rem" }}>3. Indices et Pénalités</p>,
    content: (
      <div className="font-heading space-y-4" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
        <p className="font-heading" style={{fontSize: "1.25rem"}}>Une capture parfaite rapporte <strong style={{color : colors.brand.blueDark, fontSize: "1.25rem"}}>100 points</strong>. Mais si tu bloques, tu peux révéler des indices. Mais cela te coûtera des points et un pourcentage de ton temps total !</p>
        
        <div className="overflow-x-auto mt-4 border border-gray-200">
          <table className="w-full text-sm text-left ">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-900 text-gray-900">
                <th className="py-2 px-2 font-semibold">Indice dévoilé</th>
                <th className="py-2 px-2 font-semibold">Points perdus</th>
                <th className="py-2 px-2 font-semibold">Temps perdu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-2 font-medium text-gray-900">Silhouette</td>
                <td className="py-2 px-2 text-red-600 font-bold">-50 pts</td>
                <td className="py-2 px-2 text-orange-600 font-bold">-50 %</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-2">Type 1 / Type 2 <span className="text-xs text-gray-500 italic">(chacun)</span></td>
                <td className="py-2 px-2 text-red-500 font-medium">-20 pts</td>
                <td className="py-2 px-2 text-orange-500">-20 %</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-2">Génération</td>
                <td className="py-2 px-2 text-red-500 font-medium">-15 pts</td>
                <td className="py-2 px-2 text-orange-500">-15 %</td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-2 px-2 text-xs">Catégorie / Stats / Talents / Taille / Poids</td>
                <td className="py-2 px-2 text-red-400 font-medium">-5 pts</td>
                <td className="py-2 px-2 text-orange-400">-5 %</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="font-heading text-sm mt-4 italic" style={{ color: colors.ui.textMuted }}>
          <strong  style={{ color: colors.brand.blueDark }}>Astuce de Dresseur :</strong> Révéler le Type 1, le Type 2 ou la Génération filtre automatiquement les propositions dans ta barre de recherche !
        </p>

              <div className="font-heading space-y-4" style={{ color: colors.ui.textMuted}}>
        <p className="font-heading" style={{ fontSize: "1.25rem", color: colors.brand.blueDark }}>
          En cas de mauvaise réponse, le Prof. Chen t'indiquera si le Pokémon que tu as proposé :
        </p>
        <ul className="space-y-3 mt-2">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-700 mt-1.5 flex-shrink-0" />
            <span>Partage le même <strong>Type</strong> que la cible (ou les types exacts).</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-700 mt-1.5 flex-shrink-0" />
            <span>Provient de la même <strong>Génération</strong>.</span>
          </li>
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-700 mt-1.5 flex-shrink-0" />
            <span>Fait partie de la même <strong>Famille d'évolution</strong> !</span>
          </li>
        </ul>
        <p className="font-display mt-8 text-center">Bonne chance et attrape-les tous !</p>
      </div>
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
  const navigate = useNavigate();
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
              onClick={() => navigate("/pokedesc")}
              className="h-12 flex items-center justify-center transition-transform active:scale-95"
              clipPath={pixelClipPathSm}
            >
              <span className="font-heading text-white mr-2 ml-2">  Commencer l'aventure  </span>
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