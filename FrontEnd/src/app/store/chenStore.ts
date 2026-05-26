import { create } from 'zustand'

/**
 * Message affiché par le Prof. Chen dans son panneau de conseils.
 * Peut contenir des indicateurs de proximité pour guider le joueur après une tentative ratée.
 */
export interface ChenMessage {
  text: string
  timestamp: string
  /** Indicateurs de proximité entre la proposition et la bonne réponse. */
  proximityResult?: {
    hasOneTypeInCommon?: boolean
    hasPerfectTypeMatch?: boolean
    hasSameGeneration?: boolean
    isInSameEvolutionChain?: boolean
  }
  /** Nom du type en commun avec la bonne réponse (si pertinent). */
  partialMatchTypeFr?: string
}

interface ChenStore {
  /** `true` si le panneau du Prof. Chen est ouvert. */
  isOpen: boolean
  /** Historique des messages du Prof. Chen, plafonné à 50 entrées. */
  messages: ChenMessage[]
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  /** Ajoute un message dans le panneau (max 50 messages conservés). */
  addMessage: (msg: ChenMessage) => void
  /** Efface tous les messages et ferme le panneau (appelé à chaque changement de route). */
  clearMessages: () => void
}

/**
 * Store Zustand du panneau de conseils du Prof. Chen.
 *
 * Les messages sont générés localement par les hooks de jeu après chaque tentative ratée.
 * L'historique est plafonné à 50 messages et effacé automatiquement à chaque changement de route
 * (via `useNavigationBehavior`).
 */
export const useChenStore = create<ChenStore>((set) => ({
  isOpen: false,
  messages: [],

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg].slice(-50),
    })),

  clearMessages: () => set({ messages: [], isOpen: false }),
}))
