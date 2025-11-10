
import React, { useState, useEffect } from 'react';
import { AirtableRecord, Task } from '../types';
import { X, Loader2 } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import MatterAutocomplete from './MatterAutocomplete';
import UserAutocomplete from './UserAutocomplete';
import { useToast } from '../contexts/ToastContext';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: AirtableRecord<Task> | null;
  defaultDate?: Date | null;
}

const TaskFormModal: React.FC<TaskFormModalProps> = ({ isOpen, onClose, onSuccess, taskToEdit, defaultDate }) => {
  const [formData, setFormData] = useState<Partial<Task>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Task, string>>>({});

  const { matters, allUsers, loading: loadingData, refetchTasks } = useAirtableData();
  const { createRecord, updateRecord, loading: isSubmitting, error: mutationError } = useAirtableMutation();
  const { addToast } = useToast();

  const isEditMode = !!taskToEdit;

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && taskToEdit) {
      const dueDate = taskToEdit.fields['Due Date'] 
        ? new Date(taskToEdit.fields['Due Date']).toISOString().split('T')[0] 
        : '';
      setFormData({ ...taskToEdit.fields, 'Due Date': dueDate });
    } else {
      setFormData({
        'Status': 'To-Do',
        'Priority': 'Medium',
        'Due Date': defaultDate ? defaultDate.toISOString().split('T')[0] : '',
      });
    }
    setFormErrors({});
  }, [taskToEdit, isEditMode, isOpen, defaultDate]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof Task]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Task, string>> = {};
    if (!formData['Task Name']?.trim()) {
        errors['Task Name'] = 'Task Name is required.';
    }
    if (!formData['Matter'] || formData['Matter'].length === 0) {
        errors['Matter'] = 'A matter must be selected.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    const payload: Partial<Task> = {
      'Task Name': formData['Task Name'],
      'Matter': formData['Matter'],
      'Status': formData['Status'],
      'Priority': formData['Priority'],
      'Due Date': formData['Due Date'] || null, 
      'Description': formData['Description'],
      'Assignee': formData['Assignee'] || null,
    };
    
    if (!payload.Description) {
      delete payload.Description;
    }
    
    try {
        if (isEditMode && taskToEdit) {
            await updateRecord('Tasks', taskToEdit.id, payload);
        } else {
            await createRecord('Tasks', payload as Task);
        }
        addToast(`Task ${isEditMode ? 'updated' : 'created'} successfully!`, 'success');
        refetchTasks(); // Refetch data
        onSuccess(); // Signal success to parent
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        addToast(`Error saving task: ${err.message}`, 'error');
        console.error("Failed to save task:", err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="task-form-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close form">
          <X className="w-6 h-6" />
        </button>

        <header className="pb-4 mb-6 border-b border-slate-200">
          <h2 id="task-form-title" className="text-3xl font-bold text-slate-800">{isEditMode ? 'Edit Task' : 'Create New Task'}</h2>
        </header>
        
        <form onSubmit={handleSubmit} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            <div className="form-group md:col-span-2">
              <label htmlFor="Task Name" className="form-label">Task Name</label>
              <input type="text" id="Task Name" name="Task Name" value={formData['Task Name'] || ''} onChange={handleChange} className={`form-input ${formErrors['Task Name'] ? 'border-red-500' : ''}`} required />
              {formErrors['Task Name'] && <p className="form-error">{formErrors['Task Name']}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="Matter" className="form-label">Matter</label>
                <MatterAutocomplete 
                    matters={matters}
                    selectedId={formData.Matter?.[0] || null}
                    onSelect={(id) => setFormData(prev => ({...prev, Matter: id ? [id] : []}))}
                    placeholder='Search for a matter...'
                    disabled={loadingData}
                />
                {formErrors.Matter && <p className="form-error">{formErrors.Matter}</p>}
            </div>

            <div className="form-group">
                <label htmlFor="Assignee" className="form-label">Assign to (optional)</label>
                <UserAutocomplete 
                    users={allUsers}
                    selectedId={formData.Assignee?.[0] || null}
                    onSelect={(id) => setFormData(prev => ({ ...prev, Assignee: id ? [id] : [] }))}
                    placeholder="Search for a user..."
                    disabled={loadingData}
                />
            </div>
            
            <div className="form-group">
              <label htmlFor="Status" className="form-label">Status</label>
              <select id="Status" name="Status" value={formData['Status'] || 'To-Do'} onChange={handleChange} className="form-select">
                <option value="To-Do">To-Do</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Priority" className="form-label">Priority</label>
              <select id="Priority" name="Priority" value={formData['Priority'] || 'Medium'} onChange={handleChange} className="form-select">
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="form-group md:col-span-2">
              <label htmlFor="Due Date" className="form-label">Due Date (optional)</label>
              <input type="date" id="Due Date" name="Due Date" value={formData['Due Date'] || ''} onChange={handleChange} className="form-input" />
            </div>
          </div>
          
          <div className="form-group mb-6">
            <label htmlFor="Description" className="form-label">Description (optional)</label>
            <textarea id="Description" name="Description" value={formData.Description || ''} onChange={handleChange} className="form-textarea" rows={4}></textarea>
          </div>

          {mutationError && (
              <div className="my-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                  <strong>Error:</strong> {mutationError.message}
              </div>
          )}

          <footer className="flex justify-end items-center gap-4 pt-4 border-t border-slate-200">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Cancel</button>
            <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditMode ? 'Save Changes' : 'Create Task')}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
};

export default TaskFormModal;
