import { createPortal } from 'react-dom';
import { useState, useLayoutEffect } from 'react';

interface TooltipProps {
    content: React.ReactNode;
    triggerRect: DOMRect | null;
    isVisible: boolean;
}

export function Tooltip({ content, triggerRect, isVisible }: TooltipProps) {
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    useLayoutEffect(() => {
        if (triggerRect && isVisible) {
            // Calculate position
            const padding = 8;

            let x = triggerRect.left + (triggerRect.width / 2);
            let y = triggerRect.top - padding; // Default to top

            // Adjust if too close to edges (basic collision detection)
            if (y < 50) {
                // Flip to bottom if close to top
                y = triggerRect.bottom + padding;
            }

            setPosition({ x, y });
        }
    }, [triggerRect, isVisible]);

    if (!isVisible || !triggerRect) return null;

    return createPortal(
        <div
            className="fixed z-[99999] pointer-events-none fade-in zoom-in-95 duration-150 animate-in"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-50%, -100%)' // Center horizontally, place above
            }}
        >
            <div className="bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs px-2 py-1.5 rounded-md shadow-xl whitespace-pre-wrap leading-relaxed min-w-[120px] text-center">
                {content}
            </div>
        </div>,
        document.body
    );
}
