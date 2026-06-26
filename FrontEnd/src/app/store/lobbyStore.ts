import { create } from 'zustand'
import type { PartieDto, PlayerDto } from '../types/partie'

interface LobbyStore {
  partie: PartieDto | null
  players: PlayerDto[]
  myId: string
  me: PlayerDto | undefined
  isHost: boolean
  hostId: string
  setPartie: (partie: PartieDto, myId: string) => void
  setMyId: (id: string) => void
  reset: () => void
}

export const useLobbyStore = create<LobbyStore>((set) => ({
  partie: null,
  players: [],
  myId: '',
  me: undefined,
  isHost: false,
  hostId: '',

  setPartie: (partie, myId) => {
    const players = partie.players ?? []
    set({
      partie,
      players,
      myId,
      me: players.find((p) => p.dresseurId === myId),
      isHost: partie.hostId === myId,
      hostId: partie.hostId,
    })
  },

  setMyId: (id) => set({ myId: id }),

  reset: () =>
    set({
      partie: null,
      players: [],
      myId: '',
      me: undefined,
      isHost: false,
      hostId: '',
    }),
}))
