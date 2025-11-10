
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AirtableRecord, Matter, Client, User } from '../types';
import { X } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import useAirtableMutation from '../hooks/useAirtableMutation';

interface MatterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  matterToEdit?: AirtableRecord<Matter> | null;
}

const MatterFormModal: React.FC<MatterFormModalProps> = ({ isOpen, onClose, onSuccess, matterToEdit }) => {
  const [formData, setFormData] = useState<Partial<Matter>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Matter, string>>>({});
  const initializedForMatterId = useRef<string | null | undefined>(null);

  const { clients, allUsers, loading: loadingData } = useAirtableData();
  const { createRecord, updateRecord, loading: mutationLoading, error: mutationError } = useAirtableMutation();

  // --- State for User Multi-select ---
  const [userQuery, setUserQuery] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userSelectWrapperRef = useRef<HTMLDivElement>(null);
  const userSelectInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!matterToEdit;

 useEffect(() => {
    if (!isOpen) {
      initializedForMatterId.current = null;
      return;
    }

    if (isOpen && initializedForMatterId.current !== matterToEdit?.id) {
      if (isEditMode && matterToEdit) {
        const dateOpened = matterToEdit.fields['Date Opened']
          ? new Date(matterToEdit.fields['Date Opened']).toISOString().split('T')[0]
          : '';
        setFormData({ ...matterToEdit.fields, 'Date Opened': dateOpened });
      } else {
        setFormData({
          'Case Status': 'In-progress',
          'Date Opened': new Date().toISOString().split('T')[0],
          'Brief Assistant': [], // Init empty for new matter
        });
      }
      initializedForMatterId.current = matterToEdit?.id;
    }
  }, [isOpen, matterToEdit, isEditMode]);

  // --- Logic for User Multi-select ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userSelectWrapperRef.current && !userSelectWrapperRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
        setUserQuery('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userSelectWrapperRef]);

  const selectedUsers = useMemo(() => {
    const selectedIds = new Set(formData['Brief Assistant'] || []);
    return allUsers.filter(u => selectedIds.has(u.id));
  }, [formData, allUsers]);

  const filteredUsers = useMemo(() => {
    if (!userQuery) return [];
    const lowerQuery = userQuery.toLowerCase();
    const selectedIdsSet = new Set(formData['Brief Assistant'] || []);
    return allUsers.filter(user => 
        !selectedIdsSet.has(user.id) && 
        (user.fields.Name?.toLowerCase().includes(lowerQuery) || user.fields.Email?.toLowerCase().includes(lowerQuery))
    ).slice(0, 10);
  }, [userQuery, allUsers, formData]);

  const handleUserSelect = (userId: string) => {
    const currentSelection = formData['Brief Assistant'] || [];
    onSelectionChange([...currentSelection, userId]);
    setUserQuery('');
    setIsUserDropdownOpen(false);
  };

  const handleUserRemove = (userId: string) => {
    const currentSelection = formData['Brief Assistant'] || [];
    onSelectionChange(currentSelection.filter(id => id !== userId));
  };
  
  const onSelectionChange = (ids: string[]) => {
      setFormData(prev => ({...prev, 'Brief Assistant': ids}));
  }

  const getAvatar = (user: AirtableRecord<User>) => {
      const avatarUrl = user.fields.Avatar?.[0]?.url;
      const initials = user.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
      return (
          <div className="user-multiselect-pill-avatar">
              {avatarUrl ? (
                  <img src={avatarUrl} alt={user.fields.Name} />
              ) : (
                  <span className="flex items-center justify-center h-full">{initials}</span>
              )}
          </div>
      );
  };
  
  const getDropdownAvatar = (user: AirtableRecord<User>) => {
      const avatarUrl = user.fields.Avatar?.[0]?.url;
      const initials = user.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
      return (
          <div className="user-multiselect-pill-avatar !w-8 !h-8">
              {avatarUrl ? (
                  <img src={avatarUrl} alt={user.fields.Name} />
              ) : (
                   <span className="flex items-center justify-center h-full text-sm font-bold">{initials}</span>
              )}
          </div>
      );
  }

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof Matter]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({...prev, 'Client': value ? [value] : [] }));
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Matter, string>> = {};
    if (!formData['File Number']?.trim()) {
        errors['File Number'] = 'File Number is required.';
    }
    if (!formData['Matter Name']?.trim()) {
        errors['Matter Name'] = 'Matter Name is required.';
    }
    if (!formData['Client'] || formData['Client'].length === 0) {
        errors['Client'] = 'A primary client is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const payload: Partial<Matter> = {
        'File Number': formData['File Number'],
        'Matter Name': formData['Matter Name'],
        'Client': formData['Client'],
        'Brief Assistant': formData['Brief Assistant'],
        'Case Status': formData['Case Status'],
        'Case Type': formData['Case Type'],
        'Date Opened': formData['Date Opened'] || null, 
        'Description': formData.Description,
        'Case Notes': formData['Case Notes'],
    };

    if (!payload['Brief Assistant'] || payload['Brief Assistant'].length === 0) {
        delete payload['Brief Assistant'];
    }
    if (!payload['Case Type']) delete payload['Case Type'];
    if (!payload.Description) delete payload.Description;
    if (!payload['Case Notes']) delete payload['Case Notes'];
    
    try {
        if (isEditMode && matterToEdit) {
            await updateRecord('Matters', matterToEdit.id, payload);
        } else {
            await createRecord('Matters', payload as Matter);
        }
        onSuccess();
    } catch (error) {
        console.error("Failed to save matter:", error);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close form">
          <X className="w-6 h-6" />
        </button>

        <header className="pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Edit Matter' : 'Create New Matter'}</h2>
        </header>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            {/* File Number */}
            <div className="form-group">
              <label htmlFor="File Number" className="form-label">File Number</label>
              <input type="text" id="File Number" name="File Number" value={formData['File Number'] || ''} onChange={handleChange} className={`form-input ${formErrors['File Number'] ? 'border-red-500' : ''}`} required />
              {formErrors['File Number'] && <p className="form-error">{formErrors['File Number']}</p>}
            </div>
            
            {/* Matter Name */}
            <div className="form-group">
              <label htmlFor="Matter Name" className="form-label">Matter Name</label>
              <input type="text" id="Matter Name" name="Matter Name" value={formData['Matter Name'] || ''} onChange={handleChange} className={`form-input ${formErrors['Matter Name'] ? 'border-red-500' : ''}`} required />
              {formErrors['Matter Name'] && <p className="form-error">{formErrors['Matter Name']}</p>}
            </div>

            {/* Clients */}
            <div className="form-group">
              <label htmlFor="Client" className="form-label">Primary Client</label>
              <select id="Client" name="Client" value={formData['Client']?.[0] || ''} onChange={handleClientChange} className={`form-select ${formErrors['Client'] ? 'border-red-500' : ''}`} disabled={loadingData} required>
                <option value="">{loadingData ? 'Loading clients...' : 'Select a client'}</option>
                {clients.map(client => <option key={client.id} value={client.id}>{client.fields['Client Name']}</option>)}
              </select>
              {formErrors['Client'] && <p className="form-error">{formErrors['Client']}</p>}
            </div>

            {/* Assigned Team */}
            <div className="form-group">
                <label className="form-label">Assigned Team</label>
                <div className="user-multiselect-wrapper" ref={userSelectWrapperRef}>
                    <div className={`user-multiselect-input-container ${loadingData ? 'bg-slate-100' : ''}`}>
                        {selectedUsers.map(user => (
                            <div key={user.id} className="user-multiselect-pill">
                                {getAvatar(user)}
                                {user.fields.Name}
                                <button type="button" className="user-multiselect-pill-remove" onClick={() => handleUserRemove(user.id)} aria-label={`Remove ${user.fields.Name}`}>
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                        <input
                            ref={userSelectInputRef}
                            type="text"
                            value={userQuery}
                            onChange={(e) => setUserQuery(e.target.value)}
                            onFocus={() => setIsUserDropdownOpen(true)}
                            placeholder={selectedUsers.length > 0 ? '' : 'Add team members...'}
                            className="user-multiselect-input"
                            disabled={loadingData}
                        />
                    </div>
                     {isUserDropdownOpen && filteredUsers.length > 0 && (
                        <div className="user-multiselect-dropdown">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="user-multiselect-dropdown-item" onClick={() => handleUserSelect(user.id)}>
                                    {getDropdownAvatar(user)}
                                    <div>
                                        <p className="user-multiselect-dropdown-item-name">{user.fields.Name}</p>
                                        <p className="user-multiselect-dropdown-item-email">{user.fields.Email}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            {/* Case Status */}
            <div className="form-group">
              <label htmlFor="Case Status" className="form-label">Case Status</label>
              <select id="Case Status" name="Case Status" value={formData['Case Status'] || 'In-progress'} onChange={handleChange} className="form-select">
                <option value="In-progress">In-progress</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
            
            {/* Case Type */}
            <div className="form-group">
              <label htmlFor="Case Type" className="form-label">Case Type</label>
              <input type="text" id="Case Type" name="Case Type" value={formData['Case Type'] || ''} onChange={handleChange} className="form-input" />
            </div>

            {/* Date Opened */}
            <div className="form-group md:col-span-2">
              <label htmlFor="Date Opened" className="form-label">Date Opened</label>
              <input type="date" id="Date Opened" name="Date Opened" value={formData['Date Opened'] || ''} onChange={handleChange} className="form-input" />
            </div>
          </div>
          
          {/* Description */}
          <div className="form-group mb-4">
            <label htmlFor="Description" className="form-label">Description</label>
            <textarea id="Description" name="Description" value={formData.Description || ''} onChange={handleChange} className="form-textarea" rows={3}></textarea>
          </div>

          {/* Case Notes */}
          <div className="form-group mb-6">
            <label htmlFor="Case Notes" className="form-label">Case Notes</label>
            <textarea id="Case Notes" name="Case Notes" value={formData['Case Notes'] || ''} onChange={handleChange} className="form-textarea" rows={3}></textarea>
          </div>

          {mutationError && (
             <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                <strong>Error:</strong> {mutationError.message}
            </div>
          )}

          <footer className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={mutationLoading}>
              {mutationLoading ? 'Saving...' : (isEditMode ? 'Save Changes' : 'Create Matter')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default MatterFormModal;
