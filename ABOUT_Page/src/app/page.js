"use client";
import { useRef, useState, useEffect } from "react";
import AboutSection from "@/components/AboutSection";

// ── Blob config: [top, left, width, height, color, anim, dur, delay, depth]
// depth: how far each blob moves relative to the mouse (parallax factor)
const BLOBS = [
  ["20%", "5%",  "520px","420px","radial-gradient(ellipse, rgba(229,9,20,0.7) 0%, transparent 70%)","blob-morph",   9,  0,   0.6 ],
  ["30%","60%",  "380px","340px","radial-gradient(ellipse, rgba(229,9,20,0.5) 0%, transparent 70%)","blob-morph-2", 7,  1.5, 1.0 ],
  ["55%","35%",  "300px","280px","radial-gradient(ellipse, rgba(180,0,10,0.55) 0%, transparent 70%)","blob-morph-3",11,  0.8, 0.4 ],
  ["5%", "70%",  "260px","240px","radial-gradient(ellipse, rgba(229,9,20,0.35) 0%, transparent 70%)","blob-morph",  13,  2,   0.8 ],
];

export default function Home() {
  const aboutWrapRef  = useRef(null);
  const topPageRef    = useRef(null);      // the black bubble container
  const blobWrapRefs  = useRef([]);        // wrapper divs for each blob (mouse parallax)

  const [animKey, setAnimKey] = useState(0);
  const isVisible = useRef(false);

  // ── About Section intersection replay ─────────────────────────────────────
  useEffect(() => {
    const el = aboutWrapRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!isVisible.current) setAnimKey((k) => k + 1);
          isVisible.current = true;
        } else {
          isVisible.current = false;
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Mouse parallax on top bubble page ─────────────────────────────────────
  useEffect(() => {
    const page = topPageRef.current;
    if (!page) return;

    let tx = 0, ty = 0;         // target from mouse
    let cx = 0, cy = 0;         // current (lerped)
    let rafId;

    const onMove = (e) => {
      const r  = page.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width  - 0.5) * 2;   // -1 → +1
      ty = ((e.clientY - r.top)  / r.height - 0.5) * 2;
    };

    const onLeave = () => { tx = 0; ty = 0; };

    const loop = () => {
      // Smooth lerp
      cx += (tx - cx) * 0.055;
      cy += (ty - cy) * 0.055;

      blobWrapRefs.current.forEach((el, i) => {
        if (!el) return;
        const depth = BLOBS[i][8];
        const dx = cx * 45 * depth;   // max ±45px × depth factor
        const dy = cy * 28 * depth;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });

      rafId = requestAnimationFrame(loop);
    };

    page.addEventListener("mousemove", onMove);
    page.addEventListener("mouseleave", onLeave);
    loop();

    return () => {
      page.removeEventListener("mousemove", onMove);
      page.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <main className="w-full bg-white">

      {/* ── Page above — bubbly black & red with mouse parallax ── */}
      <div
        ref={topPageRef}
        className="w-full min-h-screen relative overflow-hidden"
        style={{
          background: "#080808",
          borderRadius: "0 0 48% 48% / 0 0 90px 90px",
          perspective: "800px",
        }}
      >
        {BLOBS.map(([top, left, w, h, color, anim, dur, delay], i) => (
          // Outer div: mouse-driven translate (parallax)
          <div
            key={i}
            ref={(el) => (blobWrapRefs.current[i] = el)}
            style={{
              position: "absolute", top, left,
              width: w, height: h,
              willChange: "transform",
              transition: "transform 0.05s linear",
            }}
          >
            {/* Inner div: CSS blob-morph animation */}
            <div
              style={{
                width: "100%", height: "100%",
                background: color,
                filter: "blur(55px)",
                opacity: 0.75,
                animation: `${anim} ${dur}s ease-in-out ${delay}s infinite`,
                willChange: "transform, border-radius",
              }}
            />
          </div>
        ))}
      </div>

      {/* ── About Section ── */}
      <div ref={aboutWrapRef}>
        <AboutSection key={animKey} />
      </div>

      {/* ── Page below — flat black & red ── */}
      <div
        className="w-full min-h-screen"
        style={{
          background:
            "radial-gradient(ellipse at 70% 60%, rgba(229,9,20,0.5) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(229,9,20,0.3) 0%, transparent 50%), #0a0a0a",
        }}
      />

    </main>
  );
}
