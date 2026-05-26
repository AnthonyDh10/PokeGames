import { create } from 'zustand'

/** Représente un message reçu ou envoyé dans le chat de partie. */
export interface ChatMessage {
  senderName: string
  text: string
  timestamp: string
  /** `true` si le message a été envoyé par le joueur local. */
  isOwn?: boolean
}

/** Contexte de session fourni par la page active, utilisé par le panneau de chat. */
interface ChatContext {
  partieId: string
  sessionCode: string
  isSolo: boolean
}

interface ChatStore {
  // --- Contexte de partie (défini par les pages) ---
  partieId: string
  sessionCode: string
  /** `true` si le joueur est seul (pas de multijoueur), désactive le bouton chat). */
  isSolo: boolean

  // --- État d'interface ---
  /** `true` si le panneau de chat est ouvert. */
  isOpen: boolean
  /** Historique des messages reçus, plafonné à 100 entrées. */
  messages: ChatMessage[]

  // --- Actions ---
  /** Définit le contexte de la partie courante. Efface l'historique si la partie change. */
  setContext: (ctx: ChatContext) => void
  /** Réinitialise entièrement le store (déconnexion, changement de route majeur). */
  clearContext: () => void
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  /** Ajoute un message à l'historique (max 100 messages conservés). */
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void
}

/**
 * Store Zustand du chat en temps réel.
 *
 * Alimenté par `chatService` (SignalR) et par les pages de jeu (`setChatContext`).
 * Les messages sont conservés en mémoire uniquement (pas de persistance localStorage) :
 * l'historique est perdu à chaque rechargement de page.
 */
export const useChatStore = create<ChatStore>((set) => ({
  partieId: '',
  sessionCode: '',
  isSolo: true,
  isOpen: false,
  messages: [],

  setContext: (ctx) =>
    set((state) => {
      // If partieId changed, clear message history
      const shouldClear = ctx.partieId !== state.partieId
      return {
        ...ctx,
        messages: shouldClear ? [] : state.messages,
      }
    }),

  clearContext: () =>
    set({ partieId: '', sessionCode: '', isSolo: true, isOpen: false, messages: [] }),

  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setOpen: (open) => set({ isOpen: open }),

  addMessage: (msg) =>
    set((state) => ({
      messages: [...state.messages, msg].slice(-100),
    })),

  clearMessages: () => set({ messages: [] }),
}))
