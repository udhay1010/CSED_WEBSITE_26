import { useEffect, useRef, useState } from "react";
import { useNavbarForeground } from '../../../hooks/useNavbarForeground';
import './Navbar.css';

const destinations = { Home: 'home', About: 'about', Events: 'events', Blog: 'blogs', Board: 'board', Contact: 'site-footer' };

function Navbar() {
  const links = ["Home", "About", "Events", "Blog", "Board", "Contact"];
  const [active, setActive] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const row = useRef(null);
  useNavbarForeground(row);

  useEffect(() => {
    const updateActiveSection = () => {
      const readingLine = Math.min(window.innerHeight * 0.4, 300);
      let nextActive = 'Home';
      for (const [label, id] of Object.entries(destinations)) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= readingLine) nextActive = label;
      }

      setActive((current) => (current === nextActive ? current : nextActive));
    };

    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("resize", updateActiveSection);
    updateActiveSection();

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const selectLink = (link) => {
    const section = document.getElementById(destinations[link]);
    if (section) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: window.scrollY + section.getBoundingClientRect().top - 80, behavior: reduced ? 'instant' : 'smooth' });
    }

    setActive(link);
    setMenuOpen(false);
  };

  return (
    <nav aria-label="Main navigation" className="intro-nav fixed top-0 right-0 left-0 z-[60]">
      <div ref={row} className="mx-auto flex h-20 max-w-[var(--breakpoint-4xl,1920px)] items-center justify-between gap-6 px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 3xl:px-32 4xl:px-40">
        <div className="shrink-0 leading-none">
          <div className="font-[Outfit] text-2xl sm:text-3xl md:text-4xl font-bold tracking-[0.15em] text-white select-none">
            <span className="nav-ink">CSE</span><span className="text-[var(--red)]">D</span>
          </div>
        </div>
        <div className="hidden items-center gap-7 lg:flex xl:gap-10">
          {links.map((link) => (
            <button
              key={link}
              onClick={() => selectLink(link)}
              className="nav-link relative px-1 py-1 text-xs font-medium uppercase tracking-[0.15em]"
              aria-current={active === link ? 'location' : undefined}
            >
              <span className="nav-ink">{link}</span>
              {active === link && (
                <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--red)]" />
              )}
            </button>
          ))}
        </div>
        <button onClick={() => selectLink("Contact")} className="nav-join hidden shrink-0 items-center gap-2 rounded-full border border-[var(--red)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-[background-color,box-shadow] hover:bg-[var(--red)] hover:shadow-[0_0_25px_rgba(230,57,70,.4)] sm:flex">
          <span className="nav-ink">Join Us</span> <span className="nav-ink" aria-hidden="true">→</span>
        </button>
        <button
          className="grid h-10 w-10 place-items-center text-white lg:hidden"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="nav-ink text-xl" aria-hidden="true">{menuOpen ? "×" : "☰"}</span>
        </button>
      </div>
      {menuOpen && (
        <div className="border-t border-white/5 bg-[var(--bg-secondary)] px-6 py-5 lg:hidden">
          {links.map((link) => (
            <button
              key={link}
              onClick={() => selectLink(link)}
              className="block w-full py-3 text-left text-xs uppercase tracking-[0.16em]"
              style={{ color: active === link ? "var(--red)" : "var(--white)" }}
            >
              {link}
            </button>
          ))}
          <button onClick={() => selectLink("Contact")} className="mt-3 rounded-full border border-[var(--red)] px-5 py-2 text-xs uppercase tracking-[0.1em]">
            Join Us →
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
