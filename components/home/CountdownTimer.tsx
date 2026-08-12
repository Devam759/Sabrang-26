'use client';

import { useState, useEffect } from 'react';

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number; }

export default function CountdownTimer({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const target = new Date(targetDate).getTime();
        const tick = () => {
            const diff = Math.max(0, target - Date.now());
            setTimeLeft({
                days: Math.floor(diff / 86400000),
                hours: Math.floor((diff % 86400000) / 3600000),
                minutes: Math.floor((diff % 3600000) / 60000),
                seconds: Math.floor((diff % 60000) / 1000),
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [targetDate]);

    if (!mounted) return null;

    const blocks = [
        { label: 'DAYS', value: timeLeft.days },
        { label: 'HOURS', value: timeLeft.hours },
        { label: 'MINUTES', value: timeLeft.minutes },
        { label: 'SECONDS', value: timeLeft.seconds },
    ];

    return (
        <div className="flex items-start justify-center gap-3 md:gap-6">
            {blocks.map((block, i) => (
                <div key={block.label} className="flex items-start gap-3 md:gap-6">
                    <div className="flex flex-col items-center">
                        <div className="relative overflow-hidden">
                            <div className="text-5xl md:text-8xl lg:text-9xl font-black text-white tabular-nums tracking-tighter transition-all duration-300"
                                style={{ textShadow: '0 0 40px rgba(157,78,221,0.3)' }}>
                                {String(block.value).padStart(2, '0')}
                            </div>
                            <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                        </div>
                        <div className="text-[9px] md:text-xs tracking-[0.3em] text-white/30 mt-3 uppercase font-light">
                            {block.label}
                        </div>
                    </div>
                    {i < blocks.length - 1 && (
                        <div className="text-3xl md:text-6xl text-white/20 font-light mt-2 md:mt-4 animate-pulse">:</div>
                    )}
                </div>
            ))}
        </div>
    );
}
