import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface SplashScreenProps {
    onFinish: () => void;
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [logoVisible, setLogoVisible] = useState(false);

    useEffect(() => {
        // Start entry animation
        setTimeout(() => setLogoVisible(true), 100);

        // Start exit animation
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, 2200);

        // Notify parent to unmount
        const finishTimer = setTimeout(() => {
            onFinish();
        }, 2800); // 2200 + 600ms exit duration

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(finishTimer);
        };
    }, [onFinish]);

    return (
        <div
            className={clsx(
                "fixed inset-0 z-[9999] bg-zinc-950 flex flex-col items-center justify-center transition-opacity duration-700",
                isExiting ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
        >
            <div
                className={clsx(
                    "relative transition-all duration-1000 ease-out transform flex flex-col items-center",
                    logoVisible ? "scale-100 opacity-100 translate-y-0" : "scale-90 opacity-0 translate-y-10"
                )}
            >
                <div className="relative">
                    <div className="absolute inset-0 bg-white/20 blur-2xl rounded-full scale-150 animate-pulse" />
                    <img
                        src="./favicon.png"
                        alt="Hone"
                        className="w-24 h-24 relative z-10 drop-shadow-2xl"
                    />
                </div>

                {/* Text Animation */}
                <h1 className={clsx(
                    "mt-8 text-3xl font-bold text-white tracking-[0.2em] uppercase text-center transition-all duration-1000 delay-300 pl-[0.2em]",
                    logoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}>
                    Hone
                </h1>
                <p className={clsx(
                    "mt-3 text-xs font-medium text-zinc-500 tracking-widest uppercase text-center transition-all duration-1000 delay-500 pl-[0.1em]",
                    logoVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}>
                    Sharpen your habits
                </p>
            </div>
        </div>
    );
}
