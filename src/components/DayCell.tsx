import { format, isSameMonth, isToday } from 'date-fns';
import clsx from 'clsx';
import type { Habit } from '../types';
import { Check } from 'lucide-react';


interface DayCellProps {
    date: Date;
    currentMonth: Date;
    selectedHabit: Habit | null;
    isCompleted: boolean;
    onToggle: () => void;
}

// Helper function to determine if a color is light (requires dark text) or dark (requires white text)
function getTextColorForBackground(hexColor: string | undefined): string {
    if (!hexColor) return 'white';

    // Remove # if present and ensure we have a valid hex string
    let hex = hexColor.trim().replace(/^#/, '');

    // Handle shortened hex codes (e.g., "fff" -> "ffffff")
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }

    // Validate hex length
    if (hex.length !== 6) {
        console.warn('Invalid hex color:', hexColor);
        return 'white';
    }

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Validate RGB values
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
        console.warn('Failed to parse RGB from hex:', hexColor);
        return 'white';
    }

    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    const result = luminance > 0.5 ? 'black' : 'white';
    console.log('Color:', hexColor, 'RGB:', r, g, b, 'Luminance:', luminance.toFixed(2), 'Text:', result);
    return result;
}

export function DayCell({ date, currentMonth, selectedHabit, isCompleted, onToggle }: DayCellProps) {
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isCurrentDay = isToday(date);
    const textColor = isCompleted && selectedHabit ? getTextColorForBackground(selectedHabit.color) : 'white';

    return (
        <button
            onClick={onToggle}
            disabled={!isCurrentMonth || !selectedHabit}
            aria-label={`${format(date, 'MMMM d, yyyy')} - ${isCompleted ? 'Completed' : 'Not completed'}`}
            aria-pressed={isCompleted}
            className={clsx(
                "relative flex flex-col items-start justify-start p-2 rounded-lg cursor-pointer group h-full min-h-[60px] md:min-h-[70px]",
                "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
                "transition-all duration-300 ease-out",
                !isCurrentMonth && "opacity-0 pointer-events-none",
                isCurrentMonth && !isCompleted && "surface surface-hover active:scale-[0.97]",
                isCompleted && "shadow-2xl ring-2 ring-white/20 rounded-lg overflow-hidden",
                !selectedHabit && "cursor-not-allowed opacity-50"
            )}
            style={{
                backgroundColor: isCompleted && selectedHabit ? selectedHabit.color : undefined,
                boxShadow: isCompleted && selectedHabit
                    ? `0 10px 40px ${selectedHabit.color}40, 0 0 0 1px ${selectedHabit.color}60`
                    : undefined,
            }}
        >
            {/* Date Number */}
            <span
                className={clsx(
                    "text-sm font-bold z-10 transition-all duration-300 relative",
                    isCurrentDay && !isCompleted && "text-purple-400"
                )}
                style={{
                    color: isCompleted ? textColor : (isCurrentDay ? undefined : '#cbd5e1')
                }}
            >
                {format(date, 'd')}
            </span>

            {/* Today Indicator */}
            {isCurrentDay && !isCompleted && (
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-purple-400 shadow-lg shadow-purple-500/50 animate-pulse" />
            )}

            {/* Completion Check Mark */}
            {isCompleted && (
                <div className="absolute bottom-2 right-2 z-10">
                    <div className="p-1 rounded-full" style={{ backgroundColor: textColor === 'black' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)' }}>
                        <Check className="w-3 h-3" style={{ color: textColor }} strokeWidth={3} />
                    </div>
                </div>
            )}
        </button>
    );
}
