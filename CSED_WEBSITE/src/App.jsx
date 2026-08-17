import React, { useEffect } from "react";
import Navbar   from "./components/layout/Navbar/Navbar";
import Footer   from "./components/layout/Footer/Footer";
import Home     from "./components/sections/Home/Home";
import About    from "./components/sections/About/About";
import Events   from "./components/sections/Events/Events";
import Blogs    from "./components/sections/Blogs/Blogs";
import Board    from "./components/sections/Board/Board";
import GlobeScene from "./scene/GlobeScene";
import { useIntroStore } from "./store/introStore";
import "./App.css";

/**
 * App — one persistent WebGL scene + one continuous scroll experience.
 *
 * Z-index stack:
 *   0   body background  (#050505 via index.css) — Home dark backdrop
 *   0   About section white background
 *   5   GlobeScene canvas (fixed, transparent)    — drawn ABOVE backgrounds
 *   20  Section text/content (relative z-20)      — drawn ABOVE canvas
 *
 * The GlobeScene canvas is NEVER unmounted.
 */
function App() {
  const globeOpacity = useIntroStore((s) => s.globeOpacity);

  useEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, []);

  return (
    <>
      {/* ── Persistent Three.js globe canvas — fixed, z-5 ── */}
      <div style={{
        position: "fixed",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        opacity: globeOpacity,
        transition: "opacity 0.4s ease-out",
      }}>
        <GlobeScene />
      </div>

      {/* ── Scrollable HTML content ── */}
      {/* No z-index here so it doesn't create a stacking context.
          Individual sections will manage their backgrounds (z-0) and text (z-20) */}
      <div className="font-sans">
        <Navbar />
        <main>
          <Home />
          <About />
          <Events />
          <Blogs />
          <Board />
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;
