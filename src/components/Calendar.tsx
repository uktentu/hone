import { useState } from 'react';
import {
    addYears,
    subYears,
    format,
    isToday,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import { YearView } from './YearView';
import { GraphView } from './GraphView';
import type { Habit, HabitLog } from '../types';
import type { HabitStats } from '../hooks/useHabits';

interface CalendarProps {
    habits: Habit[];
    selectedHabitIds: string[];
    selectedHabitStats: HabitStats | null;
    onToggleHabit: (date: Date, habitId: string) => void;
    onToggleHabits: (date: Date, habitIds: string[]) => void;
    isHabitCompleted: (date: Date, habitId: string) => boolean;
    logs: HabitLog;
}

type ViewMode = 'year' | 'graph';

export function Calendar({ habits, selectedHabitIds, selectedHabitStats, onToggleHabit, onToggleHabits, isHabitCompleted, logs }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('year');

    const selectedHabits = habits.filter(h => selectedHabitIds.includes(h.id));
    const isMultiSelect = selectedHabits.length > 1;

    // ... (imports and other lines remain)

    const next = () => {
        setCurrentDate(addYears(currentDate, 1));
    };

    const prev = () => {
        setCurrentDate(subYears(currentDate, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    const getTitle = () => {
        return format(currentDate, 'yyyy');
    };

    const [confirmingAction, setConfirmingAction] = useState<{ date: Date, habitId?: string, habitIds?: string[] } | null>(null);

    const handleToggleHabit = (date: Date, habitId: string) => {
        if (isMultiSelect) {
            // Batch toggle: Always confirm
            setConfirmingAction({ date, habitIds: selectedHabitIds });
        } else {
            // Single toggle: Confirm only if not today
            if (isToday(date)) {
                onToggleHabit(date, habitId);
            } else {
                setConfirmingAction({ date, habitId });
            }
        }
    };

    const confirmToggle = () => {
        if (confirmingAction) {
            if (confirmingAction.habitIds) {
                onToggleHabits(confirmingAction.date, confirmingAction.habitIds);
            } else if (confirmingAction.habitId) {
                onToggleHabit(confirmingAction.date, confirmingAction.habitId);
            }
            setConfirmingAction(null);
        }
    };

    return (
        <main className="flex-1 h-full overflow-hidden flex flex-col relative bg-zinc-950" aria-label="Calendar view">
            {/* Header */}
            <header className="flex flex-col gap-3 px-4 py-3 shrink-0 border-b border-zinc-900 bg-zinc-950">
                {/* ... (Header content unchanged) ... */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight text-white">
                                {getTitle()}
                            </h1>
                            <span className="text-xs text-zinc-500">|</span>
                            <p className="text-xs text-zinc-400 tracking-wide">
                                {selectedHabits.length > 0
                                    ? (isMultiSelect ? `${selectedHabits.length} habits selected` : selectedHabits[0].name)
                                    : habits.length === 0
                                        ? 'Create a habit'
                                        : 'Select a habit'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="flex bg-zinc-900/50 rounded-md p-1 border border-zinc-900">
                            {(['year', 'graph'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    aria-label={`${mode} view`}
                                    aria-pressed={viewMode === mode}
                                    className={clsx(
                                        "px-3 py-1 rounded text-[10px] font-medium transition-all duration-200 capitalize",
                                        viewMode === mode
                                            ? "bg-zinc-800 text-white"
                                            : "text-zinc-500 hover:text-zinc-300"
                                    )}
                                >
                                    {mode}
                                </button>
                            ))}
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-1 bg-zinc-900/50 rounded-md p-1 border border-zinc-900">
                            <button
                                onClick={prev}
                                aria-label="Previous"
                                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-all"
                            >
                                <ChevronLeft size={14} />
                            </button>
                            <button
                                onClick={goToToday}
                                aria-label="Go to today"
                                className="px-2 py-1 text-[10px] font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                            >
                                Today
                            </button>
                            <button
                                onClick={next}
                                aria-label="Next"
                                className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-all"
                            >
                                <ChevronRight size={14} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistics - Compact & Monochrome */}
                {selectedHabits.length > 0 && selectedHabitStats && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                        {!isMultiSelect && (
                            <>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Current</span>
                                    <span className="text-sm font-bold text-white">{selectedHabitStats.currentStreak}<span className="text-[10px] font-normal text-zinc-600 ml-0.5">d</span></span>
                                </div>
                                <div className="hidden sm:block w-px h-3 bg-zinc-800" />
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Best</span>
                                    <span className="text-sm font-bold text-white">{selectedHabitStats.longestStreak}<span className="text-[10px] font-normal text-zinc-600 ml-0.5">d</span></span>
                                </div>
                                <div className="hidden sm:block w-px h-3 bg-zinc-800" />
                            </>
                        )}
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Week</span>
                            <span className="text-sm font-bold text-white">
                                {selectedHabitStats.thisWeek}
                                {!isMultiSelect && <span className="text-[10px] font-normal text-zinc-600 ml-0.5">/7</span>}
                            </span>
                        </div>
                        <div className="hidden sm:block w-px h-3 bg-zinc-800" />
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Month</span>
                            <span className="text-sm font-bold text-white">{selectedHabitStats.thisMonth}<span className="text-[10px] font-normal text-zinc-600 ml-0.5">d</span></span>
                        </div>
                        <div className="hidden sm:block w-px h-3 bg-zinc-800" />
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Rate</span>
                            <span className="text-sm font-bold text-white">{selectedHabitStats.completionRate}<span className="text-[10px] font-normal text-zinc-600 ml-0.5">%</span></span>
                        </div>
                    </div>
                )}
            </header>

            {/* Content */}
            <div className="flex-1 overflow-hidden px-4 pb-4 flex flex-col">
                <div className="max-w-full mx-auto w-full h-full flex flex-col">
                    {viewMode === 'year' && (
                        <YearView
                            year={currentDate.getFullYear()}
                            habits={habits}
                            selectedHabitIds={selectedHabitIds}
                            onToggleHabit={handleToggleHabit}
                            isHabitCompleted={isHabitCompleted}
                        />
                    )}

                    {viewMode === 'graph' && (
                        <GraphView
                            year={currentDate.getFullYear()}
                            habits={habits}
                            selectedHabitIds={selectedHabitIds}
                            isHabitCompleted={isHabitCompleted}
                            logs={logs}
                        />
                    )}
                </div>
            </div>
            {/* Confirmation Modal */}
            {confirmingAction && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 shadow-2xl max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200">
                        <h3 className="text-white font-bold text-lg mb-2">Confirm Change</h3>
                        <p className="text-zinc-400 text-sm mb-5">
                            {confirmingAction.habitIds ? (
                                <>
                                    Are you sure you want to update <span className="text-white font-medium">{confirmingAction.habitIds.length}</span> habits for <span className="text-white font-medium">{format(confirmingAction.date, 'MMMM do, yyyy')}</span>?
                                </>
                            ) : (
                                <>
                                    Are you sure you want to update the habit status for <span className="text-white font-medium">{format(confirmingAction.date, 'MMMM do, yyyy')}</span>?
                                </>
                            )}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setConfirmingAction(null)}
                                className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmToggle}
                                className="px-3 py-1.5 text-xs font-bold bg-white text-black hover:bg-zinc-200 rounded transition-all"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
