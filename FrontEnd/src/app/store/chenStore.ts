import { create } from 'zustand'

export interface ChenMessage {
  text: string
  timestamp: string
  proximityResult?: {
    hasOneTypeInCommon?: boolean
    hasPerfectTypeMatch?: boolean
    hasSameGeneration?: boolean
    isInSameEvolutionChain?: boolean
  }
  partialMatchTypeFr?: string
}

interface ChenStore {
  isOpen: boolean
  messages: ChenMessage[]
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  addMessage: (msg: ChenMessage) => void
  clearMessages: () => void
}

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
