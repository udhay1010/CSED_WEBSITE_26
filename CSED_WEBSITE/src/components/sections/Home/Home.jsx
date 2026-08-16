import React from "react";
import Hero from "./Hero/Hero";
import { useScrollProgress } from "../../../hooks/useScrollProgress";

/**
 * Home section.
 *
 * Transparent background — the dark body (#050505) and the persistent
 * GlobeScene canvas (fixed, z-2) are both visible behind this section.
 *
 * Mounts useScrollProgress so the Zustand store is always up-to-date.
 */
const Home = () => {
  useScrollProgress();

  return (
    <section
      id="home"
      style={{ background: "transparent", position: "relative", zIndex: 10 }}
    >
      <Hero />
    </section>
  );
};

export default Home;
