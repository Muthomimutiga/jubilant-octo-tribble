

import React, { useState, useEffect } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { Contact } from '../types';
import { X, User, Building } from 'lucide-react';
import MatterAutocomplete from './MatterAutocomplete';
import { useToast } from '../contexts/ToastContext';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type ContactType = 'Person' | 'Company';
const CONTACT_CATEGORIES = ['Client', 'Opposing Counsel', 'GAL', 'Opposing Party', 'Court Administrator', 'Registry', 'Other'];

export const ContactFormModal: React.FC<ContactFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<Partial<Contact>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Contact, string>>>({});
  const [contactType, setContactType] = useState<ContactType>('Person');
  const [customCategory, setCustomCategory] = useState('');

  const { matters, loading: loadingMatters } = useAirtableData();
  const { createRecord, loading: mutationLoading, error: mutationError } = useAirtableMutation();
  const { addToast } = useToast();

  const resetForm = (type: ContactType) => {
    setFormData({ Type: type, Category: 'Client', 'Client Status': 'Active' });
    setFormErrors({});
    setCustomCategory('');
  };

  useEffect(() => {
    if (isOpen) {
      resetForm(contactType);
    }
  }, [isOpen]);

  useEffect(() => {
    resetForm(contactType);
  }, [contactType]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'customCategory') {
        setCustomCategory(value);
        if (formErrors.Category) {
            setFormErrors(prev => ({ ...prev, Category: undefined }));
        }
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof Contact]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }
  };
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Contact, string>> = {};
    if (contactType === 'Person') {
        if (!formData['First Name']?.trim()) errors['First Name'] = 'First name is required.';
        if (!formData['Last Name']?.trim()) errors['Last Name'] = 'Last name is required.';
    } else {
        if (!formData['Company Name']?.trim()) errors['Company Name'] = 'Company name is required.';
    }
    if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
        errors.Email = 'Please enter a valid email address.';
    }
    if (formData.Category === 'Other' && !customCategory.trim()) {
        errors.Category = 'Please specify the category.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || mutationLoading) return;
    
    const payload: Partial<Contact> = { ...formData };
    if (payload.Category === 'Other') {
        payload.Category = customCategory.trim();
    }
    
    if (contactType === 'Person') {
        payload.Name = `${formData['First Name'] || ''} ${formData['Last Name'] || ''}`.trim();
    } else {
        payload.Name = formData['Company Name'];
    }

    try {
        await createRecord('Contacts', payload as Contact);
        addToast('Contact created successfully!', 'success');
        onSuccess();
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        addToast(`Error creating contact: ${err.message}`, 'error');
        console.error("Failed to save contact:", error);
    }
  };

  const renderPersonFields = () => (
    <>
        <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-4 border-b pb-2">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="form-group"><label htmlFor="First Name" className="form-label">First Name</label><input type="text" id="First Name" name="First Name" value={formData['First Name'] || ''} onChange={handleChange} className={`form-input ${formErrors['First Name'] ? 'border-red-500' : ''}`} required /><p className="form-error">{formErrors['First Name']}</p></div>
            <div className="form-group"><label htmlFor="Last Name" className="form-label">Last Name</label><input type="text" id="Last Name" name="Last Name" value={formData['Last Name'] || ''} onChange={handleChange} className={`form-input ${formErrors['Last Name'] ? 'border-red-500' : ''}`} required /><p className="form-error">{formErrors['Last Name']}</p></div>
            <div className="form-group"><label htmlFor="Middle Name" className="form-label">Middle Name (opt)</label><input type="text" id="Middle Name" name="Middle Name" value={formData['Middle Name'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="Date of Birth" className="form-label">Date of Birth</label><input type="date" id="Date of Birth" name="Date of Birth" value={formData['Date of Birth'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="National ID" className="form-label">National ID</label><input type="text" id="National ID" name="National ID" value={formData['National ID'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="Sex" className="form-label">Sex</label><select id="Sex" name="Sex" value={formData.Sex || ''} onChange={handleChange} className="form-select"><option value="">Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option></select></div>
            <div className="form-group"><label htmlFor="Marital Status" className="form-label">Marital Status</label><select id="Marital Status" name="Marital Status" value={formData['Marital Status'] || ''} onChange={handleChange} className="form-select"><option value="">Select...</option><option value="Single">Single</option><option value="Married">Married</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option></select></div>
            <div className="form-group"><label htmlFor="Spouse Name" className="form-label">Spouse Name (opt)</label><input type="text" id="Spouse Name" name="Spouse Name" value={formData['Spouse Name'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="Occupation" className="form-label">Occupation</label><input type="text" id="Occupation" name="Occupation" value={formData['Occupation'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="Employer" className="form-label">Employer</label><input type="text" id="Employer" name="Employer" value={formData['Employer'] || ''} onChange={handleChange} className="form-input" /></div>
        </div>
    </>
  );

  const renderCompanyFields = () => (
    <>
      <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-4 border-b pb-2">Company Information</h3>
      <div className="form-group mb-4"><label htmlFor="Company Name" className="form-label">Company Name</label><input type="text" id="Company Name" name="Company Name" value={formData['Company Name'] || ''} onChange={handleChange} className={`form-input ${formErrors['Company Name'] ? 'border-red-500' : ''}`} required /><p className="form-error">{formErrors['Company Name']}</p></div>
      <h4 className="text-md font-semibold text-slate-600 mt-4 mb-2">Primary Contact Person</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        <div className="form-group"><label htmlFor="Contact Person Name" className="form-label">Full Name</label><input type="text" id="Contact Person Name" name="Contact Person Name" value={formData['Contact Person Name'] || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="Contact Person Position" className="form-label">Position</label><input type="text" id="Contact Person Position" name="Contact Person Position" value={formData['Contact Person Position'] || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="Contact Person Phone" className="form-label">Phone</label><input type="tel" id="Contact Person Phone" name="Contact Person Phone" value={formData['Contact Person Phone'] || ''} onChange={handleChange} className="form-input" /></div>
        <div className="form-group"><label htmlFor="Contact Person Email" className="form-label">Email</label><input type="email" id="Contact Person Email" name="Contact Person Email" value={formData['Contact Person Email'] || ''} onChange={handleChange} className="form-input" /></div>
      </div>
    </>
  );

  const renderCommonFields = () => (
    <>
        <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-4 border-b pb-2">Contact Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="form-group"><label htmlFor="Email" className="form-label">Email Address</label><input type="email" id="Email" name="Email" value={formData.Email || ''} onChange={handleChange} className={`form-input ${formErrors.Email ? 'border-red-500' : ''}`}/><p className="form-error">{formErrors.Email}</p></div>
            <div className="form-group"><label htmlFor="Primary Phone" className="form-label">Primary Phone</label><input type="tel" id="Primary Phone" name="Primary Phone" value={formData['Primary Phone'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="Secondary Phone" className="form-label">Secondary Phone</label><input type="tel" id="Secondary Phone" name="Secondary Phone" value={formData['Secondary Phone'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="Website" className="form-label">Website (optional)</label><input type="url" id="Website" name="Website" value={formData.Website || ''} onChange={handleChange} className="form-input" placeholder="https://..."/></div>
            <div className="form-group md:col-span-2"><label htmlFor="Physical Address" className="form-label">Physical Address</label><textarea id="Physical Address" name="Physical Address" value={formData['Physical Address'] || ''} onChange={handleChange} className="form-textarea" rows={2}></textarea></div>
            <div className="form-group md:col-span-2"><label htmlFor="Postal address" className="form-label">Postal Address</label><textarea id="Postal address" name="Postal address" value={formData['Postal address'] || ''} onChange={handleChange} className="form-textarea" rows={2}></textarea></div>
        </div>
    </>
  );
  
  const renderClientSpecificFields = () => (
    <>
        <h3 className="text-lg font-semibold text-slate-700 mt-6 mb-4 border-b pb-2">Additional Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="form-group"><label htmlFor="Date of Instruction" className="form-label">Date of Instruction</label><input type="date" id="Date of Instruction" name="Date of Instruction" value={formData['Date of Instruction'] || ''} onChange={handleChange} className="form-input" /></div>
            <div className="form-group"><label htmlFor="Client Status" className="form-label">Client Status</label><select id="Client Status" name="Client Status" value={formData['Client Status'] || ''} onChange={handleChange} className="form-select"><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Prospect">Prospect</option></select></div>
            <div className="form-group md:col-span-2"><label htmlFor="Matter" className="form-label">Link to Initial Matter</label><MatterAutocomplete matters={matters} selectedId={formData.Matter?.[0] || null} onSelect={(id) => setFormData(prev => ({...prev, Matter: id ? [id] : []}))} placeholder='(Optional) Link to a matter...' disabled={loadingMatters}/></div>
            <div className="form-group md:col-span-2"><label htmlFor="Description" className="form-label">Notes/Description</label><textarea id="Description" name="Description" value={formData['Description'] || ''} onChange={handleChange} className="form-textarea" rows={3}></textarea></div>
        </div>
    </>
  );

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content !max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close form">
          <X className="w-6 h-6" />
        </button>

        <header className="pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-slate-800">Add New Contact</h2>
        </header>
        
        <form onSubmit={handleSubmit} noValidate>
            <div className="contact-form-toggle">
                <div className="contact-form-toggle-inner">
                    <button type="button" onClick={() => setContactType('Person')} className={`contact-form-toggle-button ${contactType === 'Person' ? 'is-active' : ''}`}><User className="w-5 h-5" />Person</button>
                    <button type="button" onClick={() => setContactType('Company')} className={`contact-form-toggle-button ${contactType === 'Company' ? 'is-active' : ''}`}><Building className="w-5 h-5" />Company</button>
                </div>
            </div>
            
            <div className="form-group mb-4">
                <label htmlFor="Category" className="form-label">Category</label>
                <div className="flex gap-4">
                    <select id="Category" name="Category" value={formData.Category || ''} onChange={handleChange} className="form-select flex-grow">
                        {CONTACT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    {formData.Category === 'Other' && (
                        <input type="text" name="customCategory" value={customCategory} onChange={handleChange} placeholder="Please specify" className={`form-input flex-grow ${formErrors.Category ? 'border-red-500' : ''}`} />
                    )}
                </div>
                 {formErrors.Category && <p className="form-error">{formErrors.Category}</p>}
            </div>

            {contactType === 'Person' ? renderPersonFields() : renderCompanyFields()}
            {renderCommonFields()}
            {formData.Category === 'Client' && renderClientSpecificFields()}

            {mutationError && (
                <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                    <strong>Error:</strong> {mutationError.message}
                </div>
            )}

            <footer className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-slate-200">
                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={mutationLoading}>
                    {mutationLoading ? 'Saving...' : 'Create Contact'}
                </button>
            </footer>
        </form>
      </div>
    </div>
  );
};