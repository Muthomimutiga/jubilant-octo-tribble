import { CalendarEvent } from '../types';

export const TIME_LABELS = [
    '7 AM', '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', 
    '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'
];

export const TIMELINE_START_HOUR = 7;
export const TOTAL_HOURS = TIME_LABELS.length;

export const getWeekDays = (currentDate: Date): Date[] => {
    const date = new Date(currentDate);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek; // Adjust to Sunday
    const startOfWeek = new Date(date.setDate(diff));
    
    return Array.from({ length: 7 }, (_, i) => {
        const day = new Date(startOfWeek);
        day.setDate(day.getDate() + i);
        return day;
    });
};

export const toISODateString = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

/**
 * Calculates the CSS Grid row positioning for a timed event.
 * Each hour in the timeline is divided into two 30-minute grid rows.
 */
export const calculateEventPosition = (event: CalendarEvent): { gridRow: string } => {
    const startTime = new Date(event['Start Time']);
    // Default end time to 30 mins after start if not provided
    const endTime = event['End Time'] ? new Date(event['End Time']) : new Date(startTime.getTime() + 30 * 60000);

    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();

    // Calculate start row (2 rows per hour, 1-based index)
    // Clamp start to the beginning of the timeline
    const clampedStartHour = Math.max(startHour, TIMELINE_START_HOUR);
    const startRow = (clampedStartHour - TIMELINE_START_HOUR) * 2 + Math.floor(startMinutes / 30) + 1;

    // Calculate end row
    // Clamp end to the end of the timeline
    const clampedEndHour = Math.min(endHour, TIMELINE_START_HOUR + TOTAL_HOURS);
    const endRow = (clampedEndHour - TIMELINE_START_HOUR) * 2 + Math.ceil(endMinutes / 30) + 1;
    
    // An event must span at least one row
    const finalEndRow = Math.max(endRow, startRow + 1);

    return {
        gridRow: `${startRow} / ${finalEndRow}`
    };
};