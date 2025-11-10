import React, { useMemo } from 'react';
import StatCard from './StatCard';
import { Bell, ListChecks, Calendar, Files, AlertTriangle } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';

const StatCardSkeleton: React.FC = () => (
    <div className="bg-white p-4 rounded-xl shadow-md flex items-center animate-pulse">
        <div className="bg-slate-200 p-3.5 rounded-lg mr-4 w-[50px] h-[50px] flex-shrink-0"></div>
        <div className="w-full">
            <div className="h-3 bg-slate-200 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-slate-200 rounded w-3/4"></div>
        </div>
    </div>
);

const DashboardHeader: React.FC = () => {
    const { invoices, tasks, events, documents, loading, error } = useAirtableData();

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        const overdueInvoices = invoices.filter(i => i.fields.Status === 'Overdue').length;
        const openTasks = tasks.filter(t => t.fields.Status === 'To-Do' || t.fields.Status === 'In-Progress').length;
        const eventsToday = events.filter(e => e.fields['Start Time']?.startsWith(today)).length;
        const totalDocs = documents.length;

        return { overdueInvoices, openTasks, eventsToday, totalDocs };
    }, [invoices, tasks, events, documents]);

    if (loading && invoices.length === 0) { // Check length to avoid flashing skeleton on refetch
        return (
             <header className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
                </div>
            </header>
        )
    }

    if (error) {
         return (
             <header className="mb-8">
                <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5" />
                    <p>Could not load dashboard stats: {error.message}</p>
                </div>
            </header>
        )
    }

    return (
        <header className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={Bell} title="Overdue Invoices" value={String(stats.overdueInvoices)} />
                <StatCard icon={ListChecks} title="Open Tasks" value={String(stats.openTasks)} />
                <StatCard icon={Calendar} title="Events Today" value={String(stats.eventsToday)} />
                <StatCard icon={Files} title="Total Documents" value={String(stats.totalDocs)} />
            </div>
        </header>
    );
}

export default DashboardHeader;