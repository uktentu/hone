import { startOfYear, eachMonthOfInterval, endOfYear, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isToday } from 'date-fns';
import clsx from 'clsx';
import { useState, useRef } from 'react';
import type { Habit } from '../types';
import { Tooltip } from './Tooltip';

interface YearViewProps {
    year: number;
    habits: Habit[];
    selectedHabitIds: string[];
    onToggleHabit: (date: Date, habitId: string) => void;
    isHabitCompleted: (date: Date, habitId: string) => boolean;
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
    if (hex.length !== 6) return 'white';

    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Validate RGB values
    if (isNaN(r) || isNaN(g) || isNaN(b)) return 'white';

    // Calculate relative luminance using WCAG formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light colors, white for dark colors
    return luminance > 0.5 ? 'black' : 'white';
}

// Sub-component for individual day cell in YearView
function YearDayCell({
    day,
    month,
    habits,
    selectedHabitIds,
    onToggleHabit,
    isHabitCompleted,
    setHoveredTooltip
}: {
    day: Date;
    month: Date;
    habits: Habit[];
    selectedHabitIds: string[];
    onToggleHabit: (date: Date, habitId: string) => void;
    isHabitCompleted: (date: Date, habitId: string) => boolean;
    setHoveredTooltip: (t: { content: React.ReactNode; triggerRect: DOMRect } | null) => void;
}) {
    const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    const isCurrentMonth = isSameMonth(day, month);
    if (!isCurrentMonth) return <div />;

    const completedHabitIds = selectedHabitIds.filter(id => isHabitCompleted(day, id));
    const completedHabitId = completedHabitIds[0];
    const completedHabit = completedHabitId ? habits.find(h => h.id === completedHabitId) : null;
    const isCompleted = !!completedHabit;

    const isMultiSelect = selectedHabitIds.length > 1;
    const displayColor = isMultiSelect ? '#ffffff' : completedHabit?.color;

    const isCurrentDay = isToday(day);
    const textColor = isCompleted ? getTextColorForBackground(displayColor) : undefined;

    const completedNames = completedHabitIds
        .map(id => habits.find(h => h.id === id)?.name)
        .filter(Boolean)
        .join('\n• ');
    const title = completedNames
        ? `${format(day, 'MMM d, yyyy')}\n• ${completedNames}`
        : format(day, 'MMM d, yyyy');

    const handleTouchStart = (e: React.TouchEvent) => {
        isLongPress.current = false;

        // Capture rect synchronously
        const rect = e.currentTarget.getBoundingClientRect();

        const timer = setTimeout(() => {
            isLongPress.current = true;
            setHoveredTooltip({
                content: title,
                triggerRect: rect
            });
        }, 500);
        setLongPressTimer(timer);
    };

    const handleTouchEnd = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
        if (isLongPress.current) {
            setTimeout(() => setHoveredTooltip(null), 1500);
        }
    };

    const handleTouchMove = () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            setLongPressTimer(null);
        }
    };

    return (
        <button
            onMouseEnter={(e) => {
                if (window.matchMedia('(hover: hover)').matches) {
                    setHoveredTooltip({
                        content: title,
                        triggerRect: e.currentTarget.getBoundingClientRect()
                    });
                }
            }}
            onMouseLeave={() => setHoveredTooltip(null)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchMove={handleTouchMove}
            onContextMenu={(e) => e.preventDefault()}
            onClick={(e) => {
                if (isLongPress.current) {
                    e.preventDefault();
                    return;
                }
                onToggleHabit(day, selectedHabitIds[0]);
            }}
            className="group relative w-full aspect-square flex items-center justify-center rounded-sm hover:bg-zinc-800/30 transition-colors select-none touch-manipulation"
            style={{
                WebkitTapHighlightColor: 'transparent',
                WebkitTouchCallout: 'none',
                userSelect: 'none'
            }}
        >
            <span
                className={clsx(
                    "w-full h-full flex items-center justify-center text-[9px] rounded-lg transition-all duration-200 pointer-events-none",
                    isCompleted && "font-bold shadow-sm",
                    !isCompleted && "text-zinc-500 hover:text-white",
                    isCurrentDay && !isCompleted && "text-white font-bold bg-zinc-800"
                )}
                style={{
                    backgroundColor: isCompleted ? displayColor : undefined,
                    color: isCompleted ? textColor : undefined
                }}
            >
                {format(day, 'd')}
            </span>
        </button>
    );
}

export function YearView({ year, habits, selectedHabitIds, onToggleHabit, isHabitCompleted }: YearViewProps) {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(yearStart);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    const [hoveredTooltip, setHoveredTooltip] = useState<{ content: React.ReactNode; triggerRect: DOMRect } | null>(null);

    if (habits.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-zinc-500 text-xs">No habits yet</p>
            </div>
        );
    }

    if (selectedHabitIds.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-zinc-500 text-xs">Select a habit</p>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto custom-scrollbar p-1 animate-in fade-in zoom-in-95 duration-500">
            {/* Compact Grid to fit single page */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 md:gap-2">
                {months.map((month) => {
                    const monthStart = startOfMonth(month);
                    const monthEnd = endOfMonth(month);
                    const startDate = startOfWeek(monthStart);
                    const endDate = endOfWeek(monthEnd);
                    const days = eachDayOfInterval({ start: startDate, end: endDate });

                    // Compact Month Card with Dotted Separator
                    return (
                        <div key={month.toString()} className="flex flex-col border-b border-zinc-800/20 md:border md:border-zinc-800/40 md:border-dashed rounded-none md:rounded p-1 md:p-1.5 hover:border-zinc-700 transition-colors">
                            <h3 className="text-zinc-500 font-bold mb-1 text-[10px] md:text-[11px] tracking-wide uppercase pl-1">
                                {format(month, 'MMM')}
                            </h3>

                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 mb-0.5">
                                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                                    <div key={i} className="text-center text-[8px] text-zinc-600 font-bold">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-px md:gap-[2px]">
                                {days.map(day => (
                                    <YearDayCell
                                        key={day.toISOString()}
                                        day={day}
                                        month={month}
                                        habits={habits}
                                        selectedHabitIds={selectedHabitIds}
                                        onToggleHabit={onToggleHabit}
                                        isHabitCompleted={isHabitCompleted}
                                        setHoveredTooltip={setHoveredTooltip}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
            <Tooltip
                content={hoveredTooltip?.content}
                triggerRect={hoveredTooltip?.triggerRect || null}
                isVisible={!!hoveredTooltip}
            />
        </div >
    );
}
