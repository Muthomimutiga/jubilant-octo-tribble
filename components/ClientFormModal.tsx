import React, { useState, useEffect } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { Client, AirtableRecord, User } from '../types';
import { X, User as UserIcon, Building } from 'lucide-react';
import MatterAutocomplete from './MatterAutocomplete';
import { useToast } from '../contexts/ToastContext';
import UserMultiSelect from './UserMultiSelect';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  clientToEdit?: AirtableRecord<Client> | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSuccess, clientToEdit }) => {
  const [formData, setFormData] = useState<Partial<Client>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Client, string>>>({});

  const { matters, allUsers, loading: loadingData, refetchClients } = useAirtableData();
  const { createRecord, updateRecord, loading: mutationLoading, error: mutationError } = useAirtableMutation();
  const { addToast } = useToast();
  const isEditMode = !!clientToEdit;

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && clientToEdit) {
        const formattedData = { ...clientToEdit.fields };
        if (formattedData['Date of birth']) {
            formattedData['Date of birth'] = new Date(formattedData['Date of birth']).toISOString().split('T')[0];
        }
        if (formattedData['Date of instruction']) {
            formattedData['Date of instruction'] = new Date(formattedData['Date of instruction']).toISOString().split('T')[0];
        }
        setFormData(formattedData);
    } else {
        setFormData({
            'Client type': 'Individual',
            'Client status': 'Active',
        });
    }
    setFormErrors({});
  }, [isOpen, clientToEdit, isEditMode]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof Client]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Client, string>> = {};
    if (!formData['Client Name']?.trim()) errors['Client Name'] = 'Client Name is required.';
    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
        errors.Email = 'Please enter a valid email address.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || mutationLoading) return;
    
    try {
        if (isEditMode && clientToEdit) {
            await updateRecord('Clients', clientToEdit.id, formData);
            addToast('Client updated successfully!', 'success');
        } else {
            await createRecord('Clients', formData as Client);
            addToast('Client created successfully!', 'success');
        }
        refetchClients();
        onSuccess();
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        addToast(`Error saving client: ${err.message}`, 'error');
        console.error("Failed to save client:", error);
    }
  };
  
  const clientType = formData['Client type'] || 'Individual';
  const setClientType = (type: 'Individual' | 'Business') => {
      setFormData(prev => ({ ...prev, 'Client type': type }));
  };

  const renderIndividualFields = () => (
    <>
        <div className="form-group"><label htmlFor="Last name" className="form-label">Last Name</label><input type="text" id="Last name" name="Last name" value={formData['Last name'] || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="Sex" className="form-label">Sex</label><select id="Sex" name="Sex" value={formData.Sex || ''} onChange={handleChange} className="form-select"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
        <div className="form-group"><label htmlFor="Marital status" className="form-label">Marital Status</label><select id="Marital status" name="Marital status" value={formData['Marital status'] || ''} onChange={handleChange} className="form-select"><option value="">Select...</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></div>
        <div className="form-group"><label htmlFor="Spouse name" className="form-label">Spouse Name</label><input type="text" id="Spouse name" name="Spouse name" value={formData['Spouse name'] || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="Date of birth" className="form-label">Date of Birth</label><input type="date" id="Date of birth" name="Date of birth" value={formData['Date of birth'] || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="National ID" className="form-label">National ID</label><input type="text" id="National ID" name="National ID" value={formData['National ID'] || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="Occupation" className="form-label">Occupation</label><input type="text" id="Occupation" name="Occupation" value={formData.Occupation || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="Employer" className="form-label">Employer</label><input type="text" id="Employer" name="Employer" value={formData.Employer || ''} onChange={handleChange} className="form-input" /></div>
    </>
  );

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content !max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close form">
          <X className="w-6 h-6" />
        </button>
        <header className="pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Edit Client' : 'Add New Client'}</h2>
        </header>
        <form onSubmit={handleSubmit} noValidate>
            <div className="contact-form-toggle">
                <div className="contact-form-toggle-inner">
                    <button type="button" onClick={() => setClientType('Individual')} className={`contact-form-toggle-button ${clientType === 'Individual' ? 'is-active' : ''}`}><UserIcon className="w-5 h-5" />Individual</button>
                    <button type="button" onClick={() => setClientType('Business')} className={`contact-form-toggle-button ${clientType === 'Business' ? 'is-active' : ''}`}><Building className="w-5 h-5" />Business</button>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="form-group md:col-span-2">
                    <label htmlFor="Client Name" className="form-label">{clientType === 'Individual' ? 'Full Name' : 'Company Name'}</label>
                    <input type="text" id="Client Name" name="Client Name" value={formData['Client Name'] || ''} onChange={handleChange} className={`form-input ${formErrors['Client Name'] ? 'border-red-500' : ''}`} required />
                    {formErrors['Client Name'] && <p className="form-error">{formErrors['Client Name']}</p>}
                </div>

                {clientType === 'Individual' && renderIndividualFields()}
                
                <div className="form-group"><label htmlFor="Email" className="form-label">Email Address</label><input type="email" id="Email" name="Email" value={formData.Email || ''} onChange={handleChange} className={`form-input ${formErrors.Email ? 'border-red-500' : ''}`} /><p className="form-error">{formErrors.Email}</p></div>
                <div className="form-group"><label htmlFor="Phone Number" className="form-label">Phone Number</label><input type="tel" id="Phone Number" name="Phone Number" value={formData['Phone Number'] || ''} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label htmlFor="Postal address" className="form-label">Postal Address</label><input type="text" id="Postal address" name="Postal address" value={formData['Postal address'] || ''} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label htmlFor="Physical address" className="form-label">Physical Address</label><input type="text" id="Physical address" name="Physical address" value={formData['Physical address'] || ''} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label htmlFor="Date of instruction" className="form-label">Date of Instruction</label><input type="date" id="Date of instruction" name="Date of instruction" value={formData['Date of instruction'] || ''} onChange={handleChange} className="form-input" /></div>
                <div className="form-group"><label htmlFor="Client status" className="form-label">Client Status</label><select id="Client status" name="Client status" value={formData['Client status'] || ''} onChange={handleChange} className="form-select"><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Prospect">Prospect</option></select></div>
                
                <div className="md:col-span-2">
                    <UserMultiSelect allUsers={allUsers} selectedIds={formData['Assigned Attorney'] || []} onSelectionChange={(ids) => setFormData(prev => ({...prev, 'Assigned Attorney': ids}))} label="Assigned Attorney" disabled={loadingData} />
                </div>
                <div className="md:col-span-2">
                    <UserMultiSelect allUsers={allUsers} selectedIds={formData['Brief Assistant'] || []} onSelectionChange={(ids) => setFormData(prev => ({...prev, 'Brief Assistant': ids}))} label="Brief Assistant" disabled={loadingData} />
                </div>

                <div className="form-group md:col-span-2"><label htmlFor="Notes" className="form-label">Notes</label><textarea id="Notes" name="Notes" value={formData.Notes || ''} onChange={handleChange} className="form-textarea" rows={3}></textarea></div>
            </div>
            {mutationError && <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm"><strong>Error:</strong> {mutationError.message}</div>}
            <footer className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-slate-200">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={mutationLoading}>
                    {mutationLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Client')}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};
