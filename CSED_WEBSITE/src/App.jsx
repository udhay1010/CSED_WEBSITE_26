import { useLayoutEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
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

  useLayoutEffect(() => {
    const navigation = performance.getEntriesByType('navigation')[0]?.type;
    const documentRoot = document.documentElement;
    if (documentRoot.dataset.reloadTop !== 'pending') {
      // React creates section targets after the browser's initial fragment lookup.
      if (navigation === 'navigate' && location.hash) {
        let id;
        try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
        document.getElementById(id)?.scrollIntoView({ behavior: 'instant' });
      }
      return;
    }
    const controller = new AbortController();
    const reset = () => {
      if (controller.signal.aborted) return;
      ScrollTrigger.clearScrollMemory('manual');
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    const release = () => {
      documentRoot.removeAttribute('data-reload-top');
      documentRoot.style.removeProperty('scroll-behavior');
      documentRoot.style.removeProperty('overflow-anchor');
      ScrollTrigger.clearScrollMemory('auto');
      controller.abort();
    };
    const onIntent = (event) => {
      if (!event.isTrusted) return;
      if (event.type === 'keydown' && !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Enter', 'Tab'].includes(event.key)) return;
      release();
    };
    for (const type of ['wheel', 'touchmove', 'pointerdown', 'keydown']) {
      window.addEventListener(type, onIntent, { capture: true, passive: true, signal: controller.signal });
    }
    window.addEventListener('pagehide', release, { once: true, signal: controller.signal });
    window.addEventListener('popstate', release, { once: true, signal: controller.signal });
    window.addEventListener('hashchange', release, { once: true, signal: controller.signal });
    // Verify once after load/fonts, but never reset after the user has taken control.
    const verify = () => document.fonts.ready.then(reset);
    if (document.readyState === 'complete') verify();
    else window.addEventListener('load', verify, { once: true, signal: controller.signal });
    reset();
    return () => controller.abort();
  }, []);

  return (
    <>
      {/* ── Persistent Three.js globe canvas — fixed, z-5 ── */}
      <div aria-hidden="true" data-globe-stage style={{
        position: "fixed",
        inset: 0,
        zIndex: 5,
        pointerEvents: "none",
        opacity: globeOpacity,
        overflow: "clip",
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
