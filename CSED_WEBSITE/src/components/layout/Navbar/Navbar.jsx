import { useState } from "react";

function Navbar() {
  const links = ["Home", "About", "Initiatives", "Team", "Events", "Contact"];
  const [active, setActive] = useState("Home");
  const [menuOpen, setMenuOpen] = useState(false);
  const selectLink = (link) => {
    setActive(link);
    setMenuOpen(false);
  };

  return (
    <nav className="intro-nav fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-[var(--bg)]/60 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-[1900px] items-center justify-between gap-6 px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32">
        <div className="shrink-0 leading-none">
          <div className="font-[Outfit] text-4xl font-bold tracking-[0.15em] text-white select-none">
            CSE<span className="text-[var(--red)]">D</span>
          </div>
        </div>
        <div className="hidden items-center gap-7 lg:flex xl:gap-10">
          {links.map((link) => (
            <button
              key={link}
              onClick={() => selectLink(link)}
              className="relative px-1 py-1 text-xs font-medium uppercase tracking-[0.15em] transition-colors duration-300"
              style={{
                color: active === link ? "var(--red)" : "rgba(245,245,245,.75)",
              }}
            >
              {link}
              {active === link && (
                <span className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--red)]" />
              )}
            </button>
          ))}
        </div>
        <button className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--red)] px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.1em] text-white transition-all hover:bg-[var(--red)] hover:shadow-[0_0_25px_rgba(230,57,70,.4)] sm:flex">
          Join Us <span aria-hidden="true">→</span>
        </button>
        <button
          className="grid h-10 w-10 place-items-center text-white lg:hidden"
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="text-xl">{menuOpen ? "×" : "☰"}</span>
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
          <button className="mt-3 rounded-full border border-[var(--red)] px-5 py-2 text-xs uppercase tracking-[0.1em]">
            Join Us →
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
