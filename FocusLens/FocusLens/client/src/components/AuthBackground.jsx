import React, { useEffect, useRef } from "react";
import "../pages/Landing/Landing.css";

export default function AuthBackground({ children }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const scale = window.devicePixelRatio || 1;

    function setSize() {
      canvas.width = canvas.clientWidth * scale;
      canvas.height = canvas.clientHeight * scale;
      ctx.setTransform(scale, 0, 0, scale, 0, 0);
    }

    setSize();

    const particles = Array.from({ length: Math.max(40, Math.floor(window.innerWidth / 30)) }, () => ({
      x: Math.random() * canvas.clientWidth,
      y: Math.random() * canvas.clientHeight,
      vx: Math.random() * 0.6 - 0.3,
      vy: Math.random() * 0.4 - 0.2,
      r: Math.random() * 2 + 1
    }));

    let raf = null;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = canvas.clientWidth + 20;
        if (p.x > canvas.clientWidth + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.clientHeight + 20;
        if (p.y > canvas.clientHeight + 20) p.y = -20;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 120 * 120) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100,150,220,${0.12 * (1 - d2 / (120 * 120))})`;
            ctx.lineWidth = 1;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        ctx.beginPath();
        ctx.fillStyle = "rgba(120,180,220,0.9)";
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", setSize);
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
    };
  }, []);

  return (
    <main className="landing-hero" style={{ position: "fixed", inset: 0 }}>
      <canvas className="bg-map" ref={canvasRef} />
      <div className="hero-overlay" />
      <div className="hero-content" style={{ position: "relative", zIndex: 2, width: "100%" }}>
        {children}
      </div>
      <div className="floating-shapes" aria-hidden="true">
        <span className="blob b1" />
        <span className="blob b2" />
        <span className="blob b3" />
      </div>
    </main>
  );
}
