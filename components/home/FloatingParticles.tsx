'use client';

import { useEffect, useRef } from 'react';

const PARTICLE_COUNT = 25;
const COLORS = ['#9d4edd', '#ff00ff', '#00e5ff', '#ffc800'];

interface Particle {
    x: number; y: number; size: number;
    speedX: number; speedY: number;
    opacity: number; color: string;
    pulse: number; pulseSpeed: number;
}

export default function FloatingParticles() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = document.documentElement.scrollHeight;
        };
        resize();

        const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2.5 + 0.5,
            speedX: (Math.random() - 0.5) * 0.25,
            speedY: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.4 + 0.1,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            pulse: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01 + Math.random() * 0.02,
        }));

        let animId: number;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.speedX;
                p.y += p.speedY;
                p.pulse += p.pulseSpeed;
                if (p.x < -10) p.x = canvas.width + 10;
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.y < -10) p.y = canvas.height + 10;
                if (p.y > canvas.height + 10) p.y = -10;

                const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = currentOpacity;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
                ctx.globalAlpha = currentOpacity * 0.15;
                ctx.fill();
            });
            ctx.globalAlpha = 1;
            animId = requestAnimationFrame(animate);
        };
        animate();

        window.addEventListener('resize', resize);
        const resizeObs = new ResizeObserver(resize);
        resizeObs.observe(document.body);

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', resize);
            resizeObs.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full z-[1] pointer-events-none"
            style={{ mixBlendMode: 'screen' }}
        />
    );
}
