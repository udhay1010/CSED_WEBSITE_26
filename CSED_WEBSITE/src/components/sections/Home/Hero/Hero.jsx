import { useEffect, useRef } from "react";
import { useIntroStore } from "../../../../store/introStore";

/**
 * Hero
 *
 * The visible Home content.
 *
 * Animation-gated: opacity is driven by the `heroOpacity` value in the
 * Zustand store.  ParticleSystem writes this value once the intro
 * particle animation has completed (after TIMING.HERO_FADE = 4.0 s),
 * so the text only becomes visible after the globe has fully formed.
 *
 * The canvas background is transparent — the dark body background and
 * the Three.js canvas (z-2) are visible behind this section.
 */
function Hero() {
  const canvasRef = useRef(null);
  const heroOpacity = useIntroStore((s) => s.heroOpacity);

  // ── Stars canvas (subtle ambient stars behind the text) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let stars = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createStars = () => {
      stars = Array.from({ length: 280 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.4 + 0.3,
        alpha: 0,
        targetAlpha: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.012 + 0.004,
        twinkleDir: 1,
        fadeIn: true,
        fadeSpeed: Math.random() * 0.008 + 0.003,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        if (star.fadeIn) {
          star.alpha = Math.min(star.alpha + star.fadeSpeed, star.targetAlpha);
          if (star.alpha >= star.targetAlpha) star.fadeIn = false;
        }

        star.alpha += star.twinkleSpeed * star.twinkleDir;
        if (star.alpha >= star.targetAlpha) {
          star.alpha = star.targetAlpha;
          star.twinkleDir = -1;
        } else if (star.alpha <= star.targetAlpha * 0.25) {
          star.twinkleDir = 1;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.shadowColor = "rgba(200, 200, 255, 0.6)";
        ctx.shadowBlur = 4;
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    };

    resize();
    createStars();
    draw();

    const onResize = () => {
      resize();
      createStars();
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const redShadow =
    "0 0 8px rgba(230,57,70,0.9), 0 0 20px rgba(230,57,70,0.5), 2px 2px 6px rgba(180,20,30,0.8)";

  const whiteShadow =
    "0 0 8px rgba(255,255,255,0.95), 0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.3), 2px 2px 6px rgba(200,200,200,0.7)";

  return (
    <section
      className="relative flex h-screen flex-col items-center justify-center px-6 text-center -translate-y-24 md:-translate-y-32"
      style={{ background: "transparent" }}
    >
      {/* Subtle ambient stars — rendered behind hero text */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
        style={{ mixBlendMode: "screen", opacity: heroOpacity }}
      />

      {/* Hero text — fades in only after intro animation completes */}
      <div
        className="intro-heading relative z-10 flex flex-col items-center gap-3"
        style={{ opacity: heroOpacity, transition: "opacity 0.3s ease" }}
      >
        {/* H1 — short-form, dominant headline */}
        <h1
          className="font-[Outfit] uppercase text-white m-0"
          style={{
            fontSize: "clamp(108px, 16.5vw, 195px)",
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: "0.38em",
            textShadow: redShadow,
          }}
        >
          CSED
        </h1>

        {/* H2 — full name, styled subheading */}
        <h2
          className="font-[Outfit] uppercase text-white/75 m-0"
          style={{
            fontSize: "clamp(22px, 1.58vw, 30px)",
            fontWeight: 600,
            letterSpacing: "0.5em",
            textShadow: "0 0 14px rgba(230,57,70,0.5)",
          }}
        >
          Center for Social Entrepreneurship
          <span style={{ color: "var(--red)", margin: "0 0.45em" }}>&</span>
          Development
        </h2>

        {/* Paragraph — tagline body text */}
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-white/45 md:text-base">
          Building Bridges to a Better World Through{" "}
          <span
            style={{
              background:
                "linear-gradient(264deg, rgb(255, 140, 34) -44.99%, rgb(255, 237, 172) 155.84%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Social Entrepreneurship
          </span>
        </p>
      </div>
    </section>
  );
}

export default Hero;
