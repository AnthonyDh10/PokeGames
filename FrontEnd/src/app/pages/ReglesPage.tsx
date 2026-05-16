import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard from "../components/GameCard";
import SectionTitle from "../components/SectionTitle";
import { useNavDirectionStore } from "../store/navDirectionStore";
import { colors } from "../design/colors";
import oak from "../components/images/oak.png";
import pokedescLogo from "../components/images/pokedesc-logo-transparant.png";
import typeLogo from "../components/images/type-logo.png";
import dezoomLogo from "../components/images/dezoom-logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

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
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Nombre de Pokémon :</strong> Choisis la longueur de la partie (de 1 à 6 manches).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Chronomètre :</strong> Définis le temps accordé par Pokémon (30s, 60s, 120s ou sans limite).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Générations :</strong> Sélectionne les générations autorisées.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
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
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Navigue :</strong> Fais défiler les différentes descriptions du Pokémon à l'aide des flèches &lt; et &gt;.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Devine :</strong> Tape ta réponse dans la barre de recherche. Une liste déroulante te suggère automatiquement les noms correspondants.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Tentatives :</strong> Tu disposes de 3 essais maximum par Pokémon.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
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
                  <tr className="border-b-2 border-gray-100 text-gray-900">
                    <th className="py-3 px-2 font-semibold">Indice dévoilé</th>
                    <th className="py-3 px-2 font-semibold">Points perdus</th>
                    <th className="py-3 px-2 font-semibold">Temps perdu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-3 px-2">Type 1 & 2</td>
                    <td className="py-3 px-2 text-red-500 font-medium">-10 pts</td>
                    <td className="py-3 px-2 text-orange-500">-10 sec</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-3 px-2">Génération</td>
                    <td className="py-3 px-2 text-red-500 font-medium">-10 pts</td>
                    <td className="py-3 px-2 text-orange-500">-10 sec</td>
                  </tr>
                  <tr className="hover:bg-gray-50/50">
                    <td className="py-3 px-2">Silhouette</td>
                    <td className="py-3 px-2 text-red-600 font-medium">-30 pts</td>
                    <td className="py-3 px-2 text-orange-600">-30 sec</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm mt-4 text-gray-500">En multijoueur, le joueur avec le score final le plus élevé (celui qui a utilisé le moins d'indices et été le plus rapide) remporte la partie !</p>
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
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Relancer :</strong> Rejouer immédiatement avec les mêmes paramètres.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Retourner au lobby :</strong> Modifier les règles, le temps ou les générations.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
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
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Observe :</strong> Un tableau d'interactions s'affiche (faiblesses x2 et x4, résistances x2 et x4, dégâts normaux et immunités). <br/><span className="text-sm text-gray-500 mt-1 block">⚠️ Attention, la paire générée peut être inédite et ne correspondre à aucun Pokémon existant dans le jeu officiel !</span></span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Devine :</strong> Saisis les deux types qui composent cette paire dans le champ de réponse.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
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
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Relancer.</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Retourner au lobby.</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Revenir au menu principal.</strong> </span>
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
  dezoom: {
    title: "Règles — Dex-zoom",
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
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Générations :</strong> Sélectionne les générations autorisées (ex: jouer uniquement les Pokémon de la 1ère génération).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
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
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Observe :</strong> Analyse la petite zone visible du Pokémon masqué.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Devine :</strong> Tape ta réponse dans la barre de recherche. Une liste déroulante te suggère des noms et des filtres sont à ta disposition pour affiner tes choix.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Tentatives et Pénalités :</strong> Tu disposes de 4 essais maximum. À chaque mauvaise tentative, le carré visible s'agrandit pour t'aider, mais <strong className="text-red-600">10 secondes de pénalité</strong> s'ajoutent à ton chronomètre !</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Transition :</strong> La manche se termine automatiquement lorsque tu trouves la bonne réponse, que tu épuises tes 4 essais, ou que le temps est écoulé.</span>
            </li>
          </ul>
        ),
      },
      {
        title: "3. Fin de partie",
        content: (
          <div className="space-y-4">
            <p>En multijoueur, le joueur qui parvient à identifier le Pokémon le plus rapidement (en tenant compte des pénalités de temps liées aux mauvaises tentatives) remporte la manche.</p>
            <p>Une fois toutes les manches terminées, le grand vainqueur est couronné ! Depuis l'écran de fin, tu peux :</p>
            <ul className="space-y-3 mt-4">
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Relancer :</strong> Rejouer immédiatement avec les mêmes paramètres.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Retourner au lobby :</strong> Modifier les règles, le temps ou les générations.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Quitter :</strong> Revenir au menu principal.</span>
              </li>
            </ul>
          </div>
        ),
      },
    ],
  },
};

