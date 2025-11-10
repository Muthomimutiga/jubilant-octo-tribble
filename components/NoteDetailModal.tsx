

import React from 'react';
import { AirtableRecord, Note } from '../types';
import { X, Trash2, FolderKanban, Tag, AlignLeft } from 'lucide-react';

interface NoteDetailModalProps {
    note: AirtableRecord<Note> | null;
    onClose: () => void;
    onDelete: (note: AirtableRecord<Note>) => void;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode; icon: React.ElementType }> = ({ title, children, icon: Icon }) => (
    <div className="pt-5 mt-5 border-t border-slate-200">
        <h4 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-3 flex items-center">
            <Icon className="w-5 h-5 mr-2.5 text-custom-indigo-500"/>
            {title}
        </h4>
        <div className="text-slate-700 text-base leading-relaxed pl-8">{children}</div>
    </div>
);

const NoteDetailModal: React.FC<NoteDetailModalProps> = ({ note, onClose, onDelete }) => {
    if (!note) return null;

    const { fields } = note;
    const formattedDate = new Date(note.createdTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
    
    const noteColor = fields.Color || '#6366f1';
    const matterNameRaw = fields['Matter Name (from Matter)'];
    const displayMatterName = (Array.isArray(matterNameRaw) ? matterNameRaw.join(', ') : matterNameRaw);

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="note-detail-title">
            <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500"
                    aria-label="Close note details"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <header className="pb-4 mb-2 flex justify-between items-start border-b-4" style={{ borderColor: noteColor }}>
                    <div>
                        <h2 id="note-detail-title" className="text-3xl font-bold text-slate-800">{fields.Subject}</h2>
                        <p className="text-sm text-slate-500 mt-1">Created on {formattedDate}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <button 
                            onClick={() => onDelete(note)}
                            className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                        >
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                </header>

                <div className="modal-body-content py-4">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6 text-sm">
                        <div className="flex items-center gap-2">
                            <FolderKanban className="w-5 h-5 text-slate-400"/>
                            <strong>Matter:</strong>
                            <span className="ml-1 text-custom-indigo-600 font-medium">{displayMatterName || 'Unassigned'}</span>
                        </div>
                         <div className="flex items-start gap-2">
                            <Tag className="w-5 h-5 text-slate-400 mt-0.5"/>
                            <strong>Tags:</strong>
                            <div className="flex flex-wrap gap-2 ml-1">
                                {fields.Tags && fields.Tags.length > 0 ? (
                                    fields.Tags.map(tag => <span key={tag} className="note-tag-badge">{tag}</span>)
                                ) : (
                                    <span className="text-slate-500 italic">No tags</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <DetailSection title="Note Content" icon={AlignLeft}>
                        {fields.Description ? (
                             <div className="ql-snow">
                                <div className="ql-editor" dangerouslySetInnerHTML={{ __html: fields.Description }}></div>
                            </div>
                        ) : (
                            <p className="text-slate-500 italic">No description provided.</p>
                        )}
                    </DetailSection>
                </div>
            </div>
        </div>
    );
};

export default NoteDetailModal;