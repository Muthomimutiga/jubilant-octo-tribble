

import React, { useState, useEffect } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { CalendarEvent, ReminderOption, AirtableRecord } from '../types';
import { X } from 'lucide-react';
import MatterAutocomplete from './MatterAutocomplete';
import ContactMultiSelect from './ContactMultiSelect';
import { useToast } from '../contexts/ToastContext';
import { useGoogleCalendar } from '../contexts/GoogleCalendarContext';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventToEdit?: AirtableRecord<CalendarEvent> | null;
  defaultDate?: Date | null;
}

const EVENT_TYPES: CalendarEvent['Type'][] = ['Client Meeting', 'Court Hearing', 'Deposition', 'Filing Deadline', 'Misc'];
const REMINDER_OPTIONS: ReminderOption[] = ['15 mins before', '1 hour before', '1 day before', '2 days before'];

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSuccess, eventToEdit, defaultDate }) => {
  const [formData, setFormData] = useState<Partial<CalendarEvent>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof CalendarEvent | 'Reminders', string>>>({});
  const [reminders, setReminders] = useState<Set<ReminderOption>>(new Set());

  const { matters, clients, loading: loadingData, refetchEvents } = useAirtableData();
  const { createRecord, updateRecord, loading: mutationLoading, error: mutationError } = useAirtableMutation();
  const { addToast } = useToast();
  const { isAuthenticated, createGoogleCalendarEvent, updateGoogleCalendarEvent } = useGoogleCalendar();
  
  const isEditMode = !!eventToEdit;

  const resetForm = () => {
    const defaultStartTime = new Date();
    defaultStartTime.setMinutes(Math.ceil(defaultStartTime.getMinutes() / 30) * 30, 0, 0); // Round up to next 30 mins
    
    setFormData({ 
        Type: 'Client Meeting', 
        'Start Time': defaultStartTime.toISOString().slice(0, 16),
        'All Day': false,
    });
    setFormErrors({});
    setReminders(new Set());
  };

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && eventToEdit) {
        const eventData = { ...eventToEdit.fields };
        
        // Format dates for inputs
        if(eventData['Start Time']) {
            eventData['Start Time'] = new Date(eventData['Start Time']).toISOString().slice(0, 16);
        }
        if(eventData['End Time']) {
            eventData['End Time'] = new Date(eventData['End Time']).toISOString().slice(0, 16);
        }

        setFormData(eventData);
        setReminders(new Set(eventData.Reminders || []));
    } else if (defaultDate) {
        // New event with a specific date clicked
        const startDate = new Date(defaultDate);
        startDate.setHours(9, 0, 0, 0); // Default to 9 AM
        setFormData({
            Type: 'Client Meeting', 
            'Start Time': startDate.toISOString().slice(0, 16),
            'All Day': false,
        });
        setFormErrors({});
        setReminders(new Set());
    } else {
      resetForm();
    }
  }, [isOpen, isEditMode, eventToEdit, defaultDate]);

  if (!isOpen) return null;

  const handleReminderChange = (option: ReminderOption) => {
    const newReminders = new Set(reminders);
    if (newReminders.has(option)) {
        newReminders.delete(option);
    } else {
        newReminders.add(option);
    }
    setReminders(newReminders);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (formErrors[name as keyof CalendarEvent]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof CalendarEvent, string>> = {};
    if (!formData.Subject?.trim()) errors.Subject = 'Subject is required.';
    if (!formData['Start Time']) errors['Start Time'] = 'Start time is required.';
    if (!formData['All Day'] && formData['End Time'] && formData['Start Time'] && formData['End Time'] < formData['Start Time']) {
        errors['End Time'] = 'End time cannot be before start time.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Construct a clean payload with only writable fields
    const payload: Partial<CalendarEvent> = {
        Subject: formData.Subject,
        'Start Time': formData['Start Time'],
        Type: formData.Type,
        'All Day': !!formData['All Day'],
        Reminders: Array.from(reminders),
        'End Time': formData['End Time'] || null,
        Location: formData.Location || null,
        Description: formData.Description || null,
        Matter: formData.Matter || null,
        Attendees: formData.Attendees || null,
        'Court Name': formData.Type === 'Court Hearing' ? (formData['Court Name'] || null) : null,
        'Judge': formData.Type === 'Court Hearing' ? (formData.Judge || null) : null,
        'Room Number': formData.Type === 'Court Hearing' ? (formData['Room Number'] || null) : null,
        'Video Conference Link': formData.Type === 'Client Meeting' ? (formData['Video Conference Link'] || null) : null
    };
    
    Object.keys(payload).forEach(key => {
        const k = key as keyof typeof payload;
        if (payload[k] === null || payload[k] === undefined || (Array.isArray(payload[k]) && (payload[k] as any[]).length === 0)) {
            delete payload[k];
        }
    });

    try {
        if (isEditMode && eventToEdit) {
            await updateRecord('Events', eventToEdit.id, payload);
            if (isAuthenticated && eventToEdit.fields['Google Calendar Event ID']) {
                await updateGoogleCalendarEvent(eventToEdit.fields['Google Calendar Event ID'], payload);
                addToast('Event updated in Google Calendar.', 'info');
            } else if (isAuthenticated && !eventToEdit.fields['Google Calendar Event ID']) {
                const googleEventId = await createGoogleCalendarEvent(payload);
                if (googleEventId) {
                    await updateRecord('Events', eventToEdit.id, { 'Google Calendar Event ID': googleEventId });
                    addToast('Event synced to Google Calendar.', 'info');
                }
            }
        } else {
            const newAirtableRecord = await createRecord('Events', payload);
            if (isAuthenticated) {
                const googleEventId = await createGoogleCalendarEvent(payload);
                if (googleEventId) {
                    await updateRecord('Events', newAirtableRecord.id, { 'Google Calendar Event ID': googleEventId });
                    addToast('Event created and synced to Google Calendar.', 'info');
                }
            }
        }
        addToast(`Event ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
        refetchEvents();
        onSuccess();
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        addToast(`Error saving event: ${err.message}`, 'error');
        console.error("Failed to save event:", error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content !max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close form">
          <X className="w-6 h-6" />
        </button>

        <header className="pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Edit Event' : 'New Event'}</h2>
        </header>
        
        <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-4">
                <div className="form-group">
                    <label htmlFor="Subject" className="form-label">Subject</label>
                    <input type="text" id="Subject" name="Subject" value={formData.Subject || ''} onChange={handleChange} placeholder="e.g., Strategy meeting with client" className={`form-input ${formErrors.Subject ? 'border-red-500' : ''}`} />
                    {formErrors.Subject && <p className="form-error">{formErrors.Subject}</p>}
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-grow">
                        <div className="form-group">
                            <label htmlFor="Start Time" className="form-label">{formData['All Day'] ? 'Date' : 'Start Time'}</label>
                            <input type={formData['All Day'] ? 'date' : 'datetime-local'} id="Start Time" name="Start Time" value={formData['Start Time']?.slice(0, formData['All Day'] ? 10 : 16) || ''} onChange={handleChange} className={`form-input ${formErrors['Start Time'] ? 'border-red-500' : ''}`} />
                            {formErrors['Start Time'] && <p className="form-error">{formErrors['Start Time']}</p>}
                        </div>
                        {!formData['All Day'] && (
                            <div className="form-group">
                                <label htmlFor="End Time" className="form-label">End Time (optional)</label>
                                <input type="datetime-local" id="End Time" name="End Time" value={formData['End Time']?.slice(0, 16) || ''} onChange={handleChange} className={`form-input ${formErrors['End Time'] ? 'border-red-500' : ''}`} />
                                 {formErrors['End Time'] && <p className="form-error">{formErrors['End Time']}</p>}
                            </div>
                        )}
                    </div>
                    <div className="form-group pt-6">
                        <div className="form-checkbox-group">
                            <input type="checkbox" id="All Day" name="All Day" checked={!!formData['All Day']} onChange={handleChange} className="form-checkbox" />
                            <label htmlFor="All Day" className="form-checkbox-label">All-day</label>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="form-group">
                        <label htmlFor="Type" className="form-label">Event Type</label>
                        <select id="Type" name="Type" value={formData.Type || 'Client Meeting'} onChange={handleChange} className="form-select">
                            {EVENT_TYPES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div className="form-group">
                        <label htmlFor="Location" className="form-label">Location (optional)</label>
                        <input type="text" id="Location" name="Location" value={formData.Location || ''} onChange={handleChange} placeholder="e.g., Conference Room A" className="form-input" />
                    </div>
                </div>
                
                {formData.Type === 'Court Hearing' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 p-4 bg-slate-50 rounded-lg">
                        <div className="form-group"><label htmlFor="Court Name" className="form-label">Court Name</label><input type="text" id="Court Name" name="Court Name" value={formData['Court Name'] || ''} onChange={handleChange} className="form-input" /></div>
                        <div className="form-group"><label htmlFor="Judge" className="form-label">Judge</label><input type="text" id="Judge" name="Judge" value={formData['Judge'] || ''} onChange={handleChange} className="form-input" /></div>
                        <div className="form-group"><label htmlFor="Room Number" className="form-label">Room Number</label><input type="text" id="Room Number" name="Room Number" value={formData['Room Number'] || ''} onChange={handleChange} className="form-input" /></div>
                    </div>
                )}
                {formData.Type === 'Client Meeting' && (
                    <div className="form-group">
                        <label htmlFor="Video Conference Link" className="form-label">Video Conference Link</label>
                        <input type="url" id="Video Conference Link" name="Video Conference Link" value={formData['Video Conference Link'] || ''} onChange={handleChange} className="form-input" placeholder="https://..." />
                    </div>
                )}


                <div className="form-group">
                    <label className="form-label">Reminders (optional)</label>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                        {REMINDER_OPTIONS.map(option => (
                             <div key={option} className="form-checkbox-group">
                                <input type="checkbox" id={`reminder-${option}`} name="Reminders" checked={reminders.has(option)} onChange={() => handleReminderChange(option)} className="form-checkbox" />
                                <label htmlFor={`reminder-${option}`} className="form-checkbox-label">{option}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="Matter" className="form-label">Link to Matter (optional)</label>
                    <MatterAutocomplete matters={matters} selectedId={formData.Matter?.[0] || null} onSelect={(id) => setFormData(prev => ({...prev, Matter: id ? [id] : []}))} placeholder='Search and link a matter...' disabled={loadingData} />
                </div>
                 <div className="form-group">
                    <label className="form-label">Attendees (optional)</label>
                    <ContactMultiSelect allClients={clients} selectedClientIds={formData.Attendees || []} onSelectionChange={(ids) => setFormData(prev => ({...prev, Attendees: ids}))} disabled={loadingData} />
                </div>
                <div className="form-group">
                    <label htmlFor="Description" className="form-label">Description / Notes (optional)</label>
                    <textarea id="Description" name="Description" value={formData.Description || ''} onChange={handleChange} className="form-textarea" rows={3}></textarea>
                </div>
            </div>

            {mutationError && (
                <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                    <strong>Error:</strong> {mutationError.message}
                </div>
            )}

            <footer className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-slate-200">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={mutationLoading}>
                    {mutationLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Event')}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;