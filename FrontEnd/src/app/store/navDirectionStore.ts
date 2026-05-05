import { create } from "zustand";

type NavDirection = "forward" | "backward";

interface NavDirectionStore {
  direction: NavDirection;
  setDirection: (dir: NavDirection) => void;
}

export const useNavDirectionStore = create<NavDirectionStore>((set) => ({
  direction: "forward",
  setDirection: (dir) => set({ direction: dir }),
}));
