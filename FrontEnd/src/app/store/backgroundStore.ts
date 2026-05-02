import { create } from 'zustand'

interface BackgroundStore {
  colorLeft: string
  colorStripe: string
  colorRight: string
  setBackground: (colors: Partial<{ colorLeft: string; colorStripe: string; colorRight: string }>) => void
}

export const useBackgroundStore = create<BackgroundStore>((set) => ({
  colorLeft: '#ffffff',
  colorStripe: '#A6ACAF',
  colorRight: '#BDC3C7',
  setBackground: (colors) => set((state) => ({ ...state, ...colors })),
}))
