export interface CalendarGroup {
    id: string;
    userId?: string; // Firebase user ID for data scoping
    name: string;
    color?: string;
    order?: number;
}

export interface Habit {
    id: string;
    userId?: string; // Firebase user ID for data scoping
    calendarId: string;
    name: string;
    emoji?: string;
    color: string;
    order?: number;
}

export type HabitLog = Record<string, string[]>; // Date string (YYYY-MM-DD) -> Array of Habit IDs
