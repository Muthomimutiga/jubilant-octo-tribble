

import React, { useState, useRef, useEffect } from 'react';
import { AirtableRecord, Document, IconComponent } from '../types';
import { Pencil, FileText, Gavel, Link, Mail, MoreHorizontal, Search, NotebookText, Trash2, User, BookOpen, Building } from 'lucide-react';

interface DocumentListItemProps {
    document: AirtableRecord<Document>;
    onPreview: (doc: AirtableRecord<Document>) => void;
    onEdit: (doc: AirtableRecord<Document>) => void;
    onDelete: (doc: AirtableRecord<Document>) => void;
    isActive: boolean;
}

const getCategoryIcon = (category?: Document['Category']): IconComponent => {
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

const DocumentListItem: React.FC<DocumentListItemProps> = ({ document: doc, onPreview, onEdit, onDelete, isActive }) => {
    const { fields } = doc;
    const CategoryIcon = getCategoryIcon(fields.Category);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit(doc);
        setIsMenuOpen(false);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDelete(doc);
        setIsMenuOpen(false);
    };
    
    const handleMainClick = () => {
        onPreview(doc);
    }

    const docDate = fields['Document Date']
        ? new Date(fields['Document Date']).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
        : 'No Date';

    return (
        <div 
            className={`document-list-item ${isActive ? 'is-active' : ''}`}
            onClick={handleMainClick}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleMainClick()}
            role="button"
            tabIndex={0}
            aria-label={`Preview document: ${fields.Title || 'Untitled Document'}`}
        >
            <div className="document-item-icon-wrapper" title={fields.Category}>
                <CategoryIcon className="document-item-icon" />
            </div>

            <div className="document-item-main">
                <p className="document-item-title">{fields.Title || 'Untitled Document'}</p>
                <div className="document-item-badges">
                    {fields.Status && <span className={`badge-pill ${StatusStyles[fields.Status] || 'badge-status-default'}`}>{fields.Status}</span>}
                    {fields.Tags?.map(tag => <span key={tag} className="badge-pill badge-tag">{tag}</span>)}
                </div>
            </div>

            <div className="document-item-meta">
                {(fields.File?.[0]?.url || fields.Link) && (
                    <a href={fields.File?.[0]?.url || fields.Link} target="_blank" rel="noopener noreferrer" className="action-icon-btn" aria-label="Open document link" onClick={(e) => e.stopPropagation()}>
                        <Link className="w-5 h-5"/>
                    </a>
                )}
                <span className="document-item-date">{docDate}</span>
                <div className="document-item-actions" ref={menuRef}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(p => !p); }}
                        className="action-icon-btn"
                        aria-label="More options"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                    {isMenuOpen && (
                        <div className="actions-menu-popover">
                            <button onClick={handleEdit}><Pencil className="w-4 h-4"/> Edit</button>
                            <button onClick={handleDelete} className="delete"><Trash2 className="w-4 h-4"/> Delete</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentListItem;