

import React, { useState } from 'react';
import { AirtableRecord, Invoice, Matter } from '../types';
import { ChevronDown, FileText } from 'lucide-react';
import './MatterInvoiceAccordion.css';

interface MatterInvoiceAccordionProps {
    matterGroup: {
        matter: AirtableRecord<Matter>;
        invoices: AirtableRecord<Invoice>[];
    };
    onInvoiceClick: (invoice: AirtableRecord<Invoice>) => void;
}

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
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
};

const getStatusBadgeClasses = (status?: string) => {
    const base = 'px-2 py-0.5 text-xs font-semibold rounded-full inline-block capitalize tracking-wide';
    switch (status) {
        case 'Paid': return `${base} bg-green-100 text-green-700`;
        case 'Sent': return `${base} bg-blue-100 text-blue-700`;
        case 'Overdue': return `${base} bg-red-100 text-red-700`;
        case 'Void': return `${base} bg-slate-200 text-slate-500`;
        case 'Draft':
        default:
            return `${base} bg-yellow-100 text-yellow-700`;
    }
};

const MatterInvoiceAccordion: React.FC<MatterInvoiceAccordionProps> = ({ matterGroup, onInvoiceClick }) => {
    const { matter, invoices } = matterGroup;
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="matter-invoice-accordion">
            <button
                type="button"
                className="matter-invoice-header"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={`matter-invoices-${matter.id}`}
            >
                <div className="matter-invoice-title">
                    <h3 className="matter-name">{matter.fields['Matter Name'] || 'Unnamed Matter'}</h3>
                    <span className="matter-file-number">{matter.fields['File Number']}</span>
                </div>
                <div className="matter-invoice-info">
                    <span className="matter-invoice-count">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
                    <ChevronDown className={`matter-invoice-chevron ${isOpen ? 'is-open' : ''}`} />
                </div>
            </button>
            {isOpen && (
                <div id={`matter-invoices-${matter.id}`} className="matter-invoice-content">
                    {invoices.map(invoice => (
                        <div 
                            key={invoice.id} 
                            className="activity-item"
                            onClick={() => onInvoiceClick(invoice)}
                            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onInvoiceClick(invoice)}
                            role="button"
                            tabIndex={0}
                            aria-label={`View details for Invoice #${invoice.fields['Invoice #']}`}
                        >
                            <div className="activity-item-details">
                                <div className="activity-item-icon">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="activity-item-title">Invoice #{invoice.fields['Invoice #']}</p>
                                    <p className="activity-item-subtitle">Issued: {formatDate(invoice.fields['Issue Date'])}</p>
                                </div>
                            </div>
                             <div className="flex items-center gap-4">
                                <span className={getStatusBadgeClasses(invoice.fields.Status)}>
                                    {invoice.fields.Status}
                                </span>
                                <p className="activity-item-amount w-32 text-right">{formatCurrency(invoice.fields['Total Amount'] || 0)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatterInvoiceAccordion;