"use client";

import { useEffect, useRef } from "react";

// Lightweight canvas starfield: twinkling stars + slow drift.
// Pauses when the hero is off-screen. Zero deps.
export default function Starfield() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = true;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    interface Star {
      x: number;
      y: number;
      r: number;
      phase: number;
      speed: number;
      hue: number;
    }
    let stars: Star[] = [];

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const count = Math.min(220, Math.floor((w * h) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: 0.4 + Math.random() * 1.6,
        phase: Math.random() * Math.PI * 2,
        speed: 0.15 + Math.random() * 0.5,
        hue: Math.random(),
      }));
    };

    let t = 0;
    const frame = () => {
      if (!running) return;
      t += 0.016;
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        s.y -= s.speed * 0.3;
        if (s.y < -4) {
          s.y = h + 4;
          s.x = Math.random() * w;
        }
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * s.speed * 2 + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle =
          s.hue > 0.8
            ? `rgba(139,92,246,${0.85 * tw})`
            : s.hue > 0.6
              ? `rgba(34,211,238,${0.85 * tw})`
              : `rgba(255,255,255,${0.75 * tw})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    };

    const onVis = () => {
      const hidden = document.hidden;
      if (hidden && running) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!hidden && !running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    raf = requestAnimationFrame(frame);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas id="stars" ref={ref} aria-hidden="true" />;
}
