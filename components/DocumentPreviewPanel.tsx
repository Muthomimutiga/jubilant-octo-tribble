import React from 'react';
import { AirtableRecord, Document } from '../types';
import { FileText, Tag, Calendar, Layers3, Info, Pencil, ExternalLink, X, BookOpen, Building, Gavel, Mail, NotebookText, Search, User } from 'lucide-react';

interface DocumentPreviewPanelProps {
    document: AirtableRecord<Document> | null;
    onClose: () => void;
    onEdit: (doc: AirtableRecord<Document>) => void;
}

const getCategoryIcon = (category?: Document['Category']) => {
    switch (category) {
        case 'Pleadings': return Gavel;
        case 'Correspondence': return Mail;
        case 'Discovery': return Search;
        case 'Orders': return FileText;
        case 'Registry Docs': return Building;
        case 'Client Docs': return User;
        case 'Authorities': return BookOpen;
        default: return NotebookText;
    }
};

const StatusStyles: Record<string, string> = {
    'Draft': 'badge-status-draft',
    'Final': 'badge-status-final',
    'For Review': 'badge-status-for-review',
    'Archived': 'badge-status-archived',
};

const DetailRow: React.FC<{ icon: React.ElementType, label: string, children: React.ReactNode }> = ({ icon: Icon, label, children }) => (
    <div className="preview-detail-row">
        <Icon className="preview-detail-icon" />
        <div className="preview-detail-content">
            <span className="preview-detail-label">{label}</span>
            <div className="preview-detail-value">{children}</div>
        </div>
    </div>
);

const DocumentPreviewPanel: React.FC<DocumentPreviewPanelProps> = ({ document, onClose, onEdit }) => {
    if (!document) {
        return (
            <div className="document-preview-panel is-empty">
                <FileText className="w-16 h-16 text-slate-300" />
                <h3 className="text-lg font-semibold text-slate-500 mt-4">Select a document</h3>
                <p className="text-slate-400 text-sm">Click on a document from the list to see its details here.</p>
            </div>
        );
    }
    
    const { fields } = document;
    const CategoryIcon = getCategoryIcon(fields.Category);
    const docDate = fields['Document Date']
        ? new Date(fields['Document Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
        : 'N/A';

    return (
        <aside className="document-preview-panel">
            <header className="preview-header">
                <div className="flex-grow overflow-hidden">
                    <h2 className="preview-title" title={fields.Title}>{fields.Title}</h2>
                    <p className="preview-matter-name">{fields['Matter Name (from Matter)']?.[0] || 'Unassigned'}</p>
                </div>
                <button onClick={onClose} className="preview-close-btn" aria-label="Close preview">
                    <X className="w-5 h-5" />
                </button>
            </header>
            
            <div className="preview-actions">
                <button onClick={() => onEdit(document)} className="preview-action-btn edit-btn">
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Details
                </button>
                {(fields.File?.[0]?.url || fields.Link) && (
                     <a href={fields.File?.[0]?.url || fields.Link} target="_blank" rel="noopener noreferrer" className="preview-action-btn open-btn">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open File
                    </a>
                )}
            </div>

            <div className="preview-body">
                <DetailRow icon={CategoryIcon} label="Category">
                    {fields.Category || 'N/A'}
                </DetailRow>
                <DetailRow icon={Layers3} label="Status">
                     {fields.Status ? <span className={`badge-pill ${StatusStyles[fields.Status] || 'badge-status-default'}`}>{fields.Status}</span> : 'N/A'}
                </DetailRow>
                <DetailRow icon={Calendar} label="Document Date">
                    {docDate}
                </DetailRow>
                <DetailRow icon={Tag} label="Tags">
                    {fields.Tags && fields.Tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {fields.Tags.map(tag => <span key={tag} className="badge-pill badge-tag">{tag}</span>)}
                        </div>
                    ) : <span className="text-slate-500 italic">No tags</span>}
                </DetailRow>
                 <DetailRow icon={Info} label="Description">
                    <p className="whitespace-pre-wrap text-slate-700">
                        {fields.Description || <span className="text-slate-500 italic">No description provided.</span>}
                    </p>
                </DetailRow>
            </div>
        </aside>
    );
};

export default DocumentPreviewPanel;