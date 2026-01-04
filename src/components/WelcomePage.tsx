import { useEffect, useState } from 'react';
import { Sparkles, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

interface WelcomePageProps {
    onFinish: () => void;
}

export function WelcomePage({ onFinish }: WelcomePageProps) {
    const [step, setStep] = useState(0);

    useEffect(() => {
        // Step 0: Initial "Welcome" (0ms)
        // Step 1: "Creating Calendar" (1000ms)
        // Step 2: "Seeding Habits" (2500ms)
        // Step 3: "Ready" (4000ms)

        const timers = [
            setTimeout(() => setStep(1), 1000),
            setTimeout(() => setStep(2), 2500),
            setTimeout(() => setStep(3), 4000),
        ];

        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center select-none cursor-default">

            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center max-w-sm w-full">

                {/* Logo Animation */}
                <div className={clsx(
                    "mb-8 relative transition-all duration-700",
                    step >= 3 ? "scale-75 translate-y-[-20px]" : "scale-100"
                )}>
                    <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
                    <img src="./favicon_header.png" alt="Hone" className="w-20 h-20 relative z-10 drop-shadow-2xl" />
                </div>

                {/* Text Content */}
                <h1 className="text-3xl font-bold text-white mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    Welcome to Hone
                </h1>
                <p className="text-zinc-500 mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    Setting up your mindful workspace...
                </p>

                {/* Checklist Steps */}
                <div className="w-full space-y-4 mb-10">
                    <div className={clsx(
                        "flex items-center gap-3 p-4 rounded-lg border transition-all duration-500",
                        step >= 1 ? "bg-zinc-900/80 border-zinc-800 translate-x-0 opacity-100" : "bg-transparent border-transparent -translate-x-4 opacity-0"
                    )}>
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500",
                            step >= 1 ? "bg-indigo-500/20 text-indigo-400" : "bg-zinc-800 text-zinc-600"
                        )}>
                            <Calendar size={16} />
                        </div>
                        <span className="text-sm font-medium text-zinc-300">Creating your first calendar</span>
                        {step >= 1 && <CheckCircle2 size={16} className="ml-auto text-emerald-500 animate-in zoom-in spin-in-90 duration-300" />}
                    </div>

                    <div className={clsx(
                        "flex items-center gap-3 p-4 rounded-lg border transition-all duration-500 delay-100",
                        step >= 2 ? "bg-zinc-900/80 border-zinc-800 translate-x-0 opacity-100" : "bg-transparent border-transparent -translate-x-4 opacity-0"
                    )}>
                        <div className={clsx(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-500",
                            step >= 2 ? "bg-pink-500/20 text-pink-400" : "bg-zinc-800 text-zinc-600"
                        )}>
                            <Sparkles size={16} />
                        </div>
                        <span className="text-sm font-medium text-zinc-300">Seeding default habits</span>
                        {step >= 2 && <CheckCircle2 size={16} className="ml-auto text-emerald-500 animate-in zoom-in spin-in-90 duration-300" />}
                    </div>
                </div>

                {/* Continue Button */}
                <div className={clsx(
                    "transition-all duration-700 transform",
                    step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
                )}>
                    <button
                        onClick={onFinish}
                        className="group flex items-center gap-2 bg-white text-black px-8 py-3 rounded-full font-bold tracking-wide hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10"
                    >
                        Get Started
                        <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>

            </div>
        </div>
    );
}
