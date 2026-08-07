"use client";
import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function KineticTitle() {
  const containerRef = useRef(null);
  const aboutTopRef = useRef(null);
  const aboutBottomRef = useRef(null);
  const aboutInnerRef = useRef(null);
  const csedRef = useRef(null);
  const maskRef = useRef(null);

  useGSAP(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        aboutTopRef.current.classList.add("neon-flicker-red");
        aboutBottomRef.current.classList.add("neon-flicker-red");
        csedRef.current.classList.add("neon-flicker-black");

        setTimeout(() => {
          if (aboutTopRef.current) aboutTopRef.current.classList.remove("neon-flicker-red");
          if (aboutBottomRef.current) aboutBottomRef.current.classList.remove("neon-flicker-red");
          if (csedRef.current) csedRef.current.classList.remove("neon-flicker-black");
        }, 6000);
      }
    });

    // Initial States
    gsap.set(aboutTopRef.current, { y: 0 });
    gsap.set(aboutBottomRef.current, { y: 0 });
    gsap.set(aboutInnerRef.current, { scaleY: 0, opacity: 0 });
    gsap.set(csedRef.current, { xPercent: -100 });

    const gapHeight = 70;

    // 1. "ABOUT" Splits Open
    tl.to(aboutTopRef.current, {
      y: -gapHeight / 2,
      duration: 1,
      ease: "back.out(1.2)"
    }, 0.5) // Start after a small 0.5s delay
    .to(aboutBottomRef.current, {
      y: gapHeight / 2,
      duration: 1,
      ease: "back.out(1.2)"
    }, 0.5)
    .to(aboutInnerRef.current, {
      scaleY: 1,
      opacity: 1,
      duration: 0.8,
      ease: "power3.out"
    }, 0.6);

    // 2. Hold for a moment
    tl.to({}, { duration: 1.2 });

    // 3. "ABOUT" Closes
    tl.to(aboutTopRef.current, {
      y: 0,
      duration: 0.8,
      ease: "power3.inOut"
    })
    .to(aboutBottomRef.current, {
      y: 0,
      duration: 0.8,
      ease: "power3.inOut"
    }, "<")
    .to(aboutInnerRef.current, {
      scaleY: 0,
      opacity: 0,
      duration: 0.6,
      ease: "power3.inOut"
    }, "<");

    // 4. "C S E D" Slides out horizontally
    tl.to(csedRef.current, {
      xPercent: 0,
      duration: 1.5,
      ease: "power3.out"
    }, "-=0.2"); // Starts slightly before the close finishes

  }, { scope: containerRef });

  return (
    <div ref={containerRef} className="flex items-center gap-6 font-bold text-7xl tracking-widest uppercase cursor-default">
      
      {/* "ABOUT" Container with Split Logic */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden">
        
        {/* Top Half of ABOUT */}
        <div 
          ref={aboutTopRef}
          className="text-[#E50914] leading-none z-20 relative"
          style={{ clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}
        >
          ABOUT
        </div>

        {/* Inner Reveal (The "YOUR EYES" equivalent) */}
        <div 
          ref={aboutInnerRef}
          className="absolute top-1/2 left-0 w-full h-[70px] -translate-y-1/2 flex items-center justify-center z-10 origin-center bg-white"
        >
          <span
            className="text-black text-4xl font-black tracking-[0.4em]"
            spellCheck={false}
            autoCorrect="off"
            autoComplete="off"
            style={{ WebkitUserModify: "read-only", textDecoration: "none" }}
          >
            C S E D
          </span>
        </div>

        {/* Bottom Half of ABOUT */}
        <div 
          ref={aboutBottomRef}
          className="text-[#E50914] leading-none absolute top-0 left-0 w-full h-full z-20 pointer-events-none"
          style={{ clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0 100%)" }}
        >
          ABOUT
        </div>
      </div>
      
      {/* Sliding "C S E D" Mask Container */}
      <div ref={maskRef} className="relative overflow-hidden flex items-center h-full">
        <div 
          ref={csedRef}
          className="text-black whitespace-nowrap"
        >
          C S E D
        </div>
      </div>

    </div>
  );
}

