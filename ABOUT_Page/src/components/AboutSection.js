"use client";
import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import SplitType from "split-type";
import KineticTitle from "./KineticTitle";

const SEARCH_QUERY = "CSED VIT VELLORE";
const WELCOME_MESSAGE =
  "WELCOME TO CSED, VIT'S PIONEERING SOCIAL ENTREPRENEURSHIP CLUB. SINCE 2010, WE'VE HOSTED IMPACTFUL EVENTS AND A VIBRANT COMMUNITY. EXPLORE OPPORTUNITIES TO INNOVATE AND DRIVE POSITIVE CHANGE WITH US!";

export default function AboutSection() {
  const containerRef    = useRef(null);
  const rayCanvasRef    = useRef(null);
  const taglineRef      = useRef(null);
  const starRef         = useRef(null);
  const searchWrapperRef = useRef(null);
  const cursorRef        = useRef(null);
  const loadingBarRef    = useRef(null);
  const inputAreaRef     = useRef(null);
  const welcomeBlockRef  = useRef(null);
  const welcomeTextRef   = useRef(null);
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase]         = useState("idle");

  // Star spin on mouse drag
  useEffect(() => {
    const section = containerRef.current;
    const star    = starRef.current;
    if (!section || !star) return;
    let lastX = 0, lastY = 0, spinSpeed = 0, totalRotation = 0, rafId;
    const onMove = (e) => {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      spinSpeed = Math.min(spinSpeed + Math.sqrt(dx*dx+dy*dy)*0.8, 28);
    };
    const loop = () => {
      spinSpeed *= 0.92;
      totalRotation += spinSpeed;
      gsap.set(star, { rotation: totalRotation });
      rafId = requestAnimationFrame(loop);
    };
    section.addEventListener("mousemove", onMove);
    loop();
    return () => { section.removeEventListener("mousemove", onMove); cancelAnimationFrame(rafId); };
  }, []);

  // Tagline animation
  useEffect(() => {
    const tEl = taglineRef.current, sEl = starRef.current;
    if (!tEl) return;
    gsap.set(tEl, { opacity: 0 });
    gsap.set(sEl, { opacity: 0, scale: 0, rotation: -180 });
    const split = new SplitType(tEl, { types: "words" });
    gsap.set(split.words, { y: 60, opacity: 0, rotateX: -90, transformOrigin: "50% 100%" });
    gsap.set(tEl, { opacity: 1 });
    const tl = gsap.timeline({ delay: 5.2 });
    tl.to(split.words, { y: 0, opacity: 1, rotateX: 0, duration: 1, ease: "back.out(2)", stagger: { each: 0.12 } });
    tl.to(sEl, { opacity: 1, scale: 1, rotation: 0, duration: 0.8, ease: "back.out(3)" }, "-=0.4");
    tl.to(sEl, { filter: "drop-shadow(0 0 16px rgba(229,9,20,0.9))", duration: 0.5, yoyo: true, repeat: 3, ease: "sine.inOut" });
    tl.call(() => setPhase("search-enter"), [], "-=0.5");
    return () => { tl.kill(); split.revert(); };
  }, []);

  // Search bar entrance
  useEffect(() => {
    if (phase !== "search-enter") return;
    const w = searchWrapperRef.current;
    if (!w) return;
    gsap.set(w, { opacity: 0, y: 40, scale: 0.92 });
    const tl = gsap.timeline();
    tl.to(w, { opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "back.out(1.4)" });
    tl.call(() => setPhase("ray-typing"), [], "+=0.4");
    return () => tl.kill();
  }, [phase]);

  // RAY TYPING — small comets write each letter
  useEffect(() => {
    if (phase !== "ray-typing") return;
    const rayCanvas = rayCanvasRef.current;
    const section   = containerRef.current;
    const inputArea = inputAreaRef.current;
    const wrapper   = searchWrapperRef.current;
    if (!rayCanvas || !section || !inputArea || !wrapper) return;

    const sRect = section.getBoundingClientRect();
    const dpr   = window.devicePixelRatio || 1;
    rayCanvas.width  = sRect.width  * dpr;
    rayCanvas.height = sRect.height * dpr;
    const ctx = rayCanvas.getContext("2d");
    ctx.scale(dpr, dpr);
    rayCanvas.style.width  = sRect.width  + "px";
    rayCanvas.style.height = sRect.height + "px";
    gsap.set(rayCanvas, { opacity: 1 });

    const wRect  = wrapper.getBoundingClientRect();
    const sx     = wRect.left - sRect.left + 30;
    const sy     = wRect.top  - sRect.top  + wRect.height / 2;
    const iRect  = inputArea.getBoundingClientRect();
    const inputX = iRect.left - sRect.left + 8;
    const inputY = iRect.top  - sRect.top  + iRect.height / 2;
    const charW  = 10;

    const rays = [];
    let charIdx = 0, currentText = "", animId, finished = false;

    const scheduleRay = () => {
      if (charIdx >= SEARCH_QUERY.length) return;
      const char  = SEARCH_QUERY[charIdx];
      const destX = inputX + charIdx * charW;
      const ctrlX = sx + (destX - sx) * 0.4 + (Math.random() - 0.5) * 180;
      const ctrlY = sy - 80 - Math.random() * 120;
      rays.push({ t: 0, sx, sy, cx: ctrlX, cy: ctrlY, ex: destX, ey: inputY, char, done: false, trail: [] });
      charIdx++;
    };

    scheduleRay();
    const spawn = setInterval(() => { if (charIdx < SEARCH_QUERY.length) scheduleRay(); else clearInterval(spawn); }, 45);

    const drawSmallRay = (ray) => {
      if (ray.t <= 0) return;
      const bx = t => (1-t)*(1-t)*ray.sx + 2*(1-t)*t*ray.cx + t*t*ray.ex;
      const by = t => (1-t)*(1-t)*ray.sy + 2*(1-t)*t*ray.cy + t*t*ray.ey;
      const hx = bx(ray.t), hy = by(ray.t);
      ray.trail.push({ x: hx, y: hy });
      if (ray.trail.length > 22) ray.trail.shift();
      for (let i = 1; i < ray.trail.length; i++) {
        const a = i / ray.trail.length;
        ctx.beginPath();
        ctx.moveTo(ray.trail[i-1].x, ray.trail[i-1].y);
        ctx.lineTo(ray.trail[i].x,   ray.trail[i].y);
        ctx.strokeStyle = `rgba(229,${Math.floor(9+a*100)},20,${a*0.9})`;
        ctx.lineWidth   = a * 6; ctx.lineCap = "round";
        ctx.shadowBlur  = 22 * a; ctx.shadowColor = `rgba(229,9,20,${a})`;
        ctx.stroke();
      }
      ctx.shadowBlur = 45; ctx.shadowColor = "#ff4422";
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 15);
      g.addColorStop(0, "rgba(255,220,100,1)");
      g.addColorStop(0.3, "rgba(229,9,20,0.9)");
      g.addColorStop(1, "rgba(229,9,20,0)");
      ctx.beginPath(); ctx.arc(hx, hy, 15, 0, Math.PI*2);
      ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
    };

    const animate = () => {
      ctx.clearRect(0, 0, sRect.width, sRect.height);
      let allDone = true;
      rays.forEach(ray => {
        if (ray.done) return;
        allDone = false;
        ray.t += 0.09;
        if (ray.t >= 1) { ray.t = 1; ray.done = true; currentText += ray.char; setTypedText(currentText); }
        drawSmallRay(ray);
      });
      if (!finished) animId = requestAnimationFrame(animate);
      if (allDone && rays.length === SEARCH_QUERY.length) {
        finished = true;
        cancelAnimationFrame(animId);
        gsap.to(rayCanvas, { opacity: 0, duration: 0.2, ease: "power2.out",
          onComplete: () => { ctx.clearRect(0, 0, sRect.width, sRect.height); setTimeout(() => setPhase("searching"), 100); } });
      }
    };
    animate();
    return () => { clearInterval(spawn); cancelAnimationFrame(animId); };
  }, [phase]);

  // SEARCHING — cinematic paragraph reveal
  useEffect(() => {
    if (phase !== "searching") return;
    const cursor       = cursorRef.current;
    const loadingBar   = loadingBarRef.current;
    const searchBar    = searchWrapperRef.current;
    const welcomeBlock = welcomeBlockRef.current;
    const welcomeText  = welcomeTextRef.current;
    const rayCanvas    = rayCanvasRef.current;
    const section      = containerRef.current;
    if (!loadingBar || !searchBar || !welcomeBlock || !welcomeText || !rayCanvas || !section) return;

    const words = WELCOME_MESSAGE.split(" ");
    welcomeText.innerHTML = words.map(w => `<span class="welcome-word">${w}</span>`).join(" ");

    const tl = gsap.timeline();
    if (cursor) tl.to(cursor, { opacity: 0, duration: 0.2 }, 0);
    tl.fromTo(loadingBar, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.5, ease: "power2.inOut" }, 0);

    const sbRectSnap = searchBar.getBoundingClientRect();
    const sRectSnap  = section.getBoundingClientRect();
    const originX = sbRectSnap.left - sRectSnap.left + sbRectSnap.width / 2;
    const originY = sbRectSnap.top  - sRectSnap.top  + sbRectSnap.height / 2;
    const inputArea = inputAreaRef.current;

    tl.to(searchBar, { boxShadow: "0 0 0 2px rgba(229,9,20,0.8), 0 0 50px rgba(229,9,20,0.5)", duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0);
    tl.to(loadingBar, { opacity: 0, duration: 0.15 });

    if (inputArea) {
      tl.to(inputArea, { textShadow: "0 0 20px rgba(255,160,20,1), 0 0 50px rgba(229,9,20,0.95)", color: "#ffaa44", scale: 1.06, duration: 0.15, ease: "power2.in" }, "+=0.02");
      tl.to(inputArea, { letterSpacing: "-0.05em", scale: 0.08, filter: "blur(8px)", opacity: 0, textShadow: "0 0 60px rgba(255,140,20,1)", duration: 0.2, ease: "power3.in" });
    }

    tl.to(searchBar, { opacity: 0, duration: 0.35, ease: "power2.in" }, "<0.15");
    tl.call(() => { searchBar.style.display = "none"; });

    tl.call(() => {
      welcomeBlock.style.display = "block";
      const wordEls = welcomeText.querySelectorAll(".welcome-word");
      gsap.set(wordEls, { opacity: 0 });
      setTimeout(() => {
        runCinematicReveal(wordEls, section, rayCanvas, originX, originY, () => {
          gsap.to(welcomeText, { scale: 1.008, duration: 3.5, yoyo: true, repeat: -1, ease: "sine.inOut" });
        });
      }, 20);
    });

    return () => tl.kill();
  }, [phase]);

  // Cinematic gold line-by-line reveal
  function runCinematicReveal(wordEls, section, rayCanvas, originX, originY, onDone) {
    gsap.set(rayCanvas, { opacity: 0 });

    // STEP 1: Measure natural line positions BEFORE applying any transforms
    const lineMap = new Map();
    wordEls.forEach(el => {
      const r   = el.getBoundingClientRect();
      const top = Math.round(r.top);
      const key = [...lineMap.keys()].find(k => Math.abs(k - top) < 10);
      if (key !== undefined) lineMap.get(key).push(el);
      else lineMap.set(top, [el]);
    });
    const lines = [...lineMap.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, els]) => els);

    // STEP 2: Now hide words and apply start state
    gsap.set(wordEls, { opacity: 0, y: 18, filter: "blur(6px)" });

    // Subtle zoom-in on the whole block
    const block = welcomeBlockRef.current;
    if (block) {
      gsap.fromTo(block,
        { scale: 0.965 },
        { scale: 1, duration: lines.length * 0.28 + 1.8, ease: "power2.out" }
      );
    }

    const tl = gsap.timeline({ onComplete: onDone });
    lines.forEach((lineWords, i) => {
      const t = i * 0.12;   // faster stagger between lines

      tl.to(lineWords, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.4,
        ease: "power3.out",
        stagger: 0,
      }, t);

      tl.fromTo(lineWords,
        { textShadow: "0 0 25px rgba(200,16,46,0.9), 0 0 50px rgba(200,16,46,0.4)" },
        { textShadow: "0 0 0px rgba(200,16,46,0)", duration: 0.8, ease: "power2.out" },
        t + 0.05
      );
    });
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full min-h-screen bg-white text-black flex overflow-hidden"
    >
      <canvas ref={rayCanvasRef} className="absolute top-0 left-0 pointer-events-none z-30" style={{ opacity: 1 }} />

      {/* Title centered on full page width */}
      <div className="absolute top-[6vh] left-0 w-full flex justify-center z-50 pointer-events-none">
        <KineticTitle />
      </div>

      <div className="w-[35%] h-full hidden md:block z-20 pointer-events-none" />

      <div className="w-full md:w-[65%] h-full flex flex-col justify-start pt-[calc(12vh+7rem)] px-10 relative z-40 pointer-events-none">

        <div className="flex items-center gap-3 text-3xl font-semibold tracking-wide text-black mb-8">
          <span ref={taglineRef} className="anim-tagline">Our Social Entrepreneurship Journey</span>
          <span ref={starRef} className="text-[#E50914] text-5xl inline-block origin-center filter drop-shadow-[0_0_8px_rgba(229,9,20,0.5)]">✦</span>
        </div>

        <div ref={searchWrapperRef} className="gsearch-neon-wrapper" style={{ opacity: 0 }}>
          <div className="gsearch-bar">
            <div className="gsearch-icon-left">
              <svg focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="rgba(255,255,255,0.6)" />
              </svg>
            </div>
            <div ref={inputAreaRef} className="gsearch-input-area">
              <span className="gsearch-typed">{typedText}</span>
              <span ref={cursorRef} className="gsearch-cursor" />
            </div>
            <div className="gsearch-icons-right">
              <div className="gsearch-mic">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#E50914" d="M12 15c1.66 0 2.99-1.34 2.99-3L15 6c0-1.66-1.34-3-3-3S9 4.34 9 6v6c0 1.66 1.34 3 3 3z"/>
                  <path fill="rgba(255,255,255,0.7)" d="M11 18.92h2V22h-2z"/>
                  <path fill="rgba(255,255,255,0.5)" d="M7 12H5c0 2.76 2.24 5 5 5v-2c-1.66 0-3-1.34-3-3z"/>
                  <path fill="#E50914" d="M19 12h-2c0 1.66-1.34 3-3 3v2c2.76 0 5-2.24 5-5z"/>
                </svg>
              </div>
              <button className="gsearch-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="#FFFFFF" />
                </svg>
              </button>
            </div>
            <div ref={loadingBarRef} className="gsearch-loading" style={{ opacity: 0 }} />
          </div>
        </div>

        <div ref={welcomeBlockRef} className="welcome-inline-block" style={{ display: "none" }}>
          <div ref={welcomeTextRef} className="welcome-inline-text" />
        </div>
      </div>

      <div className="absolute right-0 bottom-0 h-[92vh] w-[45vw] flex items-end justify-end z-0 pointer-events-none">
        <Image src="/hero-portrait-csed.png" alt="CSED Hero Portrait" fill className="object-contain object-right-bottom opacity-90" />
      </div>
    </section>
  );
}
