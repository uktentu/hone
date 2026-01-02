import { useState, useEffect, useMemo } from 'react';
import type { Habit, HabitLog, CalendarGroup } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

const STORAGE_KEY_HABITS = 'hone_habits';
const STORAGE_KEY_LOGS = 'hone_logs';
const STORAGE_KEY_CALENDARS = 'hone_calendars';

const DEFAULT_CALENDARS: CalendarGroup[] = [
    { id: 'default', name: 'My Calendar' }
];

const DEFAULT_HABITS: Habit[] = [
    { id: '1', calendarId: 'default', name: 'Work', emoji: '💼', color: '#667eea' },
    { id: '2', calendarId: 'default', name: 'Exercise', emoji: '💪', color: '#f5576c' },
    { id: '3', calendarId: 'default', name: 'Reading', emoji: '📚', color: '#4facfe' },
    { id: '4', calendarId: 'default', name: 'Code', emoji: '💻', color: '#00f2fe' },
];

export interface HabitStats {
    totalDays: number;
    currentStreak: number;
    longestStreak: number;
    thisWeek: number;
    thisMonth: number;
    completionRate: number;
}

export function useHabits() {
    const [calendars, setCalendars] = useState<CalendarGroup[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_CALENDARS);
            return stored ? JSON.parse(stored) : DEFAULT_CALENDARS;
        } catch (e) {
            console.error('Failed to parse calendars from storage', e);
            return DEFAULT_CALENDARS;
        }
    });

    const [habits, setHabits] = useState<Habit[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_HABITS);
            return stored ? JSON.parse(stored) : DEFAULT_HABITS;
        } catch (e) {
            console.error('Failed to parse habits from storage', e);
            return DEFAULT_HABITS;
        }
    });

    const [logs, setLogs] = useState<HabitLog>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_LOGS);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.error('Failed to parse logs from storage', e);
            return {};
        }
    });

    const [selectedCalendarId, setSelectedCalendarId] = useState<string>(calendars[0]?.id || 'default');

    // Select first habit of the selected calendar by default if none selected
    const filteredHabits = useMemo(() =>
        habits.filter(h => h.calendarId === selectedCalendarId),
        [habits, selectedCalendarId]);

    const [selectedHabitId, setSelectedHabitId] = useState<string | null>(filteredHabits[0]?.id || null);

    // Ensure selected habit is valid for current calendar
    useEffect(() => {
        if (selectedHabitId) {
            const habit = habits.find(h => h.id === selectedHabitId);
            if (habit && habit.calendarId !== selectedCalendarId) {
                setSelectedHabitId(filteredHabits[0]?.id || null);
            }
        } else if (filteredHabits.length > 0) {
            setSelectedHabitId(filteredHabits[0].id);
        }
    }, [selectedCalendarId, filteredHabits, habits]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_CALENDARS, JSON.stringify(calendars));
    }, [calendars]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_HABITS, JSON.stringify(habits));
    }, [habits]);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    }, [logs]);

    const addCalendar = (name: string, color?: string) => {
        const newCalendar: CalendarGroup = {
            id: crypto.randomUUID(),
            name,
            color
        };
        setCalendars([...calendars, newCalendar]);
        setSelectedCalendarId(newCalendar.id);
    };

    const editCalendar = (id: string, name: string, color?: string) => {
        setCalendars(calendars.map(c => c.id === id ? { ...c, name, color } : c));
    };

    const deleteCalendar = (id: string) => {
        if (calendars.length <= 1) return; // Prevent deleting last calendar
        const updatedCalendars = calendars.filter(c => c.id !== id);
        setCalendars(updatedCalendars);

        // Also delete habits associated with this calendar
        const updatedHabits = habits.filter(h => h.calendarId !== id);
        setHabits(updatedHabits);

        if (selectedCalendarId === id) {
            setSelectedCalendarId(updatedCalendars[0].id);
        }
    };

    const addHabit = (name: string, emoji: string, color: string) => {
        const newHabit: Habit = {
            id: crypto.randomUUID(),
            calendarId: selectedCalendarId,
            name,
            emoji: emoji || '📝',
            color,
        };
        setHabits([...habits, newHabit]);
        setSelectedHabitId(newHabit.id);
    };

    const deleteHabit = (id: string) => {
        const updatedHabits = habits.filter(h => h.id !== id);
        setHabits(updatedHabits);
        if (selectedHabitId === id) {
            // Find next available habit in the same calendar
            const remainingInCalendar = updatedHabits.filter(h => h.calendarId === selectedCalendarId);
            setSelectedHabitId(remainingInCalendar.length > 0 ? remainingInCalendar[0].id : null);
        }
    };

    const toggleHabitForDate = (date: Date, habitId: string) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        console.log('Toggling habit:', { dateKey, habitId });
        setLogs(prev => {
            const currentHabits = prev[dateKey] || [];
            const updatedHabits = currentHabits.includes(habitId)
                ? currentHabits.filter(id => id !== habitId)
                : [...currentHabits, habitId];

            return {
                ...prev,
                [dateKey]: updatedHabits
            };
        });
    };

    const toggleHabitSelection = (habitId: string) => {
        setSelectedHabitId(habitId);
    };

    const isHabitCompleted = (date: Date, habitId: string) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return logs[dateKey]?.includes(habitId) || false;
    };

    const editHabit = (id: string, updates: Partial<Omit<Habit, 'id' | 'calendarId'>>) => {
        setHabits(habits.map(h => h.id === id ? { ...h, ...updates } : h));
    };

    // Calculate statistics for a habit
    const getHabitStats = (habitId: string): HabitStats => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get all dates and normalize them to midnight
        const allDates = Object.keys(logs)
            .filter(dateKey => logs[dateKey].includes(habitId))
            .map(dateKey => {
                const [y, m, d] = dateKey.split('-').map(Number);
                return new Date(y, m - 1, d);
            })
            .sort((a, b) => b.getTime() - a.getTime());

        const totalDays = allDates.length;
        console.log('Stats Debug:', { habitId, allDates: allDates.map(d => format(d, 'yyyy-MM-dd')) });

        // Calculate current streak (from today backwards)
        let currentStreak = 0;
        let checkDate = new Date(today);
        for (let i = 0; i < 365; i++) {
            const dateKey = format(checkDate, 'yyyy-MM-dd');
            if (logs[dateKey]?.includes(habitId)) {
                currentStreak++;
                checkDate = subDays(checkDate, 1);
            } else {
                break;
            }
        }

        // Calculate longest streak
        let longestStreak = 0;
        if (allDates.length > 0) {
            let tempStreak = 1;
            for (let i = 1; i < allDates.length; i++) {
                const daysDiff = differenceInDays(allDates[i - 1], allDates[i]);
                if (daysDiff === 1) {
                    // Consecutive days
                    tempStreak++;
                } else {
                    // Streak broken
                    longestStreak = Math.max(longestStreak, tempStreak);
                    tempStreak = 1;
                }
            }
            longestStreak = Math.max(longestStreak, tempStreak);
        }

        // This week
        const weekStart = startOfWeek(today);
        const weekEnd = endOfWeek(today);
        const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
        const thisWeek = weekDays.filter(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            return logs[dateKey]?.includes(habitId);
        }).length;

        // This month
        const monthStart = startOfMonth(today);
        const monthEnd = endOfMonth(today);
        const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
        const thisMonth = monthDays.filter(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            return logs[dateKey]?.includes(habitId);
        }).length;

        // Completion rate (last 30 days)
        const last30Days = eachDayOfInterval({
            start: subDays(today, 29),
            end: today
        });
        const completedLast30 = last30Days.filter(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            return logs[dateKey]?.includes(habitId);
        }).length;
        const completionRate = last30Days.length > 0
            ? (completedLast30 / last30Days.length) * 100
            : 0;

        return {
            totalDays,
            currentStreak,
            longestStreak,
            thisWeek,
            thisMonth,
            completionRate: Math.round(completionRate)
        };
    };

    const selectedHabitStats = useMemo(() => {
        if (!selectedHabitId) return null;
        return getHabitStats(selectedHabitId);
    }, [selectedHabitId, logs]);

    return {
        habitData: { // Group related logic
            habits: filteredHabits, // Expose filtered list
            allHabits: habits,
            logs
        },
        calendarData: {
            calendars,
            selectedCalendarId,
            addCalendar,
            editCalendar,
            deleteCalendar,
            selectCalendar: setSelectedCalendarId
        },
        selection: {
            selectedHabitId,
            selectedHabitStats,
            toggleHabitSelection
        },
        actions: {
            addHabit,
            editHabit,
            deleteHabit,
            toggleHabitForDate,
            isHabitCompleted
        }
    };
}
