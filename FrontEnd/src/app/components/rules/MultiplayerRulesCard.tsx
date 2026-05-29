import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../primitives/Card";
import { colors } from "../../design/colors";

interface GameRulesPage {
  title: React.ReactNode;
  content: React.ReactNode;
}

const MULTIPLAYER_RULES: GameRulesPage[] = [
  {
    title: <p className="font-heading text-center" style={{fontSize: "1.25rem", color: colors.ui.textMuted}}>Comment jouer à deux ?</p>,
    content: (
      <>
        <p className="mb-4 mt-4 font-heading" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          Crée une partie pour t'entraîner en solo, ou envoie ton code de session à un ami pour l'affronter en duel !
        </p>

        <ul className="list-none space-y-3 mt-2" style={{ color: colors.ui.textMuted, fontSize: "1.25rem" }}>
          <li className="flex gap-2">
            <span className="text-gray-400">❖</span>
            <span><strong>Salle d'attente :</strong> Le créateur de la partie est l'hôte. Lui seul peut modifier les paramètres et démarrer le jeu.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400">❖</span>
            <span><strong>En jeu :</strong> Les deux joueurs affrontent exactement les mêmes défis en simultané.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400">❖</span>
            <span><strong>Chat en direct :</strong> Une envie de taquiner ou aider ton rival ? Clique sur l'onglet "Chat" à droite de l'écran pour discuter avec lui pendant la partie.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400">❖</span>
            <span><strong>Victoire :</strong> Garde un œil sur le chrono ! Sois le plus rapide ou marque le plus de points pour gagner.</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gray-400">❖</span>
            <span><strong>Fin de partie :</strong> Rejouez directement avec les mêmes règles, retournez dans la salle d'attente pour les modifier, ou revenez au menu principal.</span>
          </li>
        </ul>

        <p className="text-sm text-gray-500 mt-5 italic font-heading">
          Note : Tous les mini-jeux sont jouables à 2 joueurs maximum.
        </p>

        <p className="font-display mt-16 text-center">Bonne chance à vous deux et<br/> attrapez-les tous !</p>
      </>
    ),
  },
];

const GAME_COLORS = {
  primary: colors.ui.grayMid,
  light: colors.brand.white,
  dark: colors.ui.grayDark,
  deep: colors.ui.grayBorderDark,
};

/**
 * Carte de règles Multijoueur avec pagination.
 * Affiche les règles page par page via `MULTIPLAYER_RULES`.
 */
export default function MultiplayerRulesCard() {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const navigate = useNavigate();
  const activePage = MULTIPLAYER_RULES[currentPageIndex];
  const totalPages = MULTIPLAYER_RULES.length;

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
      pokeballOpacity={0.06}
      pokeballSize={200}
      headerClassName="py-5"
      animation={false}
      header={
        <div className="flex flex-col items-center gap-1.5 w-full">
          <span className="font-display text-2xl tracking-wider text-white drop-shadow-md text-center">
            Multijoueur
          </span>
        </div>
      }
    >
      <div className="flex flex-col flex-1 p-4 sm:p-6 gap-4 min-h-0">
        <h3 className="font-heading text-lg sm:text-xl font-semibold" style={{ color: GAME_COLORS.primary }}>
          {activePage.title}
        </h3>

        <div className="flex-1 overflow-y-auto font-heading text-sm sm:text-base leading-relaxed text-gray-700 min-h-0 pr-2 custom-scrollbar">
          {activePage.content}
        </div>

      </div>
    </Card>
  );
}