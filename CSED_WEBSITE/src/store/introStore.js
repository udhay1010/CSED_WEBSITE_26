import { create } from "zustand";

export const useIntroStore = create((set) => ({
  phase: "SPAWN",
  heroOpacity: 0,
  introComplete: false,

  setPhase: (phase) => set({ phase }),
  setHeroOpacity: (heroOpacity) => set({ heroOpacity }),
  setIntroComplete: () => set({ introComplete: true }),
}));
