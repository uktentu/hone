import type { ReactNode } from 'react';

interface LayoutProps {
    children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
    return (
        <div
            className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-white relative"
            role="application"
            aria-label="Habit tracker"
        >
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
                {children}
            </div>

            <footer className="shrink-0 py-2 border-t border-zinc-900 bg-zinc-950 text-center text-[10px] text-zinc-600 uppercase tracking-wider font-medium z-50 relative">
                &copy; {new Date().getFullYear()} Hone. All rights reserved.
            </footer>
        </div>
    );
}
