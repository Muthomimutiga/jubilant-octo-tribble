
import React, { useMemo } from 'react';
import InfoCard from './InfoCard';
import { Landmark, TrendingUp, AlertTriangle, FileWarning, Loader2 } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';

interface FinancialSnapshotProps {
    onNavigate: (page: string) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

const MetricItem: React.FC<{ icon: React.ElementType, label: string, value: string, iconClass: string }> = ({ icon: Icon, label, value, iconClass }) => (
    <div className="flex items-center gap-4 py-3">
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${iconClass}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div className="flex-grow">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-bold text-lg text-slate-800">{value}</p>
        </div>
    </div>
);

const FinancialSnapshot: React.FC<FinancialSnapshotProps> = ({ onNavigate }) => {
    const { invoices, loading } = useAirtableData();

    const stats = useMemo(() => {
        let revenueThisMonth = 0;
        let totalOutstanding = 0;
        let overdueCount = 0;

        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        invoices.forEach(invoice => {
            const status = invoice.fields.Status;
            const amount = invoice.fields['Total Amount'] || 0;
            const amountPaid = invoice.fields['Amount Paid'] || 0;
            const balance = amount - amountPaid;

            if (status === 'Sent' || status === 'Overdue') {
                totalOutstanding += balance;
            }

            if (status === 'Overdue') {
                overdueCount += 1;
            }
            
            if (invoice.fields['Date Paid']) {
                const paidDate = new Date(invoice.fields['Date Paid']);
                if (paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear) {
                    revenueThisMonth += invoice.fields['Total Amount'] || 0;
                }
            }
        });

        return { revenueThisMonth, totalOutstanding, overdueCount };
    }, [invoices]);


    const renderContent = () => {
        if (loading && invoices.length === 0) {
            return (
                 <div className="space-y-4 animate-pulse">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                            <div className="flex-grow space-y-2">
                                <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                                <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                    <div className="h-9 bg-slate-200 rounded-lg mt-4"></div>
                </div>
            );
        }

        return (
            <>
                <div className="divide-y divide-slate-100">
                    <MetricItem 
                        icon={TrendingUp} 
                        label="Revenue This Month" 
                        value={formatCurrency(stats.revenueThisMonth)}
                        iconClass="bg-green-100 text-green-600"
                    />
                    <MetricItem 
                        icon={AlertTriangle} 
                        label="Total Outstanding" 
                        value={formatCurrency(stats.totalOutstanding)}
                        iconClass="bg-amber-100 text-amber-600"
                    />
                    <MetricItem 
                        icon={FileWarning} 
                        label="Overdue Invoices" 
                        value={String(stats.overdueCount)}
                        iconClass="bg-red-100 text-red-600"
                    />
                </div>
                 <div className="mt-6">
                    <button 
                        onClick={() => onNavigate('Billing')}
                        className="bg-slate-100 text-custom-indigo-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors w-full border border-slate-300 hover:border-custom-indigo-500 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50"
                    >
                        View Billing
                    </button>
                </div>
            </>
        )
    };
    
    return (
        <InfoCard title="Financial Snapshot" icon={Landmark} className="!mb-0">
           {renderContent()}
        </InfoCard>
    );
};

export default FinancialSnapshot;
