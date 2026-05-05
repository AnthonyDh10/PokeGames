import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import GameCard from "../components/GameCard";
import SectionTitle from "../components/SectionTitle";
import { useBackgroundStore } from "../store/backgroundStore";
import { useNavDirectionStore } from "../store/navDirectionStore";
import { colors } from "../design/colors";
import oakWebp from "../components/images/oak.webp";
import dialogueImg from "../components/images/dialogue.png";
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
              Lisez les descriptions issues du Pokédex et soyez le meilleur pour deviner quel Pokémon s'y cache !
            </p>
            <p>
              En multijoueur, affrontez votre ami pour trouver la réponse le plus rapidement possible tout en utilisant le moins d'indices.
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
                <span><strong className="text-gray-900">Nombre de Pokémon :</strong> Choisissez la longueur de la partie (de 1 à 6 manches).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Chronomètre :</strong> Définissez le temps accordé par Pokémon (30s, 60s, 120s ou sans limite).</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Générations :</strong> Sélectionnez les générations autorisées.</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <span><strong className="text-gray-900">Mode Multijoueur :</strong> Invitez un ami en lui envoyant votre code de session.</span>
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
              <span><strong className="text-gray-900">Naviguez :</strong> Faites défiler les différentes descriptions du Pokémon à l'aide des flèches &lt; et &gt;.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Devinez :</strong> Tapez votre réponse dans la barre de recherche. Une liste déroulante vous suggère automatiquement les noms correspondants.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Tentatives :</strong> Vous disposez de 3 essais maximum par Pokémon.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
              <span><strong className="text-gray-900">Transition :</strong> La manche passe automatiquement au Pokémon suivant dès que vous trouvez la bonne réponse, que vous épuisez vos 3 essais, ou que le chronomètre tombe à zéro.</span>
            </li>
          </ul>
        ),
      },
      {
        title: "3. Indices et Scores",
        content: (
          <div className="space-y-4">
            <p>Trouver un Pokémon du premier coup et sans aide vous rapporte <strong className="text-gray-900">100 points</strong>.</p>
            <p>Chaque indice filtre automatiquement votre liste déroulante de réponses, mais pénalise votre score et votre chronomètre :</p>
            
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
            <p>Une fois tous les Pokémon passés, les scores sont comparés et le grand vainqueur est couronné ! Depuis cet écran, vous pouvez :</p>
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
    title: "Règles — Quel est ce type ?",
    color: colors.brand.yellow,
    pages: [
      {
        title: "Comment jouer",
        content: (
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <span>Un type Pokémon est tiré au sort à chaque manche.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <span>Ses forces, faiblesses et immunités te sont révélées progressivement.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <span>Devine le type en te basant sur les indices affichés.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
              <span>Moins tu utilises d'indices, plus ton score est élevé.</span>
            </li>
          </ul>
        ),
      },
    ],
  },
  dezoom: {
    title: "Règles — Dézoom",
    color: colors.brand.red,
    pages: [
      {
        title: "Comment jouer",
        content: (
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span>Un Pokémon est affiché en très gros plan — tu ne vois qu'une petite partie de son sprite.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span>L'image se dézoom progressivement à chaque seconde.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span>Identifie le Pokémon le plus tôt possible pour maximiser ton score.</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
              <span>Plus tu devines vite, plus ton score sera élevé !</span>
            </li>
          </ul>
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
  const { setBackground } = useBackgroundStore();
  const { direction, setDirection } = useNavDirectionStore();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState<keyof typeof GAME_RULES | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  useEffect(() => {
    setBackground({ colorLeft: colors.ui.bgLeft, colorStripe: colors.ui.bgStripe, colorRight: colors.ui.bgRight });
  }, []);

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
    <div className="space-y-6">
      <SectionTitle>Règles des jeux</SectionTitle>

      <div className="flex items-stretch min-h-screen gap-8">
        {/* Gauche — Chen */}
        <motion.div
          className="hidden md:flex flex-col flex-1 items-center justify-start h-screen pt-8"
          custom={direction}
          variants={chenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <img
            src={oakWebp}
            alt="Professeur Chen"
            className="w-128 h-128 object-contain"
          />
          <div className="relative inline-block w-64 md:w-80 lg:w-96">
            <img
              src={dialogueImg}
              alt="Bulle de dialogue"
              className="mt-4 w-full object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center px-4 md:px-6">
              <p className="mt-4 w-full text-center lg:text-center text-sm md:text-lg leading-relaxed min-w-0 break-words">
                Clique sur un jeu pour en lire les règles !
              </p>
            </div>
          </div>
        </motion.div>

        {/* Droite — GameCards */}
        <motion.div
          className="flex-1 space-y-6"
          custom={direction}
          variants={cardsVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          <GameCard
            title="PokéDesc"
            description="Découvre les règles ici !"
            color={colors.brand.blue}
            image={pokedescLogo}
            to="/pokedesc"
            onClick={() => handleOpenModal("pokedesc")}
          />

          <GameCard
            title="Quel est ce type ?"
            description="Découvre les règles ici !"
            color={colors.brand.yellow}
            image={typeLogo}
            to="/types"
            onClick={() => handleOpenModal("types")}
          />

          <GameCard
            title="Dézoom"
            description="Découvre les règles ici !"
            color={colors.brand.red}
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
                  className="text-2xl font-display tracking-wide"
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
