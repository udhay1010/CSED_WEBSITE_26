import { create } from "zustand";

export const useIntroStore = create((set) => ({
  phase:          "SPAWN",
  heroOpacity:    0,           // 0..1 — fades in after intro animation
  introComplete:  false,
  scrollProgress: 0,           // 0 = home, 1 = about fully in view

  setPhase:          (phase)          => set({ phase }),
  setHeroOpacity:    (heroOpacity)    => set({ heroOpacity }),
  setIntroComplete:  ()               => set({ introComplete: true }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
}));
