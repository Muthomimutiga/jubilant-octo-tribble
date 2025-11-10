import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAirtableData } from '../contexts/AirtableDataContext';
import { Document, AirtableRecord } from '../types';
import { X, UploadCloud, FileText, Loader2, Link } from 'lucide-react';
import MatterAutocomplete from './MatterAutocomplete';
import { useToast } from '../contexts/ToastContext';
import useAirtableMutation from '../hooks/useAirtableMutation';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isLink: boolean) => void;
  documentToEdit?: AirtableRecord<Document> | null;
}

const CATEGORIES: Document['Category'][] = ['Pleadings', 'Correspondence', 'Discovery', 'Orders', 'Registry Docs', 'Client Docs', 'Authorities', 'Misc'];
const STATUSES: Document['Status'][] = ['Draft', 'Final', 'For Review', 'Archived'];

const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/ahkhm8xme6pt4t32t9wkwpx3rxlbpynw';
const MAX_FILE_SIZE_MB = 4;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type UploadMethod = 'upload' | 'link';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});


const DocumentFormModal: React.FC<DocumentFormModalProps> = ({ isOpen, onClose, onSuccess, documentToEdit }) => {
  const [formData, setFormData] = useState<Partial<Document>>({});
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Document | 'File' | 'Link', string>>>({});
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('upload');

  const { addToast } = useToast();
  const { matters, loading: loadingMatters, refetchDocuments } = useAirtableData();
  const { createRecord, updateRecord } = useAirtableMutation();
  const isEditMode = !!documentToEdit;

  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && documentToEdit) {
      const docDate = documentToEdit.fields['Document Date']
        ? new Date(documentToEdit.fields['Document Date']).toISOString().split('T')[0]
        : '';
      setFormData({ ...documentToEdit.fields, 'Document Date': docDate });
      setTagsInput(documentToEdit.fields.Tags?.join(', ') || '');
      setSelectedFile(null);
      // If the doc to edit has a link but no file, default to the link view
      if (documentToEdit.fields.Link && !documentToEdit.fields.File) {
        setUploadMethod('link');
      } else {
        setUploadMethod('upload');
      }
    } else {
      setFormData({ 
        Category: 'Misc',
        Status: 'Draft',
        'Document Date': new Date().toISOString().split('T')[0]
      });
      setTagsInput('');
      setSelectedFile(null);
      setUploadMethod('upload');
    }
    setFormErrors({});
    setIsSubmitting(false);
  }, [isOpen, documentToEdit, isEditMode]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof Document]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
          setFormErrors(prev => ({...prev, File: `File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`}));
          setSelectedFile(null);
          return;
      }
      setFormErrors(prev => ({ ...prev, File: undefined, Link: undefined }));
      setSelectedFile(file);
      setFormData(prev => ({...prev, Title: prev.Title || file.name.replace(/\.[^/.]+$/, ""), Link: undefined }))
    }
  }
  
  const handleDragEvents = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
          setIsDragging(true);
      } else if (e.type === 'dragleave') {
          setIsDragging(false);
      }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          handleFileSelect(e.dataTransfer.files[0]);
      }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Document | 'File' | 'Link', string>> = {};
    if (!formData.Title?.trim()) errors.Title = 'Title is required.';
    if (!formData.Matter || formData.Matter.length === 0) errors.Matter = 'A matter must be selected.';

    if (uploadMethod === 'upload') {
        if (!isEditMode && !selectedFile) {
            errors.File = 'A file must be chosen for a new document.';
        }
    } else { // uploadMethod is 'link'
        if (!formData.Link?.trim()) {
            errors.Link = 'A link must be provided.';
        } else {
            try {
                new URL(formData.Link);
            } catch (_) {
                errors.Link = 'Please enter a valid URL.';
            }
        }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);
    setFormErrors({});

    try {
        if (uploadMethod === 'link') {
            const payload: Partial<Document> = {
                'Title': formData.Title,
                'Description': formData.Description || undefined,
                'Matter': formData.Matter,
                'Category': formData.Category,
                'Status': formData.Status,
                'Document Date': formData['Document Date'] || undefined,
                'Tags': tagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
                'Link': formData.Link,
                'File': null, // Explicitly clear file if switching to link
            };

            if (isEditMode && documentToEdit) {
                await updateRecord('Documents', documentToEdit.id, payload);
                addToast('Document updated successfully!', 'success');
            } else {
                await createRecord('Documents', payload);
                addToast('Document added successfully!', 'success');
            }
            await refetchDocuments({ background: true });
            onSuccess(true);

        } else { // 'upload' method
            const webhookPayload: Record<string, any> = {
                'Title': formData.Title,
                'Description': formData.Description || '',
                'Matter': formData.Matter?.[0],
                'Category': formData.Category,
                'Status': formData.Status,
                'Document Date': formData['Document Date'] || null,
                'Tags': tagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
            };

            if (isEditMode && documentToEdit) {
                webhookPayload.recordId = documentToEdit.id;
            }

            if (selectedFile) {
                const base64File = await toBase64(selectedFile);
                webhookPayload.file = {
                    filename: selectedFile.name,
                    mimeType: selectedFile.type,
                    content: base64File,
                };
            }
            
            await axios.post(MAKE_WEBHOOK_URL, webhookPayload, {
                headers: { 'Content-Type': 'application/json' }
            });
          
          onSuccess(false);
        }
    } catch (error) {
        let errorMessage = 'An unknown error occurred during submission.';
        if (axios.isAxiosError(error)) {
            if (error.response) {
                errorMessage = `Submission failed: ${error.response.data?.message || error.response.statusText || 'Server error'}`;
            } else if (error.request) {
                errorMessage = 'Submission failed due to a network issue. Please check your connection and try again.';
            } else {
                errorMessage = `Submission failed: ${error.message}`;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }
        addToast(errorMessage, 'error');
        console.error("Failed to submit document:", error);
        setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content !max-w-3xl" onClick={(e) => e.stopPropagation()}>
          <>
            <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close form">
              <X className="w-6 h-6" />
            </button>

            <header className="pb-4 mb-6 border-b border-slate-200">
              <h2 className="text-3xl font-bold text-slate-800">{isEditMode ? 'Edit Document' : 'Add New Document'}</h2>
            </header>
            
            <form onSubmit={handleSubmit} noValidate>
                <div className="form-group mb-4">
                    <div className="upload-method-switcher">
                        <button type="button" onClick={() => setUploadMethod('upload')} className={uploadMethod === 'upload' ? 'is-active' : ''}>
                            <UploadCloud className="w-4 h-4 mr-2" /> Upload File
                        </button>
                        <button type="button" onClick={() => setUploadMethod('link')} className={uploadMethod === 'link' ? 'is-active' : ''}>
                            <Link className="w-4 h-4 mr-2" /> Add from Link
                        </button>
                    </div>

                    {uploadMethod === 'upload' ? (
                         <>
                            <label htmlFor="file-upload" className={`upload-drop-zone ${isDragging ? 'is-active' : ''}`} onDragEnter={handleDragEvents} onDragOver={handleDragEvents} onDragLeave={handleDragEvents} onDrop={handleDrop}>
                                <input type="file" id="file-upload" className="hidden" onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)} />
                                <UploadCloud className="w-10 h-10 upload-icon" />
                                <div>
                                    <span className="font-semibold text-custom-indigo-600">Click to upload</span> or drag and drop
                                </div>
                                <p className="text-slate-500 text-sm mt-1">For files up to 4MB.</p>
                                <p className="text-slate-400 text-xs mt-1">Your file is securely uploaded and processed.</p>
                            </label>
                            {(selectedFile || (isEditMode && documentToEdit?.fields.File)) && <div className="mt-2 text-sm text-slate-700 flex items-center justify-center gap-2"><FileText className="w-4 h-4"/><span>{selectedFile?.name || documentToEdit?.fields.File?.[0].filename}</span></div>}
                            {formErrors.File && <p className="form-error text-center">{formErrors.File}</p>}
                        </>
                    ) : (
                         <div className="pt-2">
                            <label htmlFor="Link" className="form-label">Document URL</label>
                            <input
                                type="url"
                                id="Link"
                                name="Link"
                                value={formData.Link || ''}
                                onChange={handleChange}
                                placeholder="https://docs.google.com/..."
                                className={`form-input ${formErrors.Link ? 'border-red-500' : ''}`}
                            />
                             <p className="text-sm text-slate-500 mt-2">For larger files. Upload to a cloud service (Google Drive, Dropbox) and paste the shareable link here. Your link is saved instantly.</p>
                            {formErrors.Link && <p className="form-error">{formErrors.Link}</p>}
                        </div>
                    )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="form-group md:col-span-2">
                        <label htmlFor="Title" className="form-label">Title of document</label>
                        <input type="text" id="Title" name="Title" value={formData.Title || ''} onChange={handleChange} className={`form-input ${formErrors.Title ? 'border-red-500' : ''}`} />
                        {formErrors.Title && <p className="form-error">{formErrors.Title}</p>}
                    </div>
                    <div className="form-group md:col-span-2">
                        <label htmlFor="Description" className="form-label">Description (optional)</label>
                        <textarea id="Description" name="Description" value={formData.Description || ''} onChange={handleChange} className="form-textarea" rows={2}></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="Matter" className="form-label">Matter</label>
                        <MatterAutocomplete 
                            matters={matters}
                            selectedId={formData.Matter?.[0] || null}
                            onSelect={(id) => setFormData(prev => ({...prev, Matter: id ? [id] : []}))}
                            placeholder='Select a matter...'
                            disabled={loadingMatters}
                        />
                        {formErrors.Matter && <p className="form-error">{formErrors.Matter}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="Document Date" className="form-label">Document Date</label>
                        <input type="date" id="Document Date" name="Document Date" value={formData['Document Date'] || ''} onChange={handleChange} className="form-input" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="Category" className="form-label">Category</label>
                        <select id="Category" name="Category" value={formData.Category || 'Misc'} onChange={handleChange} className="form-select">
                            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="Status" className="form-label">Status</label>
                        <select id="Status" name="Status" value={formData.Status || 'Draft'} onChange={handleChange} className="form-select">
                            {STATUSES.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                        </select>
                    </div>
                    <div className="form-group md:col-span-2">
                        <label htmlFor="Tags" className="form-label">Tags (comma-separated)</label>
                        <input type="text" id="Tags" name="Tags" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} className="form-input" placeholder="e.g. urgent, evidence, draft" />
                    </div>
                </div>

                <footer className="flex justify-end items-center gap-4 mt-8 pt-4 border-t border-slate-200">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center justify-center min-w-[130px]" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (isEditMode ? 'Save Changes' : 'Add Document')}
                    </button>
                </footer>
            </form>
          </>
      </div>
    </div>
  );
};

export default DocumentFormModal;
