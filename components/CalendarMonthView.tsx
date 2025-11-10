import React, { useMemo } from 'react';
import { AirtableRecord, Task, CalendarEvent } from '../types';
import './CalendarViews.css';

interface CalendarMonthViewProps {
    currentDate: Date;
    tasks: AirtableRecord<Task>[];
    events: AirtableRecord<CalendarEvent>[];
    onEventClick: (event: AirtableRecord<CalendarEvent>) => void;
    onTaskClick: (task: AirtableRecord<Task>) => void;
    onDateClick: (date: Date, e: React.MouseEvent) => void;
}

const toISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const getEventTypeClass = (type?: CalendarEvent['Type'], allDay: boolean = false) => {
    const base = allDay ? 'calendar-all-day-item' : 'calendar-timed-event-item';
    switch (type) {
        case 'Court Hearing': return `${base} event-type-court-hearing`;
        case 'Client Meeting': return `${base} event-type-client-meeting`;
        case 'Deposition': return `${base} event-type-deposition`;
        case 'Filing Deadline': return `${base} event-type-filing-deadline`;
        default: return `${base} event-type-misc`;
    }
}

const getTaskPriorityClass = (priority?: Task['Priority']) => {
    switch (priority) {
        case 'High': return 'calendar-task-priority-high';
        case 'Medium': return 'calendar-task-priority-medium';
        case 'Low': return 'calendar-task-priority-low';
        default: return '';
    }
};

const CalendarMonthView: React.FC<CalendarMonthViewProps> = ({ currentDate, tasks, events, onEventClick, onTaskClick, onDateClick }) => {
    const tasksByDate = useMemo(() => {
        const map = new Map<string, AirtableRecord<Task>[]>();
        tasks.forEach(task => {
            if (task.fields['Due Date']) {
                const dateKey = task.fields['Due Date'];
                if (!map.has(dateKey)) map.set(dateKey, []);
                map.get(dateKey)!.push(task);
            }
        });
        return map;
    }, [tasks]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, AirtableRecord<CalendarEvent>[]>();
        events.forEach(event => {
            if (event.fields['Start Time']) {
                const dateKey = event.fields['Start Time'].split('T')[0];
                if (!map.has(dateKey)) map.set(dateKey, []);
                map.get(dateKey)!.push(event);
            }
        });
        return map;
    }, [events]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const blanks = Array.from({ length: firstDayOfMonth });
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = toISODateString(new Date());

    return (
        <div className="calendar-month-grid">
            {weekdays.map(day => <div key={day} className="month-weekday-header">{day}</div>)}
            {blanks.map((_, index) => <div key={`blank-${index}`} className="month-day-cell is-other-month"></div>)}
            {days.map(day => {
                const dateObj = new Date(year, month, day);
                const dateKey = toISODateString(dateObj);
                const isToday = dateKey === today;
                const dayTasks = tasksByDate.get(dateKey) || [];
                const dayEvents = eventsByDate.get(dateKey) || [];
                const allDayEvents = dayEvents.filter(e => e.fields['All Day']);
                const timedEvents = dayEvents.filter(e => !e.fields['All Day']);

                return (
                    <div key={day} className={`month-day-cell ${isToday ? 'is-today' : ''}`} onClick={(e) => onDateClick(dateObj, e)}>
                        <div className="day-number-wrapper"><span className="day-number">{day}</span></div>
                        <div className="items-container">
                            <div className="all-day-items-list">
                                {allDayEvents.map(calEvent => (
                                    <div key={calEvent.id} onClick={(e) => { e.stopPropagation(); onEventClick(calEvent); }} className={`calendar-item ${getEventTypeClass(calEvent.fields.Type, true)}`}>
                                        {calEvent.fields.Subject}
                                    </div>
                                ))}
                            </div>
                            <div className="timed-items-list">
                                {timedEvents.map(calEvent => (
                                    <div key={calEvent.id} onClick={(e) => { e.stopPropagation(); onEventClick(calEvent); }} className={`calendar-item ${getEventTypeClass(calEvent.fields.Type)}`}>
                                        <span className="event-subject">{calEvent.fields.Subject}</span>
                                        <span className="event-matter">{calEvent.fields['Matter Name (from Matter)']?.[0] || '...'}</span>
                                    </div>
                                ))}
                                {dayTasks.map(task => 
                                    <div key={task.id} onClick={(e) => { e.stopPropagation(); onTaskClick(task); }} className={`calendar-item calendar-task-item ${getTaskPriorityClass(task.fields.Priority)}`} title={task.fields['Task Name']}>
                                        {task.fields['Task Name']}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default CalendarMonthView;
