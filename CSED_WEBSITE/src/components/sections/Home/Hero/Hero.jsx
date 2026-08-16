import { useEffect, useRef } from "react";

function Hero() {
  const canvasRef = useRef(null);

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
        // Fade in on load
        if (star.fadeIn) {
          star.alpha = Math.min(star.alpha + star.fadeSpeed, star.targetAlpha);
          if (star.alpha >= star.targetAlpha) star.fadeIn = false;
        }

        // Twinkle
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

    window.addEventListener("resize", () => {
      resize();
      createStars();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const redShadow =
    "0 0 8px rgba(230,57,70,0.9), 0 0 20px rgba(230,57,70,0.5), 2px 2px 6px rgba(180,20,30,0.8)";

  const whiteShadow =
    "0 0 8px rgba(255,255,255,0.95), 0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.3), 2px 2px 6px rgba(200,200,200,0.7)";

  return (
    <section className="relative flex h-screen -translate-y-24 flex-col items-center justify-center px-6 text-center md:-translate-y-32">
      {/* Stars canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0"
        style={{ mixBlendMode: "screen" }}
      />

      <div className="intro-heading relative z-10">
        {/* Uniform title — all same size ~20px, white, red shadow */}
        <p
          className="font-[Outfit] uppercase tracking-[0.55em] text-white"
          style={{
            fontSize: "55px",
            fontWeight: 900,
            lineHeight: 1.8,
            letterSpacing: "0.55em",
            textShadow: redShadow,
          }}
        >
          Center for
        </p>
        <p
          className="font-[Outfit] uppercase text-white"
          style={{
            fontSize: "55px",
            fontWeight: 900,
            letterSpacing: "0.42em",
            textShadow: redShadow,
            lineHeight: 1.8,
          }}
        >
          Social Entrepreneurship
        </p>
        <p
          className="font-[Outfit] uppercase text-white"
          style={{
            fontSize: "55px",
            fontWeight: 900,
            letterSpacing: "0.42em",
            textShadow: redShadow,
            lineHeight: 1.8,
          }}
        >
          <span style={{ color: "var(--red)", textShadow: whiteShadow }}>
            &
          </span>{" "}
          Development
        </p>

        {/* Tagline */}
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-white/55 md:text-lg">
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
