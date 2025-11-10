
import React, { useMemo } from 'react';
import { AirtableRecord, Invoice, FeeNoteLineItem } from '../types';
import { X, FileText, User, Calendar } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import './../pages/MattersPage.css'; // Re-use global modal styles

interface InvoiceDetailModalProps {
    invoice: AirtableRecord<Invoice> | null;
    onClose: () => void;
}

const getStatusBadgeClasses = (status?: string) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full inline-block capitalize tracking-wide';
    switch (status) {
        case 'Paid': return `${base} bg-green-100 text-green-800`;
        case 'Sent': return `${base} bg-blue-100 text-blue-800`;
        case 'Overdue': return `${base} bg-red-100 text-red-800`;
        case 'Void': return `${base} bg-slate-200 text-slate-600`;
        case 'Draft':
        default:
            return `${base} bg-yellow-100 text-yellow-800`;
    }
};

const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return 'KES 0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'KES',
        minimumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC', // Assume dates from Airtable are UTC
    });
};


const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({ invoice, onClose }) => {
    const { feeNoteLineItems } = useAirtableData();

    const linkedLineItems = useMemo(() => {
        if (!invoice) return [];
        const currentInvoiceId = invoice.id;
        // Filter all line items to find the ones that are linked to the current invoice ID.
        // This is more robust as it doesn't depend on a reciprocal link field on the Invoice table.
        return feeNoteLineItems.filter(item => {
            return item.fields['Fee Note']?.includes(currentInvoiceId);
        });
    }, [invoice, feeNoteLineItems]);


    if (!invoice) return null;

    const { fields } = invoice;
    const balanceDue = (fields['Total Amount'] || 0) - (fields['Amount Paid'] || 0);

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="invoice-detail-title">
            <div className="modal-content !max-w-3xl" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500"
                    aria-label="Close invoice details"
                >
                    <X className="w-6 h-6" />
                </button>

                <header className="pb-4 mb-6 border-b border-slate-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 id="invoice-detail-title" className="text-3xl font-bold text-slate-800">
                                Invoice #{fields['Invoice #']}
                            </h2>
                            <p className="text-lg text-slate-500 font-medium mt-1">
                                For: {fields['Matter Name (from Matter)']?.[0] || 'N/A'}
                            </p>
                        </div>
                        <span className={getStatusBadgeClasses(fields.Status)}>
                            {fields.Status}
                        </span>
                    </div>
                </header>

                <div className="modal-body-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
                        <div className="flex items-center gap-2"><User className="w-5 h-5 text-slate-400"/><strong>Client:</strong><span className="ml-2 text-slate-800 font-medium">{fields['Client Name (from Matter)']?.[0] || 'N/A'}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-slate-400"/><strong>Issue Date:</strong><span className="ml-2 text-slate-800 font-medium">{formatDate(fields['Issue Date'])}</span></div>
                        <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-slate-400"/><strong>Due Date:</strong><span className="ml-2 text-slate-800 font-medium">{formatDate(fields['Due Date'])}</span></div>
                        {fields['Date Paid'] && <div className="flex items-center gap-2"><Calendar className="w-5 h-5 text-green-500"/><strong>Date Paid:</strong><span className="ml-2 text-slate-800 font-medium">{formatDate(fields['Date Paid'])}</span></div>}
                    </div>

                    <div className="mt-6">
                        <h4 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-3 flex items-center">
                           <FileText className="w-5 h-5 mr-2.5 text-custom-indigo-500"/>
                           Line Items
                        </h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="p-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Description</th>
                                        <th className="p-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {linkedLineItems.map(item => (
                                        <tr key={item.id} className="border-b border-slate-100 last:border-b-0">
                                            <td className="p-3 text-slate-700">{item.fields.Description}</td>
                                            <td className="p-3 text-right text-slate-800 font-mono">{formatCurrency(item.fields.Amount)}</td>
                                        </tr>
                                    ))}
                                    {linkedLineItems.length === 0 && (
                                        <tr>
                                            <td colSpan={2} className="p-4 text-center text-slate-500 italic">No line items found for this invoice.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                        <div className="w-full max-w-sm space-y-2">
                             <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium">Subtotal</span>
                                <span className="font-mono">{formatCurrency(fields['Total Amount'])}</span>
                             </div>
                              <div className="flex justify-between items-center text-slate-600">
                                <span className="font-medium">Amount Paid</span>
                                <span className="font-mono text-green-600">-{formatCurrency(fields['Amount Paid'])}</span>
                             </div>
                             <div className="flex justify-between items-center text-lg text-slate-800 pt-2 border-t border-slate-200 mt-2">
                                <span className="font-bold">Balance Due</span>
                                <span className="font-bold font-mono">{formatCurrency(balanceDue)}</span>
                             </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default InvoiceDetailModal;
