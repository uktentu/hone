import { eachDayOfInterval, endOfYear, format, getDay, startOfYear, differenceInDays } from 'date-fns';
import { useMemo, useState, useRef } from 'react';
import clsx from 'clsx';
import type { Habit, HabitLog } from '../types';
import { Tooltip } from './Tooltip';

interface GraphViewProps {
    year: number;
    habits: Habit[];
    selectedHabitIds: string[];
    isHabitCompleted: (date: Date, habitId: string) => boolean;
    logs: HabitLog;
}

export function GraphView({ year, habits, selectedHabitIds, isHabitCompleted, logs }: GraphViewProps) {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(yearStart);
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });


    const startDay = getDay(yearStart);
    const emptyDaysBefore = Array(startDay).fill(null);
    const [hoveredTooltip, setHoveredTooltip] = useState<{ content: React.ReactNode; triggerRect: DOMRect } | null>(null);

    const allCells = [...emptyDaysBefore, ...days];
    const primaryHabit = habits.find(h => h.id === selectedHabitIds[0]);

    // Calculate all stats in one memoized block to prevent render issues
    const {
        completedCount,
        percentage,
        monthlyStats,
        weekdayStats,
        quarterlyStats,
        streakStats
    } = useMemo(() => {
        if (selectedHabitIds.length === 0) return {
            completedCount: 0, percentage: 0, monthlyStats: [], weekdayStats: [], quarterlyStats: [], streakStats: []
        };

        // Helper to check if ANY selected habit is completed on a day
        // For stats like "completedCount", we count distinct days where at least one habit was done?
        // OR do we sum up total completions?
        // User request "aggregated statistics" usually implies summing effort.
        // Let's sum up total completions for the counters.

        // 1. Basic Stats (Aggregation: Sum of all completions)
        let totalCompletions = 0;
        days.forEach(day => {
            selectedHabitIds.forEach(id => {
                if (isHabitCompleted(day, id)) totalCompletions++;
            });
        });

        const completedCount = totalCompletions;
        // Percentage is tricky for multiple habits. (Total Completions / (Days * NumHabits))
        const totalPossible = days.length * selectedHabitIds.length;
        const percentage = Math.round((totalCompletions / totalPossible) * 100);

        // 2. Monthly Stats
        const monthlyStats = Array.from({ length: 12 }).map((_, i) => {
            const monthDays = days.filter(d => d.getMonth() === i);
            let count = 0;
            monthDays.forEach(d => {
                selectedHabitIds.forEach(id => {
                    if (isHabitCompleted(d, id)) count++;
                });
            });
            return { monthIndex: i, count };
        });

        // 3. Weekday Stats
        const weekdayStats = [0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
            const targetDay = dayIndex;
            const targetDays = days.filter(d => getDay(d) === targetDay);
            let count = 0;
            targetDays.forEach(d => {
                selectedHabitIds.forEach(id => {
                    if (isHabitCompleted(d, id)) count++;
                });
            });
            // Total possible needed for scaling bars is just number of those days * num habits
            const total = targetDays.length * selectedHabitIds.length;
            return { dayIndex, count, total };
        });

        // 4. Quarterly Stats
        const quarterlyStats = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
            const quarterMonths = [0, 1, 2].map(m => i * 3 + m);
            const quarterDays = days.filter(d => quarterMonths.includes(d.getMonth()));
            let count = 0;
            quarterDays.forEach(d => {
                selectedHabitIds.forEach(id => {
                    if (isHabitCompleted(d, id)) count++;
                });
            });
            const total = quarterDays.length * selectedHabitIds.length;
            return { label: q, count, total };
        });

        // 5. Streak Distribution
        // Streaks are ambiguous for multi-select. 
        // We will calculate streaks for the FIRST selected habit as a proxy, or hide it.
        // The implementation plan didn't specify, but sidebar hides it.
        // Let's compute streaks for the PRIMARY habit (first one) to show something meaningful, 
        // OR simply hide/zero it out. 
        // A better aggregate might be "days where I did ANY of these habits".
        // Let's track streaks of "Any Activity".
        const streaks: number[] = [];
        let current = 0;
        days.forEach(d => {
            const hasActivity = selectedHabitIds.some(id => isHabitCompleted(d, id));
            if (hasActivity) {
                current++;
            } else if (current > 0) {
                streaks.push(current);
                current = 0;
            }
        });
        if (current > 0) streaks.push(current);

        const streakBuckets = [
            { label: '1-3', min: 1, max: 3, count: 0 },
            { label: '4-7', min: 4, max: 7, count: 0 },
            { label: '8-14', min: 8, max: 14, count: 0 },
            { label: '15+', min: 15, max: Infinity, count: 0 },
        ];

        streakBuckets.forEach(bucket => {
            bucket.count = streaks.filter(s => s >= bucket.min && s <= bucket.max).length;
        });

        return { completedCount, percentage, monthlyStats, weekdayStats, quarterlyStats, streakStats: streakBuckets };
    }, [days, selectedHabitIds, isHabitCompleted, logs]);


    if (habits.length === 0 || selectedHabitIds.length === 0 || !primaryHabit) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-zinc-500 text-xs">Select a habit to view graph</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-y-auto p-2 md:p-4 animate-in fade-in zoom-in-95 duration-500 custom-scrollbar">
            <div className="flex items-end justify-between mb-4 md:mb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-0.5">
                        <h2 className="text-sm font-bold text-white">Contribution Graph</h2>
                        <span className="text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-md">
                            <span className="text-zinc-200 font-semibold">{differenceInDays(yearEnd, new Date())}</span> days left
                        </span>
                    </div>
                    <p className="text-zinc-500 text-[10px]">
                        {completedCount} completions in {year} • {percentage}% rate
                    </p>
                </div>

            </div>

            <div className="flex-1 overflow-x-auto min-h-[160px] shrink-0 custom-scrollbar pb-2">
                <div className="flex gap-2 min-w-full">
                    {/* Day Labels */}
                    <div className="grid grid-rows-7 gap-1 text-[10px] text-zinc-600 font-medium pt-4 items-center h-max leading-none mt-1">
                        <span className="h-3 flex items-center opacity-0">S</span>
                        <span className="h-3 flex items-center">Mon</span>
                        <span className="h-3 flex items-center opacity-0">T</span>
                        <span className="h-3 flex items-center">Wed</span>
                        <span className="h-3 flex items-center opacity-0">T</span>
                        <span className="h-3 flex items-center">Fri</span>
                        <span className="h-3 flex items-center opacity-0">S</span>
                    </div>

                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                        {/* Month Labels */}
                        <div className="flex text-[10px] text-zinc-600 font-medium relative h-4">
                            {Array.from({ length: 12 }).map((_, i) => (
                                <span key={i} className="flex-1 text-left pl-1">{format(new Date(year, i, 1), 'MMM')}</span>
                            ))}
                        </div>

                        <div className="grid grid-rows-7 grid-flow-col gap-1 w-full">
                            {allCells.map((day, idx) => {
                                if (!day) return <div key={`empty-${idx}`} className="w-3 h-3" />;

                                // Calculate intensity: How many of the selected habits were completed?
                                const habitsCompletedToday = selectedHabitIds.filter(id => isHabitCompleted(day, id)).length;
                                const isCompleted = habitsCompletedToday > 0;
                                const intensity = selectedHabitIds.length > 0 ? habitsCompletedToday / selectedHabitIds.length : 0;

                                // Visuals: Use White for multi-select, Primary Color for single select
                                const isMultiSelect = selectedHabitIds.length > 1;
                                const displayColor = isMultiSelect ? '#ffffff' : primaryHabit.color;

                                // Opacity Logic:
                                // Multi-Select: Scale from 0.2 (dim) to 1.0 (bright) based on intensity
                                // Single-Select: Always 1.0 (since intensity is always 1 for completed single habit)
                                const opacity = isCompleted
                                    ? (isMultiSelect ? 0.2 + (intensity * 0.8) : 1)
                                    : 1; // Empty cells handle opacity via class

                                // Tooltip logic
                                const completedHabitIds = selectedHabitIds.filter(id => isHabitCompleted(day, id));
                                const completedNames = completedHabitIds
                                    .map(id => habits.find(h => h.id === id)?.name)
                                    .filter(Boolean)
                                    .join('\n• ');

                                const tooltipText = `${format(day, 'EEEE, MMM d, yyyy')}\n${habitsCompletedToday}/${selectedHabitIds.length} completed${completedNames ? ':\n• ' + completedNames : ''}`;

                                const [longPressTimer, setLongPressTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
                                const isLongPress = useRef(false);

                                const handleTouchStart = (e: React.TouchEvent) => {
                                    isLongPress.current = false;
                                    const timer = setTimeout(() => {
                                        isLongPress.current = true;
                                        setHoveredTooltip({
                                            content: tooltipText,
                                            triggerRect: e.currentTarget.getBoundingClientRect()
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

                                return (
                                    <div
                                        key={day.toISOString()}
                                        onMouseEnter={(e) => {
                                            if (window.matchMedia('(hover: hover)').matches) {
                                                setHoveredTooltip({
                                                    content: tooltipText,
                                                    triggerRect: e.currentTarget.getBoundingClientRect()
                                                });
                                            }
                                        }}
                                        onMouseLeave={() => setHoveredTooltip(null)}
                                        onTouchStart={handleTouchStart}
                                        onTouchEnd={handleTouchEnd}
                                        onClick={(e) => {
                                            if (isLongPress.current) {
                                                e.preventDefault();
                                                return;
                                            }
                                        }}
                                        className={clsx(
                                            "w-3 h-3 rounded-sm transition-all duration-200 hover:scale-125 hover:z-10 relative select-none touch-manipulation",
                                            !isCompleted && "bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800",
                                            isCompleted && "shadow-[0_0_8px_-2px_var(--color)]"
                                        )}
                                        style={{
                                            backgroundColor: isCompleted ? displayColor : undefined,
                                            '--color': isCompleted ? displayColor : undefined,
                                            opacity: opacity,
                                            WebkitTapHighlightColor: 'transparent'
                                        } as React.CSSProperties}
                                    />
                                );
                            })}
                        </div>

                        {/* Intensity Legend for Multi-Select */}
                        {selectedHabitIds.length > 1 && (
                            <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-zinc-500">
                                <span>Less</span>
                                {[0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
                                    <div
                                        key={opacity}
                                        className="w-2.5 h-2.5 rounded-[1px]"
                                        style={{
                                            backgroundColor: '#ffffff',
                                            opacity: opacity
                                        }}
                                    />
                                ))}
                                <span>More</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <Tooltip
                content={hoveredTooltip?.content}
                triggerRect={hoveredTooltip?.triggerRect || null}
                isVisible={!!hoveredTooltip}
            />
            {/* Simple Stats Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 mt-4 md:mt-8 pb-4 shrink-0">
                {/* Monthly Performance */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-2 md:p-3">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 md:mb-3 ml-1">Monthly Performance</h3>
                    <div className="flex items-end gap-1 h-16 md:h-24">
                        {monthlyStats.map((stat) => {
                            const maxPossible = 31; // Approximate max for scaling
                            const heightPercent = Math.max(4, Math.round((stat.count / maxPossible) * 100)); // Min 4% height

                            return (
                                <div key={stat.monthIndex} className="flex-1 flex flex-col items-center gap-1 group h-full">
                                    <div className="w-full bg-zinc-800/50 rounded-sm relative flex-1 w-full flex items-end overflow-hidden group-hover:bg-zinc-800 transition-colors">
                                        <div
                                            className="w-full transition-all duration-500 ease-out"
                                            style={{
                                                height: `${heightPercent}%`,
                                                backgroundColor: stat.count > 0 ? (selectedHabitIds.length > 1 ? '#ffffff' : primaryHabit.color) : undefined,
                                                opacity: stat.count > 0 ? 0.8 : 0
                                            }}
                                        />
                                    </div>
                                    <span className="text-[8px] text-zinc-600 font-medium uppercase">{format(new Date(year, stat.monthIndex, 1), 'MMM').slice(0, 1)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Weekday Frequency */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-2 md:p-3">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 md:mb-3 ml-1">Weekday Frequency</h3>
                    <div className="flex items-end gap-1 h-16 md:h-24">
                        {weekdayStats.map((stat) => {
                            const dayName = format(new Date(2024, 0, 7 + stat.dayIndex), 'EEEEE'); // S, M, T...
                            const maxPossible = stat.total || 52;
                            const heightPercent = Math.max(4, Math.round((stat.count / maxPossible) * 100));

                            return (
                                <div key={stat.dayIndex} className="flex-1 flex flex-col items-center gap-1 group h-full">
                                    <div className="w-full bg-zinc-800/50 rounded-sm relative flex-1 w-full flex items-end overflow-hidden group-hover:bg-zinc-800 transition-colors">
                                        <div
                                            className="w-full transition-all duration-500 ease-out"
                                            style={{
                                                height: `${heightPercent}%`,
                                                backgroundColor: stat.count > 0 ? (selectedHabitIds.length > 1 ? '#ffffff' : primaryHabit.color) : undefined,
                                                opacity: stat.count > 0 ? 0.8 : 0
                                            }}
                                        />
                                    </div>
                                    <span className="text-[8px] text-zinc-600 font-medium">{dayName}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Advanced Stats Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 pb-4 shrink-0">
                {/* Quarterly Progress */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-2 md:p-3">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 md:mb-3 ml-1">Quarterly Progress</h3>
                    <div className="flex items-end gap-1 h-16 md:h-24">
                        {quarterlyStats.map((stat) => {
                            const heightPercent = Math.max(4, Math.round((stat.count / stat.total) * 100));

                            return (
                                <div key={stat.label} className="flex-1 flex flex-col items-center gap-1 group h-full">
                                    <div className="w-full bg-zinc-800/50 rounded-sm relative flex-1 w-full flex items-end overflow-hidden group-hover:bg-zinc-800 transition-colors">
                                        <div
                                            className="w-full transition-all duration-500 ease-out"
                                            style={{
                                                height: `${heightPercent}%`,
                                                backgroundColor: stat.count > 0 ? (selectedHabitIds.length > 1 ? '#ffffff' : primaryHabit.color) : undefined,
                                                opacity: stat.count > 0 ? 0.8 : 0
                                            }}
                                        />
                                    </div>
                                    <span className="text-[8px] text-zinc-600 font-medium">{stat.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Streak Distribution */}
                <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-lg p-2 md:p-3">
                    <h3 className="text-xs font-medium text-zinc-400 mb-2 md:mb-3 ml-1">Streak Distribution</h3>
                    <div className="flex items-end gap-1 h-16 md:h-24">
                        {(() => {
                            const maxCount = Math.max(...streakStats.map(b => b.count)) || 1;
                            return streakStats.map((bucket) => {
                                const heightPercent = Math.max(4, Math.round((bucket.count / maxCount) * 100));
                                return (
                                    <div key={bucket.label} className="flex-1 flex flex-col items-center gap-1 group h-full">
                                        <div className="w-full bg-zinc-800/50 rounded-sm relative flex-1 w-full flex items-end overflow-hidden group-hover:bg-zinc-800 transition-colors">
                                            <div
                                                className="w-full transition-all duration-500 ease-out"
                                                style={{
                                                    height: `${heightPercent}%`,
                                                    backgroundColor: bucket.count > 0 ? (selectedHabitIds.length > 1 ? '#ffffff' : primaryHabit.color) : undefined,
                                                    opacity: bucket.count > 0 ? 0.8 : 0
                                                }}
                                            />
                                        </div>
                                        <span className="text-[8px] text-zinc-600 font-medium">{bucket.label}</span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}
