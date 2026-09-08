import { useEffect, useRef } from "react";

/**
 * Fixed animated background layer. Four sub-layers:
 * aurora blobs · engineering grid · constellation canvas (≥1024px) · grain
 * Plus a cursor spotlight. Respects prefers-reduced-motion.
 */
export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 1024px)").matches;

    // Cursor spotlight
    const spot = spotlightRef.current;
    let tx = 0, ty = 0, cx = 0, cy = 0, rafId = 0, running = true;
    const onMove = (e: MouseEvent) => { tx = e.clientX; ty = e.clientY; };
    if (spot && wide && !reduce) {
      window.addEventListener("mousemove", onMove, { passive: true });
      const step = () => {
        if (!running) return;
        cx += (tx - cx) * 0.12; cy += (ty - cy) * 0.12;
        spot.style.transform = `translate3d(${cx - 200}px, ${cy - 200}px, 0)`;
        rafId = requestAnimationFrame(step);
      };
      step();
    }

    // Constellation
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
      const nodes = Array.from({ length: 45 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
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
          for (let j = i + 1; j < nodes.length; j++) {
            const a = nodes[i], b = nodes[j];
            const d = Math.hypot(a.x - b.x, a.y - b.y);
            if (d < 120) {
              const cursor = Math.hypot((a.x + b.x) / 2 - cx, (a.y + b.y) / 2 - cy);
              const red = cursor < 260;
              ctx.strokeStyle = red
                ? `rgba(229,13,45,${(1 - d / 120) * 0.35})`
                : `rgba(29,42,77,${(1 - d / 120) * 0.10})`;
              ctx.lineWidth = 0.6;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
          ctx.fillStyle = "rgba(29,42,77,0.28)";
          ctx.beginPath(); ctx.arc(nodes[i].x, nodes[i].y, 1.3, 0, Math.PI * 2); ctx.fill();
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
      {/* Aurora blobs */}
      <div
        className="absolute -left-[10%] -top-[10%] size-[60vw] rounded-full opacity-70 dark:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(29,42,77,0.14), transparent 60%)", filter: "blur(140px)", animation: "aurora-drift-1 24s ease-in-out infinite" }}
      />
      <div
        className="absolute right-[-15%] top-[10%] size-[55vw] rounded-full opacity-70 dark:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(229,13,45,0.12), transparent 60%)", filter: "blur(140px)", animation: "aurora-drift-2 32s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[-20%] left-[20%] size-[50vw] rounded-full opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(56,189,248,0.10), transparent 60%)", filter: "blur(140px)", animation: "aurora-drift-3 28s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-[10%] right-[10%] size-[45vw] rounded-full opacity-60 dark:opacity-100"
        style={{ background: "radial-gradient(circle, rgba(167,139,250,0.10), transparent 60%)", filter: "blur(140px)", animation: "aurora-drift-4 30s ease-in-out infinite" }}
      />

      {/* Engineering grid */}
      <div
        className="absolute inset-0 opacity-[0.55] dark:opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(29,42,77,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(29,42,77,0.06) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          animation: "grid-drift 60s linear infinite",
        }}
      />

      {/* Constellation */}
      <canvas ref={canvasRef} className="absolute inset-0 hidden lg:block" />

      {/* Grain */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.025] dark:opacity-[0.04] mix-blend-overlay">
        <filter id="promat-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#promat-grain)" />
      </svg>

      {/* Cursor spotlight (desktop) */}
      <div
        ref={spotlightRef}
        className="absolute hidden size-[400px] rounded-full lg:block"
        style={{
          background: "radial-gradient(circle, rgba(229,13,45,0.10) 0%, transparent 70%)",
          mixBlendMode: "multiply",
          willChange: "transform",
        }}
      />
    </div>
  );
}
