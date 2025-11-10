import React from 'react';
import { AirtableRecord, Task, CalendarEvent } from '../types';
import { TIME_LABELS, toISODateString, calculateEventPosition } from '../utils/date';
import './CalendarViews.css';

interface CalendarDayViewProps {
    currentDate: Date;
    tasks: AirtableRecord<Task>[];
    events: AirtableRecord<CalendarEvent>[];
    onEventClick: (event: AirtableRecord<CalendarEvent>) => void;
    onTaskClick: (task: AirtableRecord<Task>) => void;
    onDateClick: (date: Date, e: React.MouseEvent) => void;
}

const getEventTypeClass = (type?: CalendarEvent['Type']) => {
    switch (type) {
        case 'Court Hearing': return 'event-type-court-hearing';
        case 'Client Meeting': return 'event-type-client-meeting';
        case 'Deposition': return 'event-type-deposition';
        case 'Filing Deadline': return 'event-type-filing-deadline';
        default: return 'event-type-misc';
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

const CalendarDayView: React.FC<CalendarDayViewProps> = ({ currentDate, tasks, events, onEventClick, onTaskClick, onDateClick }) => {
    const dateKey = toISODateString(currentDate);
    const isToday = dateKey === toISODateString(new Date());

    const dayTasks = tasks.filter(t => t.fields['Due Date'] === dateKey);
    const dayEvents = events.filter(e => e.fields['Start Time']?.startsWith(dateKey));
    
    const allDayItems = dayEvents.filter(e => e.fields['All Day']);
    const timedEvents = dayEvents.filter(e => !e.fields['All Day']);

    return (
        <div className="calendar-view-container day-view">
            {/* Time labels column */}
            <div className="time-labels-column">
                {TIME_LABELS.map(label => <div key={label} className="time-label">{label}</div>)}
            </div>

            {/* Day column */}
            <div className="day-column">
                <div className={`day-column-header ${isToday ? 'is-today' : ''}`}>
                    {/* Header is outside in the main page for day view */}
                </div>
                <div className="all-day-section" onClick={(e) => onDateClick(currentDate, e)}>
                    {allDayItems.map(event => (
                        <div key={event.id} onClick={(e) => { e.stopPropagation(); onEventClick(event); }} className={`calendar-item calendar-all-day-item ${getEventTypeClass(event.fields.Type)}`}>
                            {event.fields.Subject}
                        </div>
                    ))}
                    {dayTasks.map(task => (
                        <div key={task.id} onClick={(e) => { e.stopPropagation(); onTaskClick(task); }} className={`calendar-item calendar-task-item ${getTaskPriorityClass(task.fields.Priority)}`} title={task.fields['Task Name']}>
                            {task.fields['Task Name']}
                        </div>
                    ))}
                </div>
                <div className="timed-section" onClick={(e) => onDateClick(currentDate, e)}>
                    {timedEvents.map(event => (
                        <div 
                            key={event.id}
                            className={`calendar-item calendar-timed-event-item ${getEventTypeClass(event.fields.Type)}`}
                            style={calculateEventPosition(event.fields)}
                            onClick={(e) => { e.stopPropagation(); onEventClick(event); }}
                        >
                            <span className="event-subject">{event.fields.Subject}</span>
                            <span className="event-matter">{event.fields['Matter Name (from Matter)']?.[0] || ''}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalendarDayView;
