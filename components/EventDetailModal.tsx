

import React from 'react';
import { AirtableRecord, CalendarEvent, Client } from '../types';
import { X, Pencil, Trash2, Calendar, FileText, Bell, Gavel, Video, MapPin, Users, AlignLeft } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';

// Helper component for detail sections
const DetailSection: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode }> = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-4">
        <Icon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <div className="flex-grow">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</h4>
            <div className="text-base text-slate-800 mt-1">{children}</div>
        </div>
    </div>
);

// Helper for status badge
const getEventTypeBadgeClasses = (type?: CalendarEvent['Type']) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full inline-block capitalize';
    switch (type) {
        case 'Court Hearing': return `${base} bg-red-100 text-red-800`;
        case 'Client Meeting': return `${base} bg-blue-100 text-blue-800`;
        case 'Deposition': return `${base} bg-purple-100 text-purple-800`;
        case 'Filing Deadline': return `${base} bg-yellow-100 text-yellow-800`;
        default: return `${base} bg-teal-100 text-teal-800`;
    }
};

interface EventDetailModalProps {
    event: AirtableRecord<CalendarEvent> | null;
    onClose: () => void;
    onEdit: (event: AirtableRecord<CalendarEvent>) => void;
    onDelete: (eventId: string) => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose, onEdit, onDelete }) => {
    const { clients } = useAirtableData();
    if (!event) return null;

    const { fields } = event;

    const attendees = React.useMemo(() => {
        if (!fields?.Attendees || !clients.length) return [];
        const attendeeIds = new Set(fields.Attendees);
        return clients.filter(c => attendeeIds.has(c.id));
    }, [fields, clients]);

    const formatTime = (isoString?: string) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formattedStartDate = fields['Start Time']
        ? new Date(fields['Start Time']).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        : 'Not set';

    const timeString = fields['All Day']
        ? 'All-day event'
        : `${formatTime(fields['Start Time'])} ${fields['End Time'] ? `- ${formatTime(fields['End Time'])}` : ''}`;

    const matterNameRaw = fields['Matter Name (from Matter)'];
    const displayMatterName = (Array.isArray(matterNameRaw) ? matterNameRaw.join(', ') : matterNameRaw);

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="event-detail-title">
            <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500"
                    aria-label="Close event details"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <header className="pb-4 mb-2">
                    <div className="flex justify-between items-start gap-4">
                        <div className="flex-grow">
                            <span className={getEventTypeBadgeClasses(fields.Type)}>{fields.Type}</span>
                            <h2 id="event-detail-title" className="text-3xl font-bold text-slate-800 mt-2">{fields.Subject || 'Untitled Event'}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button 
                                onClick={() => onEdit(event)}
                                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-300 hover:border-custom-indigo-500 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50"
                                aria-label="Edit event"
                            >
                                <Pencil className="w-4 h-4" /> Edit
                            </button>
                             <button 
                                onClick={() => onDelete(event.id)}
                                className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                aria-label="Delete event"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </div>
                </header>

                <div className="modal-body-content space-y-6 py-4">
                    <DetailSection icon={Calendar} label="Date & Time">
                        <p className="font-semibold">{formattedStartDate}</p>
                        <p>{timeString}</p>
                    </DetailSection>

                    {fields.Location && (
                        <DetailSection icon={MapPin} label="Location">
                            <p>{fields.Location}</p>
                        </DetailSection>
                    )}

                    {fields.Type === 'Court Hearing' && (fields['Court Name'] || fields.Judge || fields['Room Number']) && (
                        <DetailSection icon={Gavel} label="Court Details">
                            {fields['Court Name'] && <p>{fields['Court Name']}</p>}
                            {fields.Judge && <p className="text-sm">Judge: {fields.Judge}</p>}
                            {fields['Room Number'] && <p className="text-sm">Room: {fields['Room Number']}</p>}
                        </DetailSection>
                    )}
                    
                    {fields.Type === 'Client Meeting' && fields['Video Conference Link'] && (
                        <DetailSection icon={Video} label="Meeting Link">
                            <a href={fields['Video Conference Link']} target="_blank" rel="noopener noreferrer" className="text-custom-indigo-600 hover:underline break-all">{fields['Video Conference Link']}</a>
                        </DetailSection>
                    )}
                    
                    <DetailSection icon={FileText} label="Related Matter">
                        <p className="text-custom-indigo-700 font-semibold">{displayMatterName || <span className="text-slate-500 italic">No linked matter.</span>}</p>
                    </DetailSection>

                    {attendees.length > 0 && (
                         <DetailSection icon={Users} label="Attendees">
                            <ul className="list-disc list-inside">
                                {attendees.map(a => <li key={a.id}>{a.fields['Client Name']}</li>)}
                            </ul>
                        </DetailSection>
                    )}

                    {fields.Reminders && fields.Reminders.length > 0 && (
                       <DetailSection icon={Bell} label="Reminders">
                         <div className="flex flex-wrap gap-2">
                             {fields.Reminders.map(r => <span key={r} className="bg-slate-100 text-slate-700 px-2 py-1 text-xs rounded-full">{r}</span>)}
                         </div>
                       </DetailSection>
                    )}

                    {fields.Description && (
                        <DetailSection icon={AlignLeft} label="Description">
                            <p className="whitespace-pre-wrap">{fields.Description}</p>
                        </DetailSection>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventDetailModal;