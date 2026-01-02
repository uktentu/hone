export interface CalendarGroup {
    id: string;
    name: string;
    color?: string;
}

export interface Habit {
    id: string;
    calendarId: string;
    name: string;
    emoji?: string;
    color: string;
}

export type HabitLog = Record<string, string[]>; // Date string (YYYY-MM-DD) -> Array of Habit IDs
