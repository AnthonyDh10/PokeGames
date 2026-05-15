import { useState } from "react";
import GameCard from "../components/GameCard";
import { useNavDirectionStore } from "../store/navDirectionStore";
import { colors } from "../design/colors";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import Card from "../components/Card";
import PixelButton, { pixelClipPathSm } from "../components/PixelButton";

interface GameRulesPage {
  title: string;
  content: React.ReactNode;
}

interface GameRules {
  title: string;
  color: string;
  pages: GameRulesPage[];
}

const GAME_RULES: Record<string, GameRules> = {
  pokedesc: {
    title: "Règles — PokéDesc",
    color: colors.brand.blue,
    pages: [
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
    ],
  },
  types: {
    title: "Règles — Typuzzle",
    color: colors.brand.yellow,
    pages: [
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
    ],
  },
  dezoom: {
    title: "Règles — Dézoom",
    color: colors.brand.red,
    pages: [
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
    ],
  },
};

const GAME_COLORS: Record<string, { primary: string; light: string; dark: string; deep: string }> = {
  pokedesc: {
    primary: colors.brand.blue,
    light: colors.brand.blueLight,
    dark: colors.brand.blueDark,
    deep: colors.brand.blueDeep,
  },
  types: {
    primary: colors.brand.yellow,
    light: colors.brand.yellowLight,
    dark: colors.brand.yellowDark,
    deep: colors.brand.yellowDark,
  },
  dezoom: {
    primary: colors.brand.red,
    light: colors.brand.redLight,
    dark: colors.brand.redDark,
    deep: colors.brand.redDeep,
  },
};

/** Panneau de navigation des règles */
function RulesNavPanel({
  activeGame,
  activeRules,
  activePage,
  currentPageIndex,
  totalPages,
  onPrev,
  onNext,
}: {
  activeGame: string;
  activeRules: GameRules;
  activePage: GameRulesPage;
  currentPageIndex: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const gc = GAME_COLORS[activeGame];
  return (
    <div className="flex flex-col flex-1 p-4 sm:p-6 gap-6 min-h-0">
      <h3 className="font-heading text-lg sm:text-xl font-semibold" style={{ color: activeRules.color }}>
        {activePage.title}
      </h3>

      {/* Contenu avec scroll si nécessaire */}
      <div className="flex-1 overflow-y-auto font-heading text-sm sm:text-base leading-relaxed text-gray-700 min-h-0 pr-2 custom-scrollbar">
        {activePage.content}
      </div>

      {/* Navigation ◀ ▶ */}
      <div className="flex items-center justify-between gap-4 mt-2 pt-4 border-t border-gray-100">
        <PixelButton
          colorBorder={gc.deep} colorLight={gc.light} colorDark={gc.dark} color={gc.primary}
          onClick={onPrev} disabled={currentPageIndex === 0}
          className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95" clipPath={pixelClipPathSm}
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
          colorBorder={gc.deep} colorLight={gc.light} colorDark={gc.dark} color={gc.primary}
          onClick={onNext} disabled={currentPageIndex === totalPages - 1}
          className="w-12 h-12 flex items-center justify-center transition-transform active:scale-95" clipPath={pixelClipPathSm}
        >
          <span className="font-heading text-white text-xl pb-1">▶</span>
        </PixelButton>
      </div>
    </div>
  );
}

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
  const { direction } = useNavDirectionStore();
  const [activeGame, setActiveGame] = useState<keyof typeof GAME_RULES>("pokedesc");
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleSelectGame = (gameKey: keyof typeof GAME_RULES) => {
    setActiveGame(gameKey);
    setCurrentPageIndex(0);
  };

  const activeRules = GAME_RULES[activeGame];
  const activePage = activeRules.pages[currentPageIndex];
  const totalPages = activeRules.pages.length;
  const gc = GAME_COLORS[activeGame];

  const goToPrev = () => { if (currentPageIndex > 0) setCurrentPageIndex(currentPageIndex - 1); };
  const goToNext = () => { if (currentPageIndex < totalPages - 1) setCurrentPageIndex(currentPageIndex + 1); };

  return (
    // Conteneur principal avec des marges adaptées
    <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row py-6 px-4 sm:px-6 gap-6 xl:gap-8 h-full">

      {/* ── Gauche — Menu de sélection ───────────────────────── */}
      {/* On augmente la largeur à lg:w-80 (320px) ou xl:w-96 (384px) pour éviter le rognage */}
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col">
        <Card
          showHeader
          headerColor={activeRules.color}
          borderColor={gc.deep}
          pokeballColor={gc.light}
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
        <Card
          showHeader
          headerColor={activeRules.color}
          borderColor={gc.deep}
          pokeballColor={gc.light}
          pokeballOpacity={0.1}
          pokeballSize={220}
          headerClassName="py-5"
          animation={false}
          header={
            <div className="flex flex-col items-center gap-1.5 w-full">
              <span className="font-display text-2xl tracking-wider text-white drop-shadow-md text-center">
                {activeRules.title}
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
          <RulesNavPanel
            activeGame={activeGame as string}
            activeRules={activeRules}
            activePage={activePage}
            currentPageIndex={currentPageIndex}
            totalPages={totalPages}
            onPrev={goToPrev}
            onNext={goToNext}
          />
        </Card>
      </div>
      
    </div>
  );
}