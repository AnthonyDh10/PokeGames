import Card from "./Card";
import { colors } from "../design/colors";

const GAME_COLORS = {
  primary: colors.ui.grayMid,
  light: colors.brand.white,
  dark: colors.ui.grayDark,
  deep: colors.ui.grayBorderDark,
};

export default function MultiplayerRulesCard() {
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
          <span className="font-display text-2xl tracking-wider text-white drop-shadow-md text-center">Règles — Multijoueur</span>
        </div>
      }
    >
      <div className="flex flex-col flex-1 p-4 sm:p-6 gap-4 min-h-0">
        <h3 className="font-heading text-lg sm:text-xl font-semibold" style={{ color: GAME_COLORS.primary }}>
          Jouer à plusieurs
        </h3>

        <div className="flex-1 overflow-y-auto font-heading text-sm sm:text-base leading-relaxed text-gray-700 min-h-0 pr-2 custom-scrollbar">
          <p className="mb-3">Crée une partie, partage le code de session avec tes amis et affrontez-vous en temps réel.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Un joueur crée la session et devient l'hôte.</li>
            <li>Les autres rejoignent via le code de session.</li>
            <li>Chaque manche propose un Pokémon — le plus rapide à deviner marque des points.</li>
            <li>Utiliser des indices réduit le score mais aide à trouver la réponse.</li>
            <li>À la fin, le joueur avec le meilleur score remporte la partie.</li>
          </ul>

          <p className="text-sm text-gray-500 mt-4">Le mode multijoueur est optimisé pour 2 à 4 joueurs et fonctionne sur le même réseau ou en ligne.</p>
        </div>
      </div>
    </Card>
  );
}