// Mêmes variants que HomePage — la direction est commune
const chenVariants = {
  initial: (dir: string) => ({
    x: dir === "forward" ? 120 : -120,
    opacity: 0,
  }),
  animate: { x: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: (dir: string) => ({
    x: dir === "backward" ? 120 : -120,
    opacity: 0,
    transition: { duration: 0.35, ease: "easeIn" as const },
  }),
};

const cardsVariants = {
  initial: { y: -40, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: { y: 40, opacity: 0, transition: { duration: 0.3, ease: "easeIn" as const } },
};

export default function ReglesPage() {
  const { direction, setDirection } = useNavDirectionStore();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState<keyof typeof GAME_RULES | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const handleOpenModal = (gameKey: keyof typeof GAME_RULES) => {
    setOpenModal(gameKey);
    setCurrentPageIndex(0);
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setCurrentPageIndex(0);
  };

  const activeRules = openModal ? GAME_RULES[openModal] : null;
  const activePage = activeRules ? activeRules.pages[currentPageIndex] : null;
  const totalPages = activeRules ? activeRules.pages.length : 0;

  const goToPreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

return (
  /* Augmentation des marges latérales (px-12 et lg:px-24) */
  <div className="space-y-6 py-10 px-8 sm:px-12 lg:px-24">
    {/* gap-4 pour réduire l'espace entre Chen et les cartes */}
    <div className="flex items-stretch min-h-screen gap-4">
      
      {/* Gauche — Chen (35%) */}
      <motion.div
        /* w-[35%] fixe la largeur, flex-shrink-0 empêche la compression */
        className="hidden md:flex flex-col w-[35%] flex-shrink-0 items-center justify-start h-screen pt-8"
        custom={direction}
        variants={chenVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <img
          src={oak}
          alt="Professeur Chen"
          /* w-full pour qu'il occupe bien l'espace des 35% */
          className="w-full max-w-sm h-auto object-contain"
        />
      </motion.div>

      {/* Droite — GameCards (65%) */}
      <motion.div
        /* w-[65%] fixe la largeur */
        className="w-[65%] space-y-6 mt-10"
        custom={direction}
        variants={cardsVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <GameCard
          title="POKÉDESC"
          description="Découvre les règles ici !"
          color={colors.brand.blue}
          secondColor={colors.brand.blueDeep}
          colorLight={colors.brand.blueLight}
          colorDark={colors.brand.blueDark}
          image={pokedescLogo}
          to="/pokedesc"
          onClick={() => handleOpenModal("pokedesc")}
        />

        <GameCard
          title="TYPUZZLE"
          description="Découvre les règles ici !"
          color={colors.brand.yellow}
          secondColor={colors.brand.yellowDark}
          colorLight={colors.brand.yellowLight}
          colorDark={colors.brand.yellowWarm}
          image={typeLogo}
          to="/types"
          onClick={() => handleOpenModal("types")}
        />

        <GameCard
          title="DEX-ZOOM"
          description="Découvre les règles ici !"
          color={colors.brand.red}
          secondColor={colors.brand.redDeep}
          colorLight={colors.brand.redLight}
          colorDark={colors.brand.redDark}
          image={dezoomLogo}
          to="/dezoom"
          onClick={() => handleOpenModal("dezoom")}
        />
      </motion.div>
    </div>
  

{/* Modal des règles */}
      <Dialog open={openModal !== null} onOpenChange={(open) => { if (!open) handleCloseModal(); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden bg-white sm:rounded-xl">
          {activeRules && activePage && (
            <>
              {/* Header fixe */}
              <DialogHeader className="px-6 py-5 border-b border-gray-100 bg-white z-10 flex-shrink-0">
                <DialogTitle
                  className="text-2xl font-heading tracking-wide"
                  style={{ color: activeRules.color }}
                >
                  {activeRules.title}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Étape {currentPageIndex + 1} sur {totalPages}
                </p>
              </DialogHeader>

              {/* Contenu scrollable (sans animation) */}
              <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
                <h3 className="text-lg font-semibold mb-5" style={{ color: activeRules.color }}>
                  {activePage.title}
                </h3>
                <div className="text-base leading-relaxed text-gray-700">
                  {activePage.content}
                </div>
              </div>

              {/* Footer fixe (Navigation) */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between flex-shrink-0">
                  <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 px-3 py-2"
                    onClick={goToPreviousPage}
                    disabled={currentPageIndex === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Précédent
                  </Button>

                  <div className="flex gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPageIndex(i)}
                        className={`h-1.5 rounded-full transition-colors ${
                          i === currentPageIndex
                            ? "w-6 bg-current"
                            : "w-1.5 bg-gray-200 hover:bg-gray-300"
                        }`}
                        style={i === currentPageIndex ? { color: activeRules.color } : undefined}
                        aria-label={`Aller à la page ${i + 1}`}
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-gray-900 hover:bg-gray-200 px-3 py-2"
                    onClick={goToNextPage}
                    disabled={currentPageIndex === totalPages - 1}
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
