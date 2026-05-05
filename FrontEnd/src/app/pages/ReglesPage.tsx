import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";
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

interface GameRules {
  title: string;
  color: string;
  rules: string[];
}

const GAME_RULES: Record<string, GameRules> = {
  pokedesc: {
    title: "Règles — PokéDesc",
    color: colors.brand.blue,
    rules: [
      "Un Pokémon est tiré au sort au début de chaque manche.",
      "Une description cryptée du Pokémon t'est présentée — son nom est masqué.",
      "Tu peux demander des indices supplémentaires (type, génération, statistiques…) mais chaque indice réduit ton score.",
      "Saisis le nom du Pokémon dans le champ de réponse et valide.",
      "Tu as un nombre limité de tentatives. Bonne chance !",
    ],
  },
  types: {
    title: "Règles — Quel est ce type ?",
    color: colors.brand.yellow,
    rules: [
      "Un type Pokémon est tiré au sort à chaque manche.",
      "Ses forces, faiblesses et immunités te sont révélées progressivement.",
      "Devine le type en te basant sur les indices affichés.",
      "Moins tu utilises d'indices, plus ton score est élevé.",
      "Attention, certains types peuvent sembler similaires !",
    ],
  },
  dezoom: {
    title: "Règles — Dézoom",
    color: colors.brand.red,
    rules: [
      "Un Pokémon est affiché en très gros plan — tu ne vois qu'une petite partie de son sprite.",
      "L'image se dézoom progressivement à chaque seconde.",
      "Identifie le Pokémon le plus tôt possible pour maximiser ton score.",
      "Saisis le nom du Pokémon dans le champ de réponse et valide.",
      "Plus tu devines vite, plus ton score sera élevé !",
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
  initial: (dir: string) => ({
    y: dir === "forward" ? 40 : -40,
    opacity: 0,
  }),
  animate: { y: 0, opacity: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: (dir: string) => ({
    y: dir === "backward" ? 40 : -40,
    opacity: 0,
    transition: { duration: 0.3, ease: "easeIn" as const },
  }),
};

export default function ReglesPage() {
  const { setBackground } = useBackgroundStore();
  const { direction, setDirection } = useNavDirectionStore();
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState<keyof typeof GAME_RULES | null>(null);

  useEffect(() => {
    setBackground({ colorLeft: colors.ui.bgLeft, colorStripe: colors.ui.bgStripe, colorRight: colors.ui.bgRight });
  }, []);

  const activeRules = openModal ? GAME_RULES[openModal] : null;

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
            description="Clique pour découvrir les règles de PokéDesc !"
            color={colors.brand.blue}
            image={pokedescLogo}
            to="/pokedesc"
            onClick={() => setOpenModal("pokedesc")}
          />

          <GameCard
            title="Quel est ce type ?"
            description="Clique pour découvrir les règles de Quel est ce type ? !"
            color={colors.brand.yellow}
            image={typeLogo}
            to="/types"
            onClick={() => setOpenModal("types")}
          />

          <GameCard
            title="Dézoom"
            description="Clique pour découvrir les règles de Dézoom !"
            color={colors.brand.red}
            image={dezoomLogo}
            to="/dezoom"
            onClick={() => setOpenModal("dezoom")}
          />
        </motion.div>
      </div>

      {/* Modal des règles */}
      <Dialog open={openModal !== null} onOpenChange={(open) => { if (!open) setOpenModal(null); }}>
        <DialogContent className="max-w-lg">
          {activeRules && (
            <>
              <DialogHeader>
                <DialogTitle
                  className="text-2xl font-display tracking-wide"
                  style={{ color: activeRules.color }}
                >
                  {activeRules.title}
                </DialogTitle>
                <DialogDescription asChild>
                  <ul className="mt-4 space-y-3 text-left">
                    {activeRules.rules.map((rule, i) => (
                      <li key={i} className="flex gap-3 items-start text-base text-foreground">
                        <span
                          className="mt-1 flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
                          style={{ backgroundColor: activeRules.color }}
                        >
                          {i + 1}
                        </span>
                        {rule}
                      </li>
                    ))}
                  </ul>
                </DialogDescription>
              </DialogHeader>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
