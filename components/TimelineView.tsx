
import React, { useMemo } from 'react';
import { AirtableRecord, Document } from '../types';
import DocumentListItem from './DocumentListItem';

interface TimelineViewProps {
    documents: AirtableRecord<Document>[];
    onPreviewDocument: (doc: AirtableRecord<Document>) => void;
    onEditDocument: (doc: AirtableRecord<Document>) => void;
    onDeleteDocument: (doc: AirtableRecord<Document>) => void;
    activeDocumentId: string | null;
}

const getTimelineGroup = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateCopy = new Date(date);
    dateCopy.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - dateCopy.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays > 1 && diffDays <= 7) return 'Last 7 Days';
    
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const TimelineView: React.FC<TimelineViewProps> = ({
    documents,
    onPreviewDocument,
    onEditDocument,
    onDeleteDocument,
    activeDocumentId,
}) => {
    const groupedByDate = useMemo(() => {
        const groups: Record<string, AirtableRecord<Document>[]> = {};
        
        const sortedDocs = [...documents].sort((a,b) => (b.fields['Document Date'] || '').localeCompare(a.fields['Document Date'] || ''));

        sortedDocs.forEach(doc => {
            if (doc.fields['Document Date']) {
                // Adjust for timezone when creating date object for grouping
                const date = new Date(doc.fields['Document Date']);
                const userTimezoneOffset = date.getTimezoneOffset() * 60000;
                const localDate = new Date(date.getTime() + userTimezoneOffset);

                const groupName = getTimelineGroup(localDate);
                if (!groups[groupName]) {
                    groups[groupName] = [];
                }
                groups[groupName].push(doc);
            } else {
                 if (!groups['No Date']) {
                    groups['No Date'] = [];
                }
                groups['No Date'].push(doc);
            }
        });
        return groups;
    }, [documents]);

    const groupOrder = useMemo(() => {
        // A bit complex to sort but necessary for correct order
        const orderMap: Record<string, number> = { 'Today': 1, 'Yesterday': 2, 'Last 7 Days': 3, 'No Date': 999 };
        return Object.keys(groupedByDate).sort((a, b) => {
            const orderA = orderMap[a] || 4;
            const orderB = orderMap[b] || 4;
            if (orderA !== orderB) return orderA - orderB;
            // For month/year strings, sort them chronologically descending
            return new Date(b).getTime() - new Date(a).getTime();
        });
    }, [groupedByDate]);

    return (
        <div className="timeline-view-container">
            {groupOrder.map(groupName => (
                <div key={groupName} className="timeline-group">
                    <h3 className="timeline-group-header">{groupName}</h3>
                    <div className="timeline-group-items">
                        {groupedByDate[groupName].map(doc => (
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
            ))}
        </div>
    );
};

export default TimelineView;
