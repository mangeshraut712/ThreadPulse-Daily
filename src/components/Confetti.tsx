import { useEffect, useState } from "react";

const COLORS = ["#C2410C", "#005FA3", "#7A4E00", "#0E7A34", "#5B45C6", "#A1266E", "#0C7A6E"];
const PARTICLE_COUNT = 24;

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
  shape: "square" | "circle";
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Confetti({ active }: { active: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active || prefersReducedMotion()) {
      setParticles([]);
      return;
    }

    const nextParticles: Particle[] = Array.from({ length: PARTICLE_COUNT }, (_, index) => ({
      id: index,
      x: (index * 37) % 100,
      color: COLORS[index % COLORS.length],
      delay: (index % 8) * 0.08,
      duration: 1.8 + (index % 5) * 0.25,
      size: 6 + (index % 4) * 2,
      shape: index % 2 === 0 ? "square" : "circle",
    }));

    setParticles(nextParticles);
    const timer = window.setTimeout(() => setParticles([]), 4000);
    return () => window.clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div className="confetti-container" aria-hidden="true">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-piece"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: particle.shape === "circle" ? "50%" : "2px",
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  );
}
