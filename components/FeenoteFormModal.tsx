

import React, { useState, useEffect, useMemo } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { Invoice, FeeNoteLineItem } from '../types';
import { X } from 'lucide-react';
import MatterAutocomplete from './MatterAutocomplete';
import { useToast } from '../contexts/ToastContext';

interface FeenoteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const FeenoteFormModal: React.FC<FeenoteFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Invoice & FeeNoteLineItem>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof (Invoice & FeeNoteLineItem), string>>>({});
  
  const { matters, loading: loadingMatters, refetchInvoices, refetchFeeNoteLineItems } = useAirtableData();
  const { createRecord, loading: mutationLoading, error: mutationError } = useAirtableMutation();
  const { addToast } = useToast();

  const resetForm = () => {
    setFormData({
      'Status': 'Draft',
      'Issue Date': new Date().toISOString().split('T')[0],
      'Amount': 0,
      'Amount Paid': 0,
    });
    setFormErrors({});
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.Status === 'Paid' && !formData['Date Paid']) {
        setFormData(prev => ({...prev, 'Date Paid': new Date().toISOString().split('T')[0]}))
    }
  }, [formData.Status]);

  const selectedMatter = useMemo(() => {
    if (!formData.Matter?.[0]) return null;
    return matters.find(m => m.id === formData.Matter[0]);
  }, [formData.Matter, matters]);

  const clientNameRaw = selectedMatter?.fields['Client Name (from Client)'];
  const clientName = (Array.isArray(clientNameRaw) ? clientNameRaw.join(', ') : clientNameRaw) || 'N/A';
  
  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof typeof formData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.Matter || formData.Matter.length === 0) errors.Matter = 'A matter must be selected.';
    if (!formData['Issue Date']) errors['Issue Date'] = 'Issue date is required.';
    if (!formData.Description?.trim()) errors.Description = 'A description for the line item is required.';
    if (!formData.Amount || formData.Amount <= 0) {
        errors.Amount = 'A valid amount for the line item is required.';
    }
    if (formData.Status === 'Paid' && !formData['Date Paid']) {
        errors['Date Paid'] = 'Date Paid is required when status is Paid.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || mutationLoading) return;

    try {
        const invoicePayload: Partial<Invoice> = {
            'Matter': formData.Matter,
            'Status': formData.Status,
            'Issue Date': formData['Issue Date'],
            'Due Date': formData['Due Date'] || null,
            'Billed By': formData['Billed By'] || null,
            'Amount Paid': Number(formData['Amount Paid'] || 0)
        };

        if (invoicePayload.Status === 'Paid') {
            invoicePayload['Date Paid'] = formData['Date Paid'];
        }

        const newInvoiceRecord = await createRecord('Fee Notes', invoicePayload);
        
        const lineItemPayload: Partial<FeeNoteLineItem> = {
            'Description': formData.Description,
            'Amount': Number(formData.Amount),
            'Fee Note': [newInvoiceRecord.id]
        };
        await createRecord('Line Items', lineItemPayload);

        addToast('Feenote created successfully!', 'success');
        refetchInvoices();
        refetchFeeNoteLineItems();
        onSuccess();
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        addToast(`Error creating feenote: ${err.message}`, 'error');
        console.error("Failed to save feenote:", error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close form">
          <X className="w-6 h-6" />
        </button>

        <header className="pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-slate-800">Raise New Feenote</h2>
          <p className="text-slate-500 mt-1">Create a new invoice and its first billable item.</p>
        </header>
        
        <form onSubmit={handleSubmit} noValidate>
            <div className="space-y-6">
              
              <fieldset>
                <legend className="text-lg font-semibold text-slate-700 mb-2">Invoice Details</legend>
                <div className="space-y-4">
                  <div className="form-group">
                      <label htmlFor="Matter" className="form-label">Matter</label>
                      <MatterAutocomplete 
                          matters={matters}
                          selectedId={formData.Matter?.[0] || null}
                          onSelect={(id) => {
                              setFormData(prev => ({...prev, Matter: id ? [id] : []}));
                              if(formErrors.Matter) setFormErrors(prev => ({...prev, Matter: undefined}));
                          }}
                          placeholder='Search and select a matter'
                          disabled={loadingMatters}
                      />
                      {formErrors.Matter && <p className="form-error">{formErrors.Matter}</p>}
                  </div>
                  <div className="form-group">
                      <label htmlFor="Client" className="form-label">Client</label>
                      <input type="text" id="Client" value={clientName} className="form-input bg-slate-100" readOnly disabled />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label htmlFor="Issue Date" className="form-label">Issue Date</label>
                      <input type="date" id="Issue Date" name="Issue Date" value={formData['Issue Date'] || ''} onChange={handleChange} className={`form-input ${formErrors['Issue Date'] ? 'border-red-500' : ''}`} />
                      {formErrors['Issue Date'] && <p className="form-error">{formErrors['Issue Date']}</p>}
                    </div>
                    <div className="form-group">
                      <label htmlFor="Due Date" className="form-label">Due Date (optional)</label>
                      <input type="date" id="Due Date" name="Due Date" value={formData['Due Date'] || ''} onChange={handleChange} className="form-input" />
                    </div>
                     <div className="form-group">
                        <label htmlFor="Status" className="form-label">Status</label>
                        <select id="Status" name="Status" value={formData['Status'] || 'Draft'} onChange={handleChange} className="form-select">
                            <option value="Draft">Draft</option>
                            <option value="Sent">Sent</option>
                            <option value="Paid">Paid</option>
                            <option value="Overdue">Overdue</option>
                            <option value="Void">Void</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="Billed By" className="form-label">Billed by (optional)</label>
                        <input type="text" id="Billed By" name="Billed By" value={formData['Billed By'] || ''} onChange={handleChange} className="form-input" placeholder="e.g. Your Name" />
                    </div>
                    
                    {formData.Status === 'Paid' ? (
                        <>
                            <div className="form-group">
                                <label htmlFor="Amount Paid" className="form-label">Amount Paid (KES)</label>
                                <input type="number" id="Amount Paid" name="Amount Paid" value={formData['Amount Paid'] || ''} onChange={handleChange} className="form-input" placeholder="e.g. 50000" min="0" step="any" />
                            </div>
                            <div className="form-group">
                                <label htmlFor="Date Paid" className="form-label">Date Paid</label>
                                <input type="date" id="Date Paid" name="Date Paid" value={formData['Date Paid'] || ''} onChange={handleChange} className={`form-input ${formErrors['Date Paid'] ? 'border-red-500' : ''}`} />
                                {formErrors['Date Paid'] && <p className="form-error">{formErrors['Date Paid']}</p>}
                            </div>
                        </>
                    ) : (
                         <div className="form-group md:col-span-2">
                            <label htmlFor="Amount Paid" className="form-label">Amount Paid (KES, optional)</label>
                            <input type="number" id="Amount Paid" name="Amount Paid" value={formData['Amount Paid'] || ''} onChange={handleChange} className="form-input" placeholder="e.g. 50000" min="0" step="any" />
                        </div>
                    )}
                  </div>
                </div>
              </fieldset>
              
              <fieldset>
                <legend className="text-lg font-semibold text-slate-700 mb-2 pt-4 border-t">First Line Item</legend>
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <div className="form-group">
                       <label htmlFor="Description" className="form-label">Description</label>
                       <input type="text" id="Description" name="Description" value={formData.Description || ''} onChange={handleChange} className={`form-input ${formErrors.Description ? 'border-red-500' : ''}`} placeholder="e.g. Professional Fees for Conveyancing" />
                       {formErrors.Description && <p className="form-error">{formErrors.Description}</p>}
                  </div>
                  <div className="form-group">
                       <label htmlFor="Amount" className="form-label">Amount (KES)</label>
                       <input type="number" id="Amount" name="Amount" value={formData.Amount || ''} onChange={handleChange} className={`form-input ${formErrors.Amount ? 'border-red-500' : ''}`} placeholder="e.g. 150000" min="0" step="any" />
                       {formErrors.Amount && <p className="form-error">{formErrors.Amount}</p>}
                  </div>
                </div>
              </fieldset>

            </div>

            {mutationError && (
                <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                    <strong>Error:</strong> {mutationError.message}
                </div>
            )}

            <footer className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-slate-200">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={mutationLoading}>
                    {mutationLoading ? 'Saving...' : 'Create Feenote'}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};

export default FeenoteFormModal;