import type { Habit, CalendarGroup } from '../types';
import { Plus, Trash2, Edit2, X, Search, Sparkles, Layout, Folder, FolderOpen, LogOut, List } from 'lucide-react';

import clsx from 'clsx';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SidebarProps {
    habits: Habit[];
    calendars: CalendarGroup[];
    selectedCalendarId: string;
    onSelectCalendar: (id: string) => void;
    onAddCalendar: (name: string, color?: string) => void;
    onEditCalendar: (id: string, name: string, color?: string) => void;
    onDeleteCalendar: (id: string) => void;
    onReorderCalendars: (activeId: string, overId: string) => void;
    onAddHabit: (name: string, emoji: string, color: string) => void;
    onEditHabit: (id: string, updates: Partial<Omit<Habit, 'id' | 'calendarId'>>) => void;
    onDeleteHabit: (id: string) => void;
    onReorderHabits: (activeId: string, overId: string) => void;
    onSelectHabit: (id: string, multiSelect: boolean) => void;
    selectedHabitIds: string[]; // Updated prop
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
    currentView?: 'calendar' | 'settings';
    onNavigate?: (view: 'calendar' | 'settings') => void;
}

// Sortable Item Component
function SortableHabitItem({ habit, isEditing, children }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: habit.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
    };

    if (isEditing) {
        return (
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                {children}
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

// Reuse sortable item logic for calendars
function SortableCalendarItem({ id, isEditing, children }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as const,
    };

    if (isEditing) {
        return (
            <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
                {children}
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

// Restored Accent Colors
const PRESET_COLORS = [
    '#ffffff', '#a855f7', '#ec4899', '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#06b6d4', '#3b82f6', '#6366f1', '#d946ef', '#14b8a6', '#8b5cf6'
];

const PRESET_EMOJIS = ['📝', '💼', '💪', '📚', '💻', '🧘', '🏃', '💧', '💤', '🎨', '🎵', '🍳', '🧹', '🪴', '💰', '🧠', '🎯', '🌟', '🔥', '⚡'];

export function Sidebar({
    habits,
    calendars,
    selectedCalendarId,
    onSelectCalendar,
    onAddCalendar,
    onEditCalendar,
    onDeleteCalendar,
    onReorderCalendars,
    onAddHabit,
    onEditHabit,
    onDeleteHabit,
    onReorderHabits,
    onSelectHabit,
    selectedHabitIds,
    currentView,
    onNavigate
}: SidebarProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleHabitDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorderHabits(active.id as string, over.id as string);
        }
    };

    const handleCalendarDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            onReorderCalendars(active.id as string, over.id as string);
        }
    };

    const [isAdding, setIsAdding] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { currentUser, logout } = useAuth();
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        setShowLogoutConfirm(false);
        await logout();
    };

    const resetTour = () => {
        localStorage.removeItem('hone_has_seen_onboarding');
        window.location.reload();
    };


    // Mobile Habit Popup State
    const [showMobileHabits, setShowMobileHabits] = useState(false);

    // Calendar Management State
    const [isAddingCalendar, setIsAddingCalendar] = useState(false);
    const [editingCalendarId, setEditingCalendarId] = useState<string | null>(null);
    const [calendarNameInput, setCalendarNameInput] = useState('');
    const [calendarColor, setCalendarColor] = useState(PRESET_COLORS[0]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState(PRESET_EMOJIS[0]);
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

    // Popover State
    const [activePopover, setActivePopover] = useState<{ type: 'emoji' | 'color' | 'calendar-color', triggerRect: DOMRect } | null>(null);
    const addFormRef = useRef<HTMLFormElement>(null);
    const editFormRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const isInsideAddForm = addFormRef.current?.contains(target);
            const isInsideEditForm = editFormRef.current?.contains(target);
            const isInsidePopover = (target as Element)?.closest?.('.fixed-popover');

            if (activePopover && !isInsideAddForm && !isInsideEditForm && !isInsidePopover) {
                setActivePopover(null);
            }
        };

        if (activePopover) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [activePopover]);

    // Calendar functions
    const startAddingCalendar = () => {
        if (!isExpanded) setIsExpanded(true);
        setCalendarNameInput('');
        setCalendarColor(PRESET_COLORS[0]);
        setIsAddingCalendar(true);
        setEditingCalendarId(null);
    };

    const startEditingCalendar = (cal: CalendarGroup) => {
        if (!isExpanded) setIsExpanded(true);
        setCalendarNameInput(cal.name);
        setCalendarColor(cal.color || PRESET_COLORS[0]);
        setEditingCalendarId(cal.id);
        setIsAddingCalendar(false);
    };

    const handleCalendarSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (calendarNameInput.trim()) {
            if (isAddingCalendar) {
                onAddCalendar(calendarNameInput.trim(), calendarColor);
            } else if (editingCalendarId) {
                onEditCalendar(editingCalendarId, calendarNameInput.trim(), calendarColor);
            }
        }
        setIsAddingCalendar(false);
        setEditingCalendarId(null);
        setCalendarNameInput('');
    };

    const startAdding = () => {
        setEditingId(null);
        setName('');
        setEmoji(PRESET_EMOJIS[0]);
        setColor(PRESET_COLORS[0]);
        setIsAdding(true);
        setActivePopover(null);
    };

    const startEditing = (habit: Habit) => {
        setIsAdding(false);
        setEditingId(habit.id);
        setName(habit.name);
        setEmoji(habit.emoji || '📝');
        setColor(habit.color);
        setActivePopover(null);
    };

    const cancelForm = () => {
        setIsAdding(false);
        setEditingId(null);
        setName('');
        setActivePopover(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        if (!trimmedName) return;

        if (isAdding) {
            onAddHabit(trimmedName, emoji, color);
        } else if (editingId) {
            onEditHabit(editingId, { name: trimmedName, emoji, color });
        }

        cancelForm();
    };

    const handlePopoverTrigger = (e: React.MouseEvent, type: 'emoji' | 'color' | 'calendar-color') => {
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        if (activePopover?.type === type) {
            setActivePopover(null);
        } else {
            setActivePopover({ type, triggerRect: rect });
        }
    };

    const filteredHabits = habits.filter(h =>
        h.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeCalendar = calendars.find(c => c.id === selectedCalendarId) || calendars[0];

    // Safety check for loading state
    if (!activeCalendar && calendars.length === 0) {
        return (
            <div className="md:w-64 border-r border-zinc-900 bg-zinc-950 p-4 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-zinc-800 border-t-white rounded-full animate-spin" />
            </div>
        );
    }


    const habitListContent = (
        <>
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-900 shrink-0 h-[53px] flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <h2 className="text-xs font-bold tracking-tight text-white uppercase truncate max-w-[120px]">
                        {activeCalendar.name}
                    </h2>
                </div>
            </div>

            {/* Sub-header / Search */}
            <div className="px-3 py-2 shrink-0 flex gap-2">
                <div className="flex-1 relative group">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={12} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900 rounded-md pl-7 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-700 transition-all border border-zinc-800"
                    />
                </div>

                {/* Mobile/Toggle Multi-Select Button */}
                <button
                    id="tour-mobile-multiselect"
                    onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                    className={clsx(
                        "p-1.5 border rounded-md transition-all active:scale-95",
                        isMultiSelectMode
                            ? "bg-white text-black border-white"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
                    )}
                    title="Toggle Multi-Select Mode"
                >
                    <List size={14} />
                </button>

                {!isAdding && !editingId && (
                    <button
                        id="tour-sidebar-add"
                        onClick={startAdding}
                        className="p-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-zinc-400 hover:text-white transition-all active:scale-95"
                    >
                        <Plus size={14} />
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-2 py-2 relative custom-scrollbar">

                {isAdding && (
                    <form ref={addFormRef} onSubmit={handleSubmit} className="mb-3 bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 animate-slide-in">
                        <div className="flex items-center gap-2 mb-3">
                            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex-1">New Event</h3>
                            <button
                                type="button"
                                onClick={cancelForm}
                                className="text-zinc-500 hover:text-white transition-colors p-1 hover:bg-zinc-800 rounded"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        <div className="flex gap-1.5 mb-2 relative">
                            {/* Emoji Picker Trigger */}
                            <button
                                type="button"
                                onClick={(e) => handlePopoverTrigger(e, 'emoji')}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md text-sm transition-all active:scale-95"
                            >
                                {emoji}
                            </button>

                            {/* Color Picker Trigger */}
                            <button
                                type="button"
                                onClick={(e) => handlePopoverTrigger(e, 'color')}
                                className="w-8 h-8 flex items-center justify-center bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-md transition-all active:scale-95"
                            >
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                            </button>

                            {/* Input */}
                            <input
                                autoFocus
                                type="text"
                                placeholder="..."
                                className="flex-1 min-w-0 h-8 bg-zinc-900 border border-zinc-800 rounded-md px-2 outline-none text-xs text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-zinc-700 transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
                                    if (e.key === 'Escape') {
                                        cancelForm();
                                    }
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full bg-white hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-black py-1.5 rounded-md text-[10px] uppercase font-bold tracking-wide transition-all active:scale-[0.98]"
                        >
                            Create
                        </button>
                    </form>
                )}

                {filteredHabits.length === 0 && !isAdding && !editingId && (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <p className="text-zinc-500 text-xs mb-3">
                            {searchQuery ? 'No events found' : 'No events yet'}
                        </p>
                        {!searchQuery && (
                            <button
                                onClick={startAdding}
                                className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white text-[10px] font-medium rounded-md transition-all active:scale-95"
                            >
                                First Event
                            </button>
                        )}
                    </div>
                )}

                <div className="space-y-1" id="tour-habit-list">
                    <DndContext
                        id="habits-dnd"
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleHabitDragEnd}
                    >
                        <SortableContext
                            items={filteredHabits.map(h => h.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {filteredHabits.map((habit) => {
                                const isEditing = habit.id === editingId;
                                const isSelected = selectedHabitIds.includes(habit.id);

                                if (isEditing) {
                                    return (
                                        <SortableHabitItem key={habit.id} habit={habit} isSelected={isSelected} isEditing={true}>
                                            <form onSubmit={handleSubmit} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-2 shadow-lg flex flex-col gap-2 animate-slide-in">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => handlePopoverTrigger(e, 'emoji')}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-all text-sm relative"
                                                    >
                                                        {emoji}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => handlePopoverTrigger(e, 'color')}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-all relative"
                                                    >
                                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                                                    </button>

                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        className="flex-1 min-w-0 h-7 bg-zinc-950 px-2 rounded-md text-xs text-white outline-none placeholder:text-zinc-600 border border-zinc-800 focus:border-zinc-600 transition-all"
                                                        value={name}
                                                        onChange={(e) => setName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
                                                            if (e.key === 'Escape') {
                                                                cancelForm();
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={cancelForm}
                                                        className="px-2 py-1 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="submit"
                                                        disabled={!name.trim()}
                                                        className="px-3 py-1 bg-white text-black text-[10px] font-bold rounded hover:bg-zinc-200 transition-all"
                                                    >
                                                        Save
                                                    </button>
                                                </div>
                                            </form>
                                        </SortableHabitItem>
                                    );
                                }

                                return (
                                    <SortableHabitItem key={habit.id} habit={habit} isSelected={isSelected}>
                                        <div
                                            onClick={(e) => {
                                                const isMobile = window.matchMedia('(max-width: 768px)').matches;
                                                const toggleState = e.ctrlKey || e.metaKey || isMultiSelectMode;
                                                onSelectHabit(habit.id, toggleState);

                                                if (isMobile && !isMultiSelectMode && !toggleState) {
                                                    setIsExpanded(false);
                                                    setShowMobileHabits(false);
                                                }
                                            }}
                                            title={habit.name}
                                            style={{
                                                borderColor: isSelected ? (habit.color || '#ffffff') : 'transparent'
                                            }}
                                            className={clsx(
                                                "w-full flex items-center gap-3 p-2 rounded-md transition-all duration-200 group text-left relative overflow-hidden cursor-pointer border",
                                                isSelected
                                                    ? "bg-zinc-900"
                                                    : "hover:bg-zinc-900/50 hover:border-zinc-800/50"
                                            )}
                                        >
                                            {habit.color && (
                                                <div
                                                    className="w-1 h-3.5 rounded-full shrink-0 relative z-10"
                                                    style={{ backgroundColor: habit.color }}
                                                />
                                            )}

                                            <span className="text-sm leading-none relative z-10 -ml-0.5">{habit.emoji || '📝'}</span>

                                            <span className={clsx(
                                                "flex-1 font-medium text-xs truncate transition-colors relative z-10",
                                                isSelected ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"
                                            )}>
                                                {habit.name}
                                            </span>

                                            <div className={clsx(
                                                "flex items-center gap-1 transition-opacity relative z-10",
                                                isSelected ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                            )}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); startEditing(habit); }}
                                                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-all"
                                                >
                                                    <Edit2 size={10} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDeleteHabit(habit.id); }}
                                                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white transition-all"
                                                >
                                                    <Trash2 size={10} />
                                                </button>
                                            </div>
                                        </div>
                                    </SortableHabitItem>
                                );
                            })}
                        </SortableContext>
                    </DndContext>
                </div>
            </div >
        </>
    );

    return (
        <>
            <div className={clsx(
                "flex border-zinc-900 bg-zinc-950 transition-all duration-300 relative shrink-0",
                // Mobile Styles
                "flex-col w-full border-b md:border-b-0",
                isExpanded ? "fixed inset-0 z-[100] h-screen" : "h-[53px] overflow-hidden",
                // Desktop Styles
                "md:static md:h-full md:flex-row md:border-r md:w-auto md:overflow-visible"
            )}>
                {/* Expanded Popover Layer (FIXED) */}
                {activePopover && (
                    <div
                        className="fixed z-[9999] fixed-popover animate-in fade-in zoom-in-95 duration-150"
                        style={{
                            top: activePopover.triggerRect.bottom + 8,
                            left: activePopover.triggerRect.left,
                        }}
                    >
                        {activePopover.type === 'emoji' ? (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-2 grid grid-cols-5 gap-1 w-64 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {PRESET_EMOJIS.map(e => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => { setEmoji(e); setActivePopover(null); }}
                                        className={clsx(
                                            "aspect-square flex items-center justify-center rounded hover:bg-zinc-900 transition-all text-base active:scale-90",
                                            emoji === e && "bg-zinc-800"
                                        )}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-2 grid grid-cols-6 gap-2 w-48">
                                {PRESET_COLORS.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => {
                                            if (activePopover.type === 'calendar-color') {
                                                setCalendarColor(c);
                                            } else {
                                                setColor(c);
                                            }
                                            setActivePopover(null);
                                        }}
                                        className={clsx(
                                            "w-6 h-6 rounded-full transition-all hover:scale-110 border border-zinc-800",
                                            (activePopover.type === 'calendar-color' ? calendarColor === c : color === c) && "ring-2 ring-white ring-offset-2 ring-offset-zinc-950"
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Retractable Calendar Rail */}
                <div className={clsx(
                    "flex flex-col border-zinc-900 bg-zinc-950 transition-all duration-300 relative z-20 shrink-0",
                    // Mobile
                    "w-full border-b md:border-b-0",
                    // Desktop
                    "md:h-full md:border-r",
                    // Desktop Width Logic (only applies on md+)
                    isExpanded ? "md:w-64" : "md:w-14"
                )}>
                    <div className="p-3 flex items-center gap-3 border-b border-zinc-900 h-[53px]">
                        <button
                            id="tour-mobile-sidebar-toggle"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1.5 hover:bg-zinc-900 rounded-md text-zinc-400 transition-colors shrink-0"
                        >
                            <X size={20} className={clsx("md:hidden", !isExpanded && "hidden")} />
                            <Layout size={20} className={clsx(isExpanded && "hidden md:block")} />
                        </button>
                        <div
                            onClick={() => window.location.reload()}
                            className={clsx(
                                "flex items-center gap-2 overflow-hidden transition-all duration-300 flex-1 cursor-pointer hover:opacity-80",
                                // Desktop: Hide when collapsed, Show when expanded
                                isExpanded ? "md:w-auto md:opacity-100" : "md:w-0 md:opacity-0",
                                // Mobile: Always visible (Header mode)
                                "w-auto opacity-100"
                            )}>
                            <img src="./favicon_header.png" alt="Logo" className="w-6 h-6 object-contain shrink-0" />
                            <span className="text-sm font-bold text-white tracking-wide truncate">Hone</span>
                        </div>

                        {/* Mobile-only menu items */}
                        {currentUser && (
                            <div className="md:hidden flex items-center gap-1">
                                <button
                                    id="tour-mobile-reset"
                                    onClick={resetTour}
                                    className="p-2 hover:bg-zinc-800 rounded transition-colors group"
                                    title="Reset Tour"
                                >
                                    <Sparkles className="w-4 h-4 text-zinc-500 group-hover:text-yellow-400 transition-colors" />
                                </button>
                                <button
                                    id="tour-mobile-settings"
                                    onClick={() => onNavigate?.('settings')}
                                    className={clsx(
                                        "p-2 hover:bg-zinc-800 rounded transition-colors group",
                                        currentView === 'settings' ? "text-white bg-zinc-800" : "text-zinc-500"
                                    )}
                                    title="Settings"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:text-white transition-colors"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-zinc-800 rounded transition-colors group"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
                                </button>
                            </div>
                        )}
                    </div>



                    <div className={clsx(
                        "custom-scrollbar space-y-1 transition-all duration-300",
                        // Mobile: Always visible, simple list
                        "p-2 overflow-y-auto flex-1",
                        // Desktop Override
                        "md:flex-1 md:overflow-y-auto md:p-2 md:h-auto md:max-h-none md:overflow-visible"
                    )}>
                        <DndContext
                            id="calendars-dnd"
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleCalendarDragEnd}
                        >
                            <SortableContext
                                items={calendars.map(c => c.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {calendars.map(cal => {
                                    const isEditingThis = editingCalendarId === cal.id;

                                    if (isEditingThis && (isExpanded || isEditingThis)) { // Show if editing (force expanded on mobile inherently)
                                        return (
                                            <SortableCalendarItem key={cal.id} id={cal.id} isEditing={true}>
                                                <form onSubmit={handleCalendarSubmit} className="px-1 bg-zinc-900 border border-zinc-700/50 rounded p-1 mb-1">
                                                    <div className="flex items-center gap-1 mb-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handlePopoverTrigger(e, 'calendar-color')}
                                                            className="w-6 h-6 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-all shrink-0"
                                                        >
                                                            <Folder size={14} style={{ color: calendarColor }} />
                                                        </button>
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={calendarNameInput}
                                                            onChange={e => setCalendarNameInput(e.target.value)}
                                                            className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-zinc-700"
                                                            onKeyDown={e => {
                                                                if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
                                                                if (e.key === 'Escape') setEditingCalendarId(null);
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-1 justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingCalendarId(null)}
                                                            className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="submit"
                                                            className="px-2 py-0.5 bg-white text-black text-[10px] font-bold rounded hover:bg-zinc-200 transition-all"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                </form>
                                            </SortableCalendarItem>
                                        );
                                    }

                                    return (
                                        <SortableCalendarItem key={cal.id} id={cal.id}>
                                            <div
                                                onClick={() => {
                                                    onSelectCalendar(cal.id);
                                                }}
                                                title={cal.name}
                                                className={clsx(
                                                    "w-full flex items-center gap-3 p-2 rounded-md transition-all group cursor-pointer relative",
                                                    selectedCalendarId === cal.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-white hover:bg-zinc-900/50"
                                                )}
                                            >
                                                {selectedCalendarId === cal.id ? (
                                                    <FolderOpen size={20} className="shrink-0" style={{ color: cal.color || '#ffffff' }} />
                                                ) : (
                                                    <div className="relative shrink-0 w-5 h-5 flex items-center justify-center">
                                                        <Folder size={20} className="absolute inset-0" style={{ color: cal.color || '#ffffff' }} />
                                                        <span className="relative z-10 text-[9px] font-bold pt-0.5 select-none" style={{ color: cal.color || '#ffffff' }}>{cal.name.charAt(0).toUpperCase()}</span>
                                                    </div>
                                                )}
                                                {isExpanded && (
                                                    <>
                                                        <span className="text-xs font-medium truncate flex-1 text-left">{cal.name}</span>
                                                        <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); startEditingCalendar(cal); }}
                                                                className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-white"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            {calendars.length > 1 && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onDeleteCalendar(cal.id); }}
                                                                    className="p-1 hover:bg-zinc-800 rounded text-zinc-500 hover:text-red-400"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </SortableCalendarItem>
                                    );
                                })}
                            </SortableContext>
                        </DndContext>

                        {isAddingCalendar && isExpanded && (
                            <form onSubmit={handleCalendarSubmit} className="mt-2 px-1 bg-zinc-900 border border-zinc-700/50 rounded p-1 mb-1">
                                <div className="flex items-center gap-1 mb-1.5">
                                    <button
                                        type="button"
                                        onClick={(e) => handlePopoverTrigger(e, 'calendar-color')}
                                        className="w-6 h-6 flex items-center justify-center hover:bg-zinc-800 rounded-md transition-all shrink-0"
                                    >
                                        <Folder size={14} style={{ color: calendarColor }} />
                                    </button>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={calendarNameInput}
                                        onChange={e => setCalendarNameInput(e.target.value)}
                                        placeholder="Name..."
                                        className="flex-1 min-w-0 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                                        onKeyDown={e => {
                                            if (e.key === ' ' || e.key === 'Enter') e.stopPropagation();
                                            if (e.key === 'Escape') setIsAddingCalendar(false);
                                        }}
                                    />
                                </div>
                                <div className="flex gap-1 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddingCalendar(false)}
                                        className="px-2 py-0.5 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-2 py-0.5 bg-white text-black text-[10px] font-bold rounded hover:bg-zinc-200 transition-all"
                                    >
                                        Add
                                    </button>
                                </div>
                            </form>
                        )}

                        {!isAddingCalendar && !editingCalendarId && (
                            <button
                                onClick={startAddingCalendar}
                                className={clsx(
                                    "w-full flex items-center gap-3 p-2 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all",
                                    !isExpanded && "justify-center",
                                    "md:justify-start" // Force start alignment on desktop if expanded
                                )}
                                title="Add Calendar"
                            >
                                <Plus size={20} className="shrink-0" />
                                {isExpanded && <span className="text-xs font-medium">Add Calendar</span>}
                            </button>
                        )}
                    </div>

                    {/* User Info & Logout - Bottom */}
                    {currentUser && (
                        <div className={clsx(
                            "hidden md:flex items-center gap-2 px-3 py-2.5 border-t border-zinc-800 mt-auto transition-all duration-300",
                            isExpanded ? "justify-between" : "justify-center"
                        )}>
                            <div className={clsx(
                                "flex-1 min-w-0 transition-all duration-300",
                                isExpanded ? "opacity-100" : "opacity-0 w-0 overflow-hidden"
                            )}>
                                <p className="text-xs text-zinc-400 truncate">{currentUser.email}</p>
                            </div>
                            <div className="flex items-center gap-1">
                                {isExpanded && (
                                    <>
                                        <button
                                            onClick={resetTour}
                                            className="p-2 hover:bg-zinc-800 rounded transition-colors group flex-shrink-0"
                                            title="Reset Tour"
                                        >
                                            <Sparkles className="w-4 h-4 text-zinc-500 group-hover:text-yellow-400 transition-colors" />
                                        </button>
                                        <button
                                            onClick={() => onNavigate?.('settings')}
                                            className={clsx(
                                                "p-2 hover:bg-zinc-800 rounded transition-colors group flex-shrink-0",
                                                currentView === 'settings' ? "text-white bg-zinc-800" : "text-zinc-500"
                                            )}
                                            title="Settings"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 group-hover:text-white transition-colors"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={handleLogout}
                                    className="p-2 hover:bg-zinc-800 rounded transition-colors group flex-shrink-0"
                                    title="Logout"
                                >
                                    <LogOut className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop Habit List Panel (Inside Sidebar) */}
                <div className="hidden md:flex md:w-64 md:h-full md:bg-zinc-950 flex-col relative transition-all duration-300">
                    {habitListContent}
                </div>
            </div>

            {/* Mobile Bottom-Left Button to Toggle Habits Popup */}
            <div className={clsx(
                "md:hidden fixed bottom-4 left-4 z-[9999] transition-opacity duration-300",
                "opacity-100" // Always visible
            )}>
                <button
                    id="tour-mobile-habits-trigger"
                    onClick={() => setShowMobileHabits(!showMobileHabits)}
                    className={clsx(
                        "w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg border border-blue-500 text-white transition-all",
                        showMobileHabits ? "opacity-100 scale-110" : "opacity-50 hover:opacity-100 scale-100"
                    )}
                >
                    <Sparkles size={20} fill="currentColor" />
                </button>
            </div>

            {/* Mobile Habit Popup Panel (Independent Overlay) */}
            <div className={clsx(
                "md:hidden fixed inset-4 z-[105] rounded-xl border border-zinc-800 shadow-2xl animate-in zoom-in-95 bg-zinc-950 flex flex-col",
                showMobileHabits ? "block" : "hidden"
            )}>
                <button
                    onClick={() => setShowMobileHabits(false)}
                    className="absolute top-2 right-2 p-1 bg-zinc-900 rounded-full text-zinc-400 z-50 md:hidden"
                >
                    <X size={14} />
                </button>
                {habitListContent}
            </div>

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 max-w-sm mx-4 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-white mb-2">Confirm Logout</h3>
                        <p className="text-sm text-zinc-400 mb-6">Are you sure you want to logout? You'll need to sign in again to access your habits.</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-sm font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmLogout}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
