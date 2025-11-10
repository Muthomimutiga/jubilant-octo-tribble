
import React, { useState, useMemo } from 'react';
import { AirtableRecord, Document } from '../types';
import { ArrowUpDown, Pencil, Trash2 } from 'lucide-react';

const StatusStyles: Record<string, string> = {
    'Draft': 'badge-status-draft',
    'Final': 'badge-status-final',
    'For Review': 'badge-status-for-review',
    'Archived': 'badge-status-archived',
};

type SortableKeys = 'Title' | 'Matter Name (from Matter)' | 'Category' | 'Status' | 'Document Date';

interface ListViewProps {
    documents: AirtableRecord<Document>[];
    onPreviewDocument: (doc: AirtableRecord<Document>) => void;
    onEditDocument: (doc: AirtableRecord<Document>) => void;
    onDeleteDocument: (doc: AirtableRecord<Document>) => void;
    activeDocumentId: string | null;
}

const ListView: React.FC<ListViewProps> = ({ documents, onPreviewDocument, onEditDocument, onDeleteDocument, activeDocumentId }) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'asc' | 'desc' } | null>({ key: 'Document Date', direction: 'desc' });

    const sortedDocuments = useMemo(() => {
        let sortableItems = [...documents];
        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a.fields[sortConfig.key] || '';
                const bVal = b.fields[sortConfig.key] || '';
                
                // Handle lookup fields which are arrays
                const valA = Array.isArray(aVal) ? aVal[0] || '' : aVal;
                const valB = Array.isArray(bVal) ? bVal[0] || '' : bVal;

                if (valA < valB) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (valA > valB) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [documents, sortConfig]);

    const requestSort = (key: SortableKeys) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIndicator = (key: SortableKeys) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="w-4 h-4 ml-2 opacity-30 inline-block" />;
        }
        return sortConfig.direction === 'asc' ? '▲' : '▼';
    };

    return (
        <div className="list-view-container">
            <table className="list-view-table">
                <thead>
                    <tr>
                        <th onClick={() => requestSort('Title')}>Title {getSortIndicator('Title')}</th>
                        <th onClick={() => requestSort('Matter Name (from Matter)')}>Matter {getSortIndicator('Matter Name (from Matter)')}</th>
                        <th onClick={() => requestSort('Category')}>Category {getSortIndicator('Category')}</th>
                        <th onClick={() => requestSort('Status')}>Status {getSortIndicator('Status')}</th>
                        <th onClick={() => requestSort('Document Date')}>Date {getSortIndicator('Document Date')}</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedDocuments.map(doc => (
                        <tr key={doc.id} onClick={() => onPreviewDocument(doc)} className={doc.id === activeDocumentId ? 'is-active' : ''}>
                            <td className="font-semibold">{doc.fields.Title || 'Untitled'}</td>
                            <td>{doc.fields['Matter Name (from Matter)']?.[0] || 'Unassigned'}</td>
                            <td>{doc.fields.Category || 'N/A'}</td>
                            <td>
                                {doc.fields.Status && <span className={`badge-pill ${StatusStyles[doc.fields.Status] || 'badge-status-default'}`}>{doc.fields.Status}</span>}
                            </td>
                            <td>{doc.fields['Document Date'] ? new Date(doc.fields['Document Date']).toLocaleDateString('en-US', { timeZone: 'UTC'}) : 'N/A'}</td>
                            <td>
                                <div className="table-actions">
                                    <button onClick={(e) => { e.stopPropagation(); onEditDocument(doc); }} aria-label="Edit document"><Pencil className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc); }} aria-label="Delete document" className="delete"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ListView;