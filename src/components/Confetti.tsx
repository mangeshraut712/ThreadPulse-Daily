import { useEffect, useState } from "react";

const COLORS = ["#FF4500", "#0079D3", "#FFB800", "#46D369", "#7B61FF", "#FF6ACB", "#0DD3BB"];

interface Particle {
    id: number;
    x: number;
    color: string;
    delay: number;
    duration: number;
    size: number;
    shape: "square" | "circle";
}

export function Confetti({ active }: { active: boolean }) {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        if (!active) {
            setParticles([]);
            return;
        }

        const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            delay: Math.random() * 0.6,
            duration: 1.5 + Math.random() * 2,
            size: 6 + Math.random() * 8,
            shape: Math.random() > 0.5 ? "square" : "circle",
        }));

        setParticles(newParticles);

        const timer = setTimeout(() => setParticles([]), 4000);
        return () => clearTimeout(timer);
    }, [active]);

    if (particles.length === 0) return null;

    return (
        <div className="confetti-container" aria-hidden="true">
            {particles.map((p) => (
                <div
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.x}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        borderRadius: p.shape === "circle" ? "50%" : "2px",
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    );
}
