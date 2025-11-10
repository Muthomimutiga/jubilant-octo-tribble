
import React, { useMemo } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import InfoCard from './InfoCard';

interface FeeNotesWidgetProps {
    onNavigate: (page: string) => void;
    onOpenFeenoteModal: () => void;
}

const FeeNotesWidget: React.FC<FeeNotesWidgetProps> = ({ onNavigate, onOpenFeenoteModal }) => {
    const { invoices, loading } = useAirtableData();

    const feeNotesDueTodayCount = useMemo(() => {
        const todayISO = new Date().toISOString().split('T')[0];
        return invoices.filter(i => 
            i.fields['Due Date'] === todayISO && 
            i.fields.Status !== 'Paid' && 
            i.fields.Status !== 'Void'
        ).length;
    }, [invoices]);

    const renderText = (count: number, singular: string, plural: string) => {
        if (loading) return "Loading...";
        if (count === 0) return `No ${plural} at the moment.`;
        if (count === 1) return `You have 1 ${singular}.`;
        return `You have ${count} ${plural}.`;
    };
    
    return (
        <InfoCard title="Fee Notes Due Today" badge={loading ? '...' : String(feeNotesDueTodayCount)} className="!mb-0">
            <p className="text-slate-600 mb-6">{renderText(feeNotesDueTodayCount, 'fee note due today', 'fee notes due today')}</p>
            <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center gap-4">
               <button onClick={onOpenFeenoteModal} className="bg-gradient-to-r from-custom-indigo-500 to-custom-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-custom-indigo-600 hover:to-custom-indigo-800 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-75 w-full sm:w-auto">Generate New Feenote</button>
               <button onClick={() => onNavigate('Billing')} className="bg-slate-100 text-custom-indigo-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-300 hover:border-custom-indigo-500 w-full sm:w-auto focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50">View All Fee notes</button>
            </div>
        </InfoCard>
    );
};

export default FeeNotesWidget;
