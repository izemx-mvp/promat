import { useEffect, useRef } from "react";

/**
 * Living industrial background. Layers, bottom → top:
 * 1. Base wash (theme background)
 * 2. Rotating conic mesh — subtle spectrum sweep
 * 3. Six colored aurora blobs, each on its own drift orbit
 * 4. Engineering grid (drifts diagonally)
 * 5. Animated SVG blueprint waveform (flow-of-work metaphor)
 * 6. Horizontal scan-line pulse (industrial data feel)
 * 7. Constellation canvas (≥1024px, red near cursor)
 * 8. Grain
 * 9. Cursor spotlight
 * Respects prefers-reduced-motion.
 */
export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 1024px)").matches;

    const spot = spotlightRef.current;
    let tx = 0, ty = 0, cx = 0, cy = 0, rafId = 0, running = true;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    if (spot && wide && !reduce) {
      window.addEventListener("mousemove", onMove, { passive: true });
      const step = () => {
        if (!running) return;
        cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
        spot.style.transform = `translate3d(${cx - 260}px, ${cy - 260}px, 0)`;
        rafId = requestAnimationFrame(step);
      };
      step();
    }

    let canvasRaf = 0;
    const canvas = canvasRef.current;
    if (canvas && wide && !reduce) {
      const ctx = canvas.getContext("2d");
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const resize = () => {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";
      };
      resize();
      window.addEventListener("resize", resize);
      const nodes = Array.from({ length: 55 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
      }));
      const draw = () => {
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        for (const n of nodes) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > window.innerWidth) n.vx *= -1;
          if (n.y < 0 || n.y > window.innerHeight) n.vy *= -1;
        }
        for (let i = 0; i < nodes.length; i++) {
          const a = nodes[i]!;
          for (let j = i + 1; j < nodes.length; j++) {
            const b = nodes[j]!;
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 140) {
              const cursor = Math.hypot((a.x + b.x) / 2 - cx, (a.y + b.y) / 2 - cy);
              const red = cursor < 300;
              ctx.strokeStyle = red
                ? `rgba(229,13,45,${(1 - d / 140) * 0.55})`
                : `rgba(56,189,248,${(1 - d / 140) * 0.18})`;
              ctx.lineWidth = 0.7;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          ctx.fillStyle = "rgba(56,189,248,0.42)";
          ctx.beginPath(); ctx.arc(a.x, a.y, 1.5, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        canvasRaf = requestAnimationFrame(draw);
      };
      draw();
      const onVis = () => {
        if (document.hidden) { cancelAnimationFrame(canvasRaf); }
        else { canvasRaf = requestAnimationFrame(draw); }
      };
      document.addEventListener("visibilitychange", onVis);
      return () => {
        running = false;
        cancelAnimationFrame(rafId);
        cancelAnimationFrame(canvasRaf);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("resize", resize);
        document.removeEventListener("visibilitychange", onVis);
      };
    }

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Rotating conic mesh */}
      <div
        className="aurora-conic absolute left-1/2 top-1/2 h-[220vmax] w-[220vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.22] dark:opacity-30"
        style={{
          background:
            "conic-gradient(from 0deg, rgba(229,13,45,0.35), rgba(56,189,248,0.30), rgba(167,139,250,0.30), rgba(52,211,153,0.28), rgba(251,146,60,0.30), rgba(229,13,45,0.35))",
          filter: "blur(120px)",
          animation: "conic-spin 60s linear infinite",
          willChange: "transform",
        }}
      />

      {/* Aurora blobs — strong, colorful, always moving */}
      <div
        className="aurora-blob absolute -left-[10%] -top-[15%] size-[70vw] rounded-full opacity-90 dark:opacity-95"
        style={{
          background: "radial-gradient(circle, rgba(229,13,45,0.55), transparent 65%)",
          filter: "blur(110px)",
          animation: "aurora-drift-1 22s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="aurora-blob absolute -right-[15%] -top-[10%] size-[65vw] rounded-full opacity-85 dark:opacity-90"
        style={{
          background: "radial-gradient(circle, rgba(56,189,248,0.55), transparent 65%)",
          filter: "blur(110px)",
          animation: "aurora-drift-2 26s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="aurora-blob absolute -bottom-[20%] left-[10%] size-[60vw] rounded-full opacity-85 dark:opacity-90"
        style={{
          background: "radial-gradient(circle, rgba(167,139,250,0.55), transparent 65%)",
          filter: "blur(110px)",
          animation: "aurora-drift-3 30s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="aurora-blob absolute bottom-[5%] right-[5%] size-[55vw] rounded-full opacity-80 dark:opacity-90"
        style={{
          background: "radial-gradient(circle, rgba(251,146,60,0.55), transparent 65%)",
          filter: "blur(110px)",
          animation: "aurora-drift-4 28s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="aurora-blob absolute top-[30%] left-[35%] size-[45vw] rounded-full opacity-70 dark:opacity-80"
        style={{
          background: "radial-gradient(circle, rgba(52,211,153,0.45), transparent 65%)",
          filter: "blur(120px)",
          animation: "aurora-drift-5 34s ease-in-out infinite",
          willChange: "transform",
        }}
      />
      <div
        className="aurora-blob absolute top-[55%] left-[8%] size-[42vw] rounded-full opacity-75 dark:opacity-85"
        style={{
          background: "radial-gradient(circle, rgba(244,114,182,0.50), transparent 65%)",
          filter: "blur(110px)",
          animation: "aurora-drift-2 38s ease-in-out infinite reverse",
          willChange: "transform",
        }}
      />

      {/* Frosted wash to keep contrast */}
      <div
        className="absolute inset-0"
        style={{
          background: "var(--background)",
          opacity: 0.55,
          backdropFilter: "blur(60px)",
        }}
      />

      {/* Engineering grid */}
      <div
        className="absolute inset-0 opacity-[0.5] dark:opacity-[0.3]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(29,42,77,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(29,42,77,0.09) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 78%)",
          animation: "grid-drift 60s linear infinite",
        }}
      />

      {/* Blueprint waveform — flow-of-work metaphor */}
      <svg
        className="aurora-wave absolute inset-x-0 bottom-[18%] h-[42vh] w-[200%] opacity-[0.35] dark:opacity-40"
        viewBox="0 0 2000 400"
        preserveAspectRatio="none"
        style={{ animation: "wave-flow 40s linear infinite", willChange: "transform" }}
      >
        <defs>
          <linearGradient id="promat-wave-a" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(229,13,45,0)" />
            <stop offset="50%" stopColor="rgba(229,13,45,0.75)" />
            <stop offset="100%" stopColor="rgba(229,13,45,0)" />
          </linearGradient>
          <linearGradient id="promat-wave-b" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="rgba(56,189,248,0)" />
            <stop offset="50%" stopColor="rgba(56,189,248,0.7)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0)" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 Q125,80 250,200 T500,200 T750,200 T1000,200 T1250,200 T1500,200 T1750,200 T2000,200"
          fill="none"
          stroke="url(#promat-wave-a)"
          strokeWidth="1.4"
        />
        <path
          d="M0,240 Q125,340 250,240 T500,240 T750,240 T1000,240 T1250,240 T1500,240 T1750,240 T2000,240"
          fill="none"
          stroke="url(#promat-wave-b)"
          strokeWidth="1.2"
        />
        <path
          d="M0,160 Q125,260 250,160 T500,160 T750,160 T1000,160 T1250,160 T1500,160 T1750,160 T2000,160"
          fill="none"
          stroke="url(#promat-wave-a)"
          strokeWidth="0.9"
          opacity="0.6"
        />
      </svg>

      {/* Horizontal scan-line pulse */}
      <div
        className="aurora-scan absolute inset-x-0 top-1/3 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(229,13,45,0.6), rgba(56,189,248,0.5), transparent)",
          animation: "scan-line 12s linear infinite",
          boxShadow: "0 0 24px rgba(229,13,45,0.4)",
          willChange: "transform",
        }}
      />
      <div
        className="aurora-scan absolute inset-x-0 top-[62%] h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.55), rgba(167,139,250,0.5), transparent)",
          animation: "scan-line 18s linear infinite 4s",
          boxShadow: "0 0 20px rgba(56,189,248,0.35)",
          willChange: "transform",
        }}
      />

      {/* Constellation */}
      <canvas ref={canvasRef} className="absolute inset-0 hidden lg:block" />

      {/* Grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay">
        <filter id="promat-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#promat-grain)" />
      </svg>

      {/* Cursor spotlight */}
      <div
        ref={spotlightRef}
        className="absolute hidden size-[520px] rounded-full lg:block"
        style={{
          background: "radial-gradient(circle, rgba(229,13,45,0.16) 0%, transparent 70%)",
          willChange: "transform",
        }}
      />
    </div>
  );
}
