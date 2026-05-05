import { create } from 'zustand'

export interface ChatMessage {
  senderName: string
  text: string
  timestamp: string
  isOwn?: boolean
}

interface ChatContext {
  partieId: string
  sessionCode: string
  isSolo: boolean
}

interface ChatStore {
  // Context set by pages
  partieId: string
  sessionCode: string
  isSolo: boolean

  // UI state
  isOpen: boolean
  messages: ChatMessage[]

  // Actions
  setContext: (ctx: ChatContext) => void
  clearContext: () => void
  toggleOpen: () => void
  setOpen: (open: boolean) => void
  addMessage: (msg: ChatMessage) => void
  clearMessages: () => void
}

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
