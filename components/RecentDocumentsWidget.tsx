import React, { useMemo } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import InfoCard from './InfoCard';
import { Files, FileText, Gavel, Mail, Search, NotebookText, User, BookOpen, Building } from 'lucide-react';
import { Document } from '../types';

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

const RecentDocumentsWidget: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const { documents, loading } = useAirtableData();

    const recentDocs = useMemo(() => {
        return [...documents]
            .sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
            .slice(0, 5);
    }, [documents]);

    return (
        <InfoCard title="Recent Documents" icon={Files} className="!mb-0">
            {loading && documents.length === 0 && <p className="text-slate-500 italic">Loading documents...</p>}
            {!loading && recentDocs.length > 0 ? (
                <div className="space-y-3">
                    {recentDocs.map(doc => {
                        const Icon = getCategoryIcon(doc.fields.Category);
                        return (
                            <div key={doc.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-b-0">
                                <Icon className="w-5 h-5 text-custom-indigo-500 flex-shrink-0" />
                                <div className="flex-grow overflow-hidden">
                                    <p className="font-semibold text-slate-800 truncate" title={doc.fields.Title}>{doc.fields.Title}</p>
                                    <p className="text-xs text-slate-500 truncate">{doc.fields['Matter Name (from Matter)']?.[0] || 'Unassigned'}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                !loading && <p className="text-slate-600 text-center py-4">No recent documents found.</p>
            )}
             <div className="text-center mt-6">
                <button 
                    onClick={() => onNavigate('Document')}
                    className="bg-slate-100 text-custom-indigo-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors w-full border border-slate-300 hover:border-custom-indigo-500 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50"
                >
                    View All Documents
                </button>
            </div>
        </InfoCard>
    );
};

export default RecentDocumentsWidget;