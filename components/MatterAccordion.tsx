

import React, { useState, useEffect } from 'react';
import { AirtableRecord, Document, Matter } from '../types';
import DocumentListItem from './DocumentListItem';
import { ChevronDown } from 'lucide-react';

interface MatterAccordionProps {
    matter: AirtableRecord<Matter>;
    documents: AirtableRecord<Document>[];
    onPreviewDocument: (doc: AirtableRecord<Document>) => void;
    onEditDocument: (doc: AirtableRecord<Document>) => void;
    onDeleteDocument: (doc: AirtableRecord<Document>) => void;
    activeDocumentId: string | null;
}

const MatterAccordion: React.FC<MatterAccordionProps> = ({ matter, documents, onPreviewDocument, onEditDocument, onDeleteDocument, activeDocumentId }) => {
    // If the active document is in this group, default to open.
    const [isOpen, setIsOpen] = useState(() => documents.some(doc => doc.id === activeDocumentId));

    // When active document changes, check if we should open this accordion
    useEffect(() => {
        if(activeDocumentId && documents.some(doc => doc.id === activeDocumentId)) {
            setIsOpen(true);
        }
    }, [activeDocumentId, documents]);


    return (
        <div className="matter-accordion">
            <button
                type="button"
                className="matter-accordion-header"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls={`matter-content-${matter.id}`}
            >
                <div className="matter-accordion-title">
                    <h3 className="matter-name">{matter.fields['Matter Name'] || 'Unnamed Matter'}</h3>
                    <span className="matter-file-number">{matter.fields['File Number']}</span>
                </div>
                <div className="matter-accordion-info">
                    <span className="matter-doc-count">{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
                    <ChevronDown className={`matter-accordion-chevron ${isOpen ? 'is-open' : ''}`} />
                </div>
            </button>
            <div
                id={`matter-content-${matter.id}`}
                className={`matter-accordion-content-wrapper ${isOpen ? 'is-open' : ''}`}
            >
                <div className="matter-accordion-content">
                    {documents.map(doc => (
                        <DocumentListItem
                            key={doc.id}
                            document={doc}
                            onPreview={onPreviewDocument}
                            onEdit={onEditDocument}
                            onDelete={onDeleteDocument}
                            isActive={doc.id === activeDocumentId}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MatterAccordion;