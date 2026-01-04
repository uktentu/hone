import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Habit, HabitLog, CalendarGroup } from '../types';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_CALENDARS: Omit<CalendarGroup, 'id' | 'userId'>[] = [
    { name: 'My Calendar' }
];

const DEFAULT_HABITS: Omit<Habit, 'id' | 'userId'>[] = [
    { calendarId: 'default', name: 'Work', emoji: '💼', color: '#667eea' },
    { calendarId: 'default', name: 'Exercise', emoji: '💪', color: '#f5576c' },
    { calendarId: 'default', name: 'Reading', emoji: '📚', color: '#4facfe' },
    { calendarId: 'default', name: 'Code', emoji: '💻', color: '#00f2fe' },
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
    const { currentUser } = useAuth();
    const [calendars, setCalendars] = useState<CalendarGroup[]>([]);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<HabitLog>({});
    const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');
    const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
    const [initialized, setInitialized] = useState(false);

    // Setup Firestore real-time listeners
    useEffect(() => {
        if (!currentUser) return;

        const userId = currentUser.uid;

        // Listen to calendars
        const calendarsQuery = query(
            collection(db, 'calendars'),
            where('userId', '==', userId)
        );
        const unsubCalendars = onSnapshot(calendarsQuery, async (snapshot) => {
            const calendarData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as CalendarGroup));

            // Initialize with default calendar if empty
            if (calendarData.length === 0 && !initialized) {
                const defaultCalId = await addDoc(collection(db, 'calendars'), {
                    ...DEFAULT_CALENDARS[0],
                    userId
                });
                setSelectedCalendarId(defaultCalId.id);
                setInitialized(true);
            } else {
                setCalendars(calendarData);
                if (!selectedCalendarId && calendarData.length > 0) {
                    // Sort by order when setting initial selection
                    const sorted = [...calendarData].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
                    setSelectedCalendarId(sorted[0].id);
                }
                setCalendars(calendarData.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
            }
        });

        // Listen to habits
        const habitsQuery = query(
            collection(db, 'habits'),
            where('userId', '==', userId)
        );
        const unsubHabits = onSnapshot(habitsQuery, async (snapshot) => {
            const habitData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Habit));

            // Initialize with default habits if empty and we have a calendar
            if (habitData.length === 0 && !initialized && calendars.length > 0) {
                for (const habit of DEFAULT_HABITS) {
                    await addDoc(collection(db, 'habits'), {
                        ...habit,
                        userId,
                        calendarId: calendars[0].id
                    });
                }
                setInitialized(true);
            } else {
                setHabits(habitData);
            }
        });

        // Listen to logs
        const logsQuery = query(
            collection(db, 'logs'),
            where('userId', '==', userId)
        );
        const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
            const logData: HabitLog = {};
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                logData[data.date] = data.habitIds || [];
            });
            setLogs(logData);
        });

        return () => {
            unsubCalendars();
            unsubHabits();
            unsubLogs();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser, initialized]);

    // Sort habits by order
    const filteredHabits = useMemo(() => {
        return habits
            .filter(h => h.calendarId === selectedCalendarId)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }, [habits, selectedCalendarId]);

    // Auto-select first habit when calendar changes
    useEffect(() => {
        if (selectedHabitIds.length > 0) {
            // Check if selected habits belong to current calendar
            const validIds = selectedHabitIds.filter(id => habits.find(h => h.id === id)?.calendarId === selectedCalendarId);
            if (validIds.length === 0 && filteredHabits.length > 0) {
                setSelectedHabitIds([filteredHabits[0].id]);
            } else if (validIds.length !== selectedHabitIds.length) {
                setSelectedHabitIds(validIds.length > 0 ? validIds : (filteredHabits[0] ? [filteredHabits[0].id] : []));
            }
        } else if (filteredHabits.length > 0) {
            setSelectedHabitIds([filteredHabits[0].id]);
        }
    }, [selectedCalendarId, filteredHabits, habits, selectedHabitIds]);

    const addCalendar = async (name: string, color?: string) => {
        if (!currentUser) return;

        // Calculate next order
        const maxOrder = Math.max(...calendars.map(c => c.order ?? 0), 0);

        const newCalendar = {
            name,
            color,
            userId: currentUser.uid,
            order: maxOrder + 1
        };
        const docRef = await addDoc(collection(db, 'calendars'), newCalendar);
        setSelectedCalendarId(docRef.id);
    };

    const reorderCalendars = async (activeId: string, overId: string) => {
        const oldIndex = calendars.findIndex(c => c.id === activeId);
        const newIndex = calendars.findIndex(c => c.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newCalendars = [...calendars];
            const [movedCalendar] = newCalendars.splice(oldIndex, 1);
            newCalendars.splice(newIndex, 0, movedCalendar);

            // Update all affected calendars in Firestore
            newCalendars.forEach((cal, index) => {
                if (cal.order !== index + 1) {
                    const calRef = doc(db, 'calendars', cal.id);
                    updateDoc(calRef, { order: index + 1 });
                }
            });
        }
    };

    const editCalendar = async (id: string, name: string, color?: string) => {
        const calendarRef = doc(db, 'calendars', id);
        await updateDoc(calendarRef, { name, color });
    };

    const deleteCalendar = async (id: string) => {
        if (calendars.length <= 1) return;

        // Delete calendar
        await deleteDoc(doc(db, 'calendars', id));

        // Delete associated habits
        const habitsToDelete = habits.filter(h => h.calendarId === id);
        for (const habit of habitsToDelete) {
            await deleteDoc(doc(db, 'habits', habit.id));
        }

        if (selectedCalendarId === id) {
            const remaining = calendars.filter(c => c.id !== id);
            setSelectedCalendarId(remaining[0]?.id || '');
        }
    };

    const addHabit = async (name: string, emoji: string, color: string) => {
        if (!currentUser) return;

        // Calculate next order value
        const currentCalendarHabits = habits.filter(h => h.calendarId === selectedCalendarId);
        const maxOrder = Math.max(...currentCalendarHabits.map(h => h.order ?? 0), 0);

        const newHabit = {
            name,
            emoji: emoji || '📝',
            color,
            calendarId: selectedCalendarId,
            userId: currentUser.uid,
            order: maxOrder + 1
        };
        const docRef = await addDoc(collection(db, 'habits'), newHabit);
        setSelectedHabitIds([docRef.id]);
    };

    const editHabit = async (id: string, updates: Partial<Omit<Habit, 'id' | 'userId' | 'calendarId'>>) => {
        const habitRef = doc(db, 'habits', id);
        await updateDoc(habitRef, updates);
    };

    const reorderHabits = async (activeId: string, overId: string) => {
        const oldIndex = filteredHabits.findIndex(h => h.id === activeId);
        const newIndex = filteredHabits.findIndex(h => h.id === overId);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newHabits = [...filteredHabits];
            const [movedHabit] = newHabits.splice(oldIndex, 1);
            newHabits.splice(newIndex, 0, movedHabit);

            // Update all affected habits in Firestore
            newHabits.forEach((habit, index) => {
                if (habit.order !== index + 1) {
                    const habitRef = doc(db, 'habits', habit.id);
                    updateDoc(habitRef, { order: index + 1 });
                }
            });
        }
    };

    const deleteHabit = async (id: string) => {
        await deleteDoc(doc(db, 'habits', id));
        if (selectedHabitIds.includes(id)) {
            const remaining = habits.filter(h => h.id !== id && h.calendarId === selectedCalendarId);
            setSelectedHabitIds(remaining.length > 0 ? [remaining[0].id] : []);
        }
    };

    const toggleHabitForDate = async (date: Date, habitId: string) => {
        if (!currentUser) return;
        const dateKey = format(date, 'yyyy-MM-dd');
        const currentHabits = logs[dateKey] || [];
        const updatedHabits = currentHabits.includes(habitId)
            ? currentHabits.filter(id => id !== habitId)
            : [...currentHabits, habitId];

        // Use setDoc with merge to create or update
        const logRef = doc(db, 'logs', `${currentUser.uid}_${dateKey}`);
        await setDoc(logRef, {
            date: dateKey,
            habitIds: updatedHabits,
            userId: currentUser.uid
        }, { merge: true });
    };

    const toggleHabitsForDate = async (date: Date, habitIds: string[]) => {
        if (!currentUser || habitIds.length === 0) return;
        const dateKey = format(date, 'yyyy-MM-dd');
        const currentHabits = logs[dateKey] || [];

        // Check if ANY of the target habits are NOT completed
        const anyIncomplete = habitIds.some(id => !currentHabits.includes(id));

        let updatedHabits: string[];
        if (anyIncomplete) {
            // Mark ALL as completed (merge unique)
            const newIds = habitIds.filter(id => !currentHabits.includes(id));
            updatedHabits = [...currentHabits, ...newIds];
        } else {
            // Mark ALL as incomplete (remove target habits)
            updatedHabits = currentHabits.filter(id => !habitIds.includes(id));
        }

        const logRef = doc(db, 'logs', `${currentUser.uid}_${dateKey}`);
        await setDoc(logRef, {
            date: dateKey,
            habitIds: updatedHabits,
            userId: currentUser.uid
        }, { merge: true });
    };

    const isHabitCompleted = (date: Date, habitId: string) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return logs[dateKey]?.includes(habitId) || false;
    };

    const toggleHabitSelection = (habitId: string, multiSelect: boolean = false) => {
        setSelectedHabitIds(prev => {
            if (!multiSelect) return [habitId];
            if (prev.includes(habitId)) {
                // Determine behavior for deselecting: if it's the only one, don't deselect (optional, but safer)
                // Actually, let's allow deselecting as long as at least one remains? Or just toggle.
                // If we deselect the last one, maybe select nothing? Or default back to first?
                // Let's standard toggle behavior.
                const newVal = prev.filter(id => id !== habitId);
                return newVal.length === 0 ? [habitId] : newVal; // Prevent empty selection for now
            }
            return [...prev, habitId];
        });
    };

    const getHabitStats = useCallback((habitIds: string[]): HabitStats => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Basic aggregation
        let totalDays = 0;
        let thisWeek = 0;
        let thisMonth = 0;
        let totalCompletionRate = 0;

        // Streaks only make sense for single selection effectively
        let currentStreak = 0;
        let longestStreak = 0;

        // If single habit, calculate fully. If multiple, aggregate counts and avg rate.

        if (habitIds.length === 1) {
            const habitId = habitIds[0];
            const allDates = Object.keys(logs)
                .filter(dateKey => logs[dateKey].includes(habitId))
                .map(dateKey => {
                    const [y, m, d] = dateKey.split('-').map(Number);
                    return new Date(y, m - 1, d);
                })
                .sort((a, b) => b.getTime() - a.getTime());

            totalDays = allDates.length;

            // Current streak
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

            // Longest streak
            if (allDates.length > 0) {
                let tempStreak = 1;
                for (let i = 1; i < allDates.length; i++) {
                    const daysDiff = differenceInDays(allDates[i - 1], allDates[i]);
                    if (daysDiff === 1) {
                        tempStreak++;
                    } else {
                        longestStreak = Math.max(longestStreak, tempStreak);
                        tempStreak = 1;
                    }
                }
                longestStreak = Math.max(longestStreak, tempStreak);
            }

            // Week/Month
            const weekStart = startOfWeek(today);
            const weekEnd = endOfWeek(today);
            const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
            thisWeek = weekDays.filter(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                return logs[dateKey]?.includes(habitId);
            }).length;

            const monthStart = startOfMonth(today);
            const monthEnd = endOfMonth(today);
            const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
            thisMonth = monthDays.filter(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                return logs[dateKey]?.includes(habitId);
            }).length;

            // Rate
            const last30Days = eachDayOfInterval({
                start: subDays(today, 29),
                end: today
            });
            const completedLast30 = last30Days.filter(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                return logs[dateKey]?.includes(habitId);
            }).length;
            totalCompletionRate = last30Days.length > 0
                ? (completedLast30 / last30Days.length) * 100
                : 0;

        } else {
            // Multi-habit aggregation
            // We can sum counts? Or average?
            // User asked: "selecting multiple habits that updates the stats and progress"
            // Summing week/month makes sense. Rate should be average.

            habitIds.forEach(habitId => {
                // Week
                const weekStart = startOfWeek(today);
                const weekEnd = endOfWeek(today);
                const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
                thisWeek += weekDays.filter(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    return logs[dateKey]?.includes(habitId);
                }).length;

                // Month
                const monthStart = startOfMonth(today);
                const monthEnd = endOfMonth(today);
                const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
                thisMonth += monthDays.filter(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    return logs[dateKey]?.includes(habitId);
                }).length;

                // Rate
                const last30Days = eachDayOfInterval({
                    start: subDays(today, 29),
                    end: today
                });
                const completedLast30 = last30Days.filter(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    return logs[dateKey]?.includes(habitId);
                }).length;
                totalCompletionRate += last30Days.length > 0
                    ? (completedLast30 / last30Days.length) * 100
                    : 0;
            });

            if (habitIds.length > 0) {
                totalCompletionRate = totalCompletionRate / habitIds.length;
            }
        }

        return {
            totalDays, // Not aggregated for multi
            currentStreak, // Not aggregated for multi
            longestStreak, // Not aggregated for multi
            thisWeek,
            thisMonth,
            completionRate: Math.round(totalCompletionRate)
        };
    }, [logs]);

    const selectedHabitStats = useMemo(() => {
        if (selectedHabitIds.length === 0) return null;
        return getHabitStats(selectedHabitIds);
    }, [selectedHabitIds, getHabitStats]);

    return {
        habitData: {
            habits: filteredHabits,
            allHabits: habits,
            logs
        },
        calendarData: {
            calendars,
            selectedCalendarId,
            addCalendar,
            editCalendar,
            deleteCalendar,
            reorderCalendars,
            selectCalendar: setSelectedCalendarId
        },
        selection: {
            selectedHabitIds,
            selectedHabitStats,
            toggleHabitSelection
        },
        actions: {
            addHabit,
            editHabit,
            reorderHabits,
            deleteHabit,
            toggleHabitForDate,
            toggleHabitsForDate,
            isHabitCompleted
        }
    };
}
