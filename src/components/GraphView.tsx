import { eachDayOfInterval, endOfYear, format, getDay, startOfYear, differenceInDays } from 'date-fns';
import { useMemo } from 'react';
import clsx from 'clsx';
import type { Habit, HabitLog } from '../types';

interface GraphViewProps {
    year: number;
    habits: Habit[];
    selectedHabitId: string | null;
    isHabitCompleted: (date: Date, habitId: string) => boolean;
    logs: HabitLog;
}

export function GraphView({ year, habits, selectedHabitId, isHabitCompleted, logs }: GraphViewProps) {
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(yearStart);
    const days = eachDayOfInterval({ start: yearStart, end: yearEnd });

    const startDay = getDay(yearStart);
    const emptyDaysBefore = Array(startDay).fill(null);

    const allCells = [...emptyDaysBefore, ...days];
    const selectedHabit = habits.find(h => h.id === selectedHabitId);

    // Calculate all stats in one memoized block to prevent render issues
    const {
        completedCount,
        percentage,
        monthlyStats,
        weekdayStats,
        quarterlyStats,
        streakStats
    } = useMemo(() => {
        if (!selectedHabitId) return {
            completedCount: 0, percentage: 0, monthlyStats: [], weekdayStats: [], quarterlyStats: [], streakStats: []
        };

        // 1. Basic Stats
        const completedDays = days.filter(day => isHabitCompleted(day, selectedHabitId));
        const completedCount = completedDays.length;
        const percentage = Math.round((completedCount / days.length) * 100);

        // 2. Monthly Stats
        const monthlyStats = Array.from({ length: 12 }).map((_, i) => {
            const monthDays = days.filter(d => d.getMonth() === i);
            const count = monthDays.filter(d => isHabitCompleted(d, selectedHabitId)).length;
            return { monthIndex: i, count };
        });

        // 3. Weekday Stats
        const weekdayStats = [0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
            const targetDay = dayIndex;
            const total = days.filter(d => getDay(d) === targetDay).length;
            const count = days.filter(d => getDay(d) === targetDay && isHabitCompleted(d, selectedHabitId)).length;
            return { dayIndex, count, total };
        });

        // 4. Quarterly Stats
        const quarterlyStats = ['Q1', 'Q2', 'Q3', 'Q4'].map((q, i) => {
            const quarterMonths = [0, 1, 2].map(m => i * 3 + m);
            const quarterDays = days.filter(d => quarterMonths.includes(d.getMonth()));
            const count = quarterDays.filter(d => isHabitCompleted(d, selectedHabitId)).length;
            const total = quarterDays.length;
            return { label: q, count, total };
        });

        // 5. Streak Distribution
        const streaks: number[] = [];
        let current = 0;
        days.forEach(d => {
            if (isHabitCompleted(d, selectedHabitId)) {
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
    }, [days, selectedHabitId, isHabitCompleted, logs]);


    if (habits.length === 0 || !selectedHabitId || !selectedHabit) {
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
                                const isCompleted = isHabitCompleted(day, selectedHabitId);
                                return (
                                    <div
                                        key={day.toISOString()}
                                        title={`${format(day, 'EEEE, MMM d, yyyy')}\n${isCompleted ? 'Completed' : 'No activity'}`}
                                        className={clsx(
                                            "w-3 h-3 rounded-sm transition-all duration-200 cursor-pointer hover:scale-125 hover:z-10 relative",
                                            !isCompleted && "bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800",
                                            isCompleted && "shadow-[0_0_8px_-2px_var(--color)]"
                                        )}
                                        style={{
                                            backgroundColor: isCompleted ? selectedHabit.color : undefined,
                                            '--color': isCompleted ? selectedHabit.color : undefined
                                        } as React.CSSProperties}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
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
                                                backgroundColor: stat.count > 0 ? selectedHabit.color : undefined,
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
                                                backgroundColor: stat.count > 0 ? selectedHabit.color : undefined,
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
                                                backgroundColor: stat.count > 0 ? selectedHabit.color : undefined,
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
                                                    backgroundColor: bucket.count > 0 ? selectedHabit.color : undefined,
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
