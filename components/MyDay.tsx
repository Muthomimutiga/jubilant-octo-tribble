

import React, { useMemo, useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { useAirtableData } from '../contexts/AirtableDataContext';
import { useAuth } from '../contexts/AuthContext';
import { AirtableRecord, CalendarEvent, Task, Invoice } from '../types';
import { Calendar, CheckSquare, FileWarning, Gavel, Users, AlertTriangle, Sun, Sunset, Moon } from 'lucide-react';
import './MyDay.css';

// Helper to get a greeting and icon based on the time of day
const getGreetingDetails = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
        return { text: 'Good morning', Icon: Sun, className: 'text-amber-500' };
    }
    if (hour < 18) {
        return { text: 'Good afternoon', Icon: Sunset, className: 'text-orange-500' };
    }
    return { text: 'Good evening', Icon: Moon, className: 'text-indigo-400' };
};

// Helper for formatting currency
const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return '';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

// Helper to format user name with proper capitalization
const formatUserName = (name?: string, email?: string): string => {
    if (name && name.trim()) {
        return name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    if (email) {
        const emailName = email.split('@')[0];
        return emailName
            .replace(/[._]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }
    return 'there';
};


// Specific Item components
const AgendaItem: React.FC<{ event: AirtableRecord<CalendarEvent> }> = ({ event }) => {
    const { fields } = event;
    const isCourt = fields.Type === 'Court Hearing';
    const Icon = isCourt ? Gavel : Users;
    const time = fields['Start Time'] ? new Date(fields['Start Time']).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'All-day';
    const matterNameRaw = fields['Matter Name (from Matter)'];
    const displayMatterName = (Array.isArray(matterNameRaw) ? matterNameRaw.join(', ') : matterNameRaw) || 'General';

    return (
        <div className="my-day-item">
            <div className={`my-day-item-icon ${isCourt ? 'icon-court' : 'icon-meeting'}`}><Icon className="w-4 h-4" /></div>
            <div className="my-day-item-content">
                <p className="my-day-item-title">{fields.Subject}</p>
                <p className="my-day-item-subtitle">{displayMatterName}</p>
            </div>
            <div className="my-day-item-meta">{time}</div>
        </div>
    );
};

const TaskItem: React.FC<{ task: AirtableRecord<Task> }> = ({ task }) => {
    const { fields } = task;
    const priorityClass = `priority-${(fields.Priority || 'low').toLowerCase()}`;
    const matterNameRaw = fields['Matter Name (from Matter)'];
    const displayMatterName = (Array.isArray(matterNameRaw) ? matterNameRaw.join(', ') : matterNameRaw) || 'No Linked Matter';

    return (
        <div className="my-day-item">
            <div className="my-day-item-icon"><span className={`my-day-priority-dot ${priorityClass}`}></span></div>
            <div className="my-day-item-content">
                <p className="my-day-item-title">{fields['Task Name']}</p>
                <p className="my-day-item-subtitle">{displayMatterName}</p>
            </div>
        </div>
    );
};

const FollowUpItem: React.FC<{ invoice: AirtableRecord<Invoice> }> = ({ invoice }) => {
    const { fields } = invoice;
    return (
        <div className="my-day-item">
            <div className="my-day-item-icon icon-invoice"><FileWarning className="w-4 h-4" /></div>
            <div className="my-day-item-content">
                <p className="my-day-item-title">Invoice #{fields['Invoice #']}</p>
                <p className="my-day-item-subtitle">{fields['Client Name (from Matter)']?.[0] || 'N/A'}</p>
            </div>
            <div className="my-day-item-meta">{formatCurrency(fields['Total Amount'])}</div>
        </div>
    );
};

const MyDay: React.FC = () => {
    const { currentUser } = useAuth();
    const { events, tasks, invoices, loading, error } = useAirtableData();

    const [inspiration, setInspiration] = useState<string>('');
    const [isFetchingInspiration, setIsFetchingInspiration] = useState<boolean>(true);
    const [inspirationError, setInspirationError] = useState<string | null>(null);

    const { text: greeting, Icon, className: iconClassName } = getGreetingDetails();
    
    const userName = useMemo(() => {
        return formatUserName(currentUser?.fields.Name, currentUser?.fields.Email);
    }, [currentUser]);

    useEffect(() => {
        const fetchInspiration = async () => {
            setIsFetchingInspiration(true);
            setInspirationError(null);
            try {
                const cachedQuote = localStorage.getItem('dailyInspiration');
                const cacheDate = localStorage.getItem('dailyInspirationDate');
                const today = new Date().toISOString().split('T')[0];

                if (cachedQuote && cacheDate === today) {
                    setInspiration(cachedQuote);
                    return;
                }
                
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: 'Give me a short, inspiring quote for a legal professional to start their day. It should be motivational and professional. Maximum 25 words.',
                });
                const quote = response.text;
                
                if (quote) {
                    const cleanQuote = quote.replace(/"/g, '');
                    setInspiration(cleanQuote);
                    localStorage.setItem('dailyInspiration', cleanQuote);
                    localStorage.setItem('dailyInspirationDate', today);
                } else {
                    throw new Error("Received an empty response from the API.");
                }

            } catch (err) {
                console.error("Failed to fetch inspiration:", err);
                setInspirationError("Could not fetch daily inspiration.");
            } finally {
                setIsFetchingInspiration(false);
            }
        };

        fetchInspiration();
    }, []);

    const memoizedData = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString().split('T')[0];

        const agendaItems = events
            .filter(e => e.fields['Start Time']?.startsWith(todayISO))
            .sort((a, b) => new Date(a.fields['Start Time']).getTime() - new Date(b.fields['Start Time']).getTime());
            
        const urgentTasks = tasks.filter(t => {
            const status = t.fields.Status;
            if (status === 'Done' || !t.fields['Due Date']) return false;
            const dueDate = new Date(t.fields['Due Date']);
            const dueDateLocal = new Date(dueDate.valueOf() + dueDate.getTimezoneOffset() * 60 * 1000);
            return dueDateLocal <= today;
        }).sort((a, b) => {
            const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
            return (priorityOrder[a.fields.Priority || 'Low'] || 3) - (priorityOrder[b.fields.Priority || 'Low'] || 3);
        });
        
        const criticalFollowUps = invoices.filter(i => i.fields.Status === 'Overdue');
        
        return { agendaItems, urgentTasks, criticalFollowUps };
    }, [events, tasks, invoices]);

    if (loading && events.length === 0) {
        return (
            <div className="my-day-container animate-pulse" aria-label="Loading dashboard data">
                <div className="my-day-header">
                    <div className="h-8 bg-slate-200 rounded w-1/3 mb-2"></div>
                    <div className="h-5 bg-slate-200 rounded w-1/2"></div>
                </div>
                <div className="my-day-columns">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="my-day-column">
                            <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-10 bg-slate-200 rounded"></div>
                                <div className="h-10 bg-slate-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="my-day-container">
                <div className="flex items-center gap-3 text-red-600 p-4 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="w-6 h-6" />
                    <div>
                        <p className="font-bold">Could not load "My Day"</p>
                        <p className="text-sm">{error.message}</p>
                    </div>
                </div>
            </div>
        );
    }
    
    const renderInspiration = () => {
        if (isFetchingInspiration) {
            return <span className="my-day-subtitle-placeholder"></span>;
        }
        if (inspirationError || !inspiration) {
            return "Here’s a look at your immediate priorities. Have a productive day!";
        }
        return `"${inspiration}"`;
    };

    return (
        <div className="my-day-container">
            <div className="my-day-header">
                 <h2 className="my-day-greeting"><Icon className={`inline-block mr-3 -mt-2 ${iconClassName}`} />{greeting}, {userName}</h2>
                <p className="my-day-subtitle">{renderInspiration()}</p>
            </div>
            <div className="my-day-columns">
                <div className="my-day-column">
                    <h3 className="my-day-column-title"><Calendar className="w-5 h-5"/> Today's Agenda</h3>
                    <div className="my-day-list">
                        {memoizedData.agendaItems.length > 0 ? (
                            memoizedData.agendaItems.map(event => <AgendaItem key={event.id} event={event} />)
                        ) : (
                            <p className="my-day-empty-state">No events scheduled for today.</p>
                        )}
                    </div>
                </div>
                <div className="my-day-column">
                    <h3 className="my-day-column-title"><CheckSquare className="w-5 h-5"/> Urgent Tasks</h3>
                    <div className="my-day-list">
                         {memoizedData.urgentTasks.length > 0 ? (
                            memoizedData.urgentTasks.map(task => <TaskItem key={task.id} task={task} />)
                        ) : (
                            <p className="my-day-empty-state">No urgent tasks. Well done!</p>
                        )}
                    </div>
                </div>
                <div className="my-day-column">
                    <h3 className="my-day-column-title"><FileWarning className="w-5 h-5"/> Critical Follow-ups</h3>
                     <div className="my-day-list">
                         {memoizedData.criticalFollowUps.length > 0 ? (
                            memoizedData.criticalFollowUps.map(invoice => <FollowUpItem key={invoice.id} invoice={invoice} />)
                        ) : (
                            <p className="my-day-empty-state">No overdue invoices.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemoizedMyDay = React.memo(MyDay);

export default MemoizedMyDay;