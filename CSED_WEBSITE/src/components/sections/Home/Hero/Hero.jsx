import { useEffect, useRef } from 'react';

export default function Hero() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const width = canvas.clientWidth, height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      for (let i = 0; i < (width < 768 ? 160 : 520); i++) {
        const rand = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
        const x = rand(i + 1) * width;
        const y = (0.32 + rand(i + 701) * 0.68) * height;
        const alpha = (0.1 + rand(i + 1201) * 0.4) * (y / height);
        ctx.fillStyle = i % 3 ? `rgba(219,224,232,${alpha})` : `rgba(211,20,41,${alpha})`;
        ctx.fillRect(x, y, i % 11 ? 0.8 : 1.3, i % 11 ? 0.8 : 1.3);
      }
    };
    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="cinematic-hero" aria-labelledby="hero-title">
      <canvas ref={canvasRef} className="hero-dust" aria-hidden="true" />
      <div className="hero-copy">
        <p className="hero-kicker"><span className="sr-only">CSED ? </span>Center for Social</p>
        <h1 id="hero-title" className="hero-title">
          <span>Entrepreneurship</span>
          <span><em>&</em> Development</span>
        </h1>
        <p className="hero-tagline">Building Bridges to a Better World Through<br className="hidden sm:block" /> Social Entrepreneurship</p>
        <div className="hero-actions">
          <a href="#about" className="hero-action hero-action-primary">Explore more</a>
          <a href="#events" className="hero-action">Our initiatives</a>
        </div>
      </div>
    </section>
  );
}
