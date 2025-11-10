import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { DocumentFilters, Document } from '../types';
import './../pages/DocumentsPage.css'; // Steal styles from DocumentsPage

const CATEGORIES: Document['Category'][] = ['Pleadings', 'Correspondence', 'Discovery', 'Orders', 'Registry Docs', 'Client Docs', 'Authorities', 'Misc'];
const STATUSES: Document['Status'][] = ['Draft', 'Final', 'For Review', 'Archived'];

interface DocumentFilterPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (filters: DocumentFilters) => void;
    activeFilters: DocumentFilters;
    allTags: string[];
}

const initialFiltersState: DocumentFilters = {
    categories: [],
    statuses: [],
    tags: [],
    startDate: null,
    endDate: null,
};

const FilterSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="filter-section">
        <h4 className="filter-section-title">{title}</h4>
        {children}
    </div>
);

const DocumentFilterPanel: React.FC<DocumentFilterPanelProps> = ({ isOpen, onClose, onApplyFilters, activeFilters, allTags }) => {
    const [localFilters, setLocalFilters] = useState<DocumentFilters>(activeFilters);

    useEffect(() => {
        setLocalFilters(activeFilters);
    }, [activeFilters]);

    const handleCheckboxChange = (field: 'categories' | 'statuses' | 'tags', value: string) => {
        const currentValues = localFilters[field];
        const newValues = currentValues.includes(value)
            ? currentValues.filter(v => v !== value)
            : [...currentValues, value];
        setLocalFilters(prev => ({ ...prev, [field]: newValues }));
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({...prev, [name]: value || null }))
    };

    const handleClear = () => {
        setLocalFilters(initialFiltersState);
    };

    const handleApply = () => {
        onApplyFilters(localFilters);
    };

    return (
        <>
            {isOpen && <div className="filter-panel-overlay" onClick={onClose}></div>}
            <aside className={`filter-panel ${isOpen ? 'is-open' : ''}`}>
                <header className="filter-panel-header">
                    <div className="flex items-center gap-2">
                         <SlidersHorizontal className="w-5 h-5 text-custom-indigo-600" />
                         <h3 className="font-bold text-lg text-slate-800">Filter Documents</h3>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5"/></button>
                </header>
                <div className="filter-panel-body">
                    <FilterSection title="Filter by Date">
                         <div className="grid grid-cols-2 gap-4">
                            <div className="form-group">
                                <label htmlFor="startDate" className="form-label text-xs">From</label>
                                <input type="date" name="startDate" id="startDate" value={localFilters.startDate || ''} onChange={handleDateChange} className="form-input text-sm" />
                            </div>
                             <div className="form-group">
                                <label htmlFor="endDate" className="form-label text-xs">To</label>
                                <input type="date" name="endDate" id="endDate" value={localFilters.endDate || ''} onChange={handleDateChange} className="form-input text-sm" />
                            </div>
                        </div>
                    </FilterSection>
                    <FilterSection title="Filter by Category">
                        <div className="filter-checkbox-grid">
                            {CATEGORIES.map(cat => (
                                <div key={cat} className="filter-checkbox-group">
                                    <input type="checkbox" id={`cat-${cat}`} checked={localFilters.categories.includes(cat)} onChange={() => handleCheckboxChange('categories', cat)} />
                                    <label htmlFor={`cat-${cat}`}>{cat}</label>
                                </div>
                            ))}
                        </div>
                    </FilterSection>
                     <FilterSection title="Filter by Status">
                        <div className="filter-checkbox-grid">
                            {STATUSES.map(stat => (
                                <div key={stat} className="filter-checkbox-group">
                                    <input type="checkbox" id={`stat-${stat}`} checked={localFilters.statuses.includes(stat)} onChange={() => handleCheckboxChange('statuses', stat)} />
                                    <label htmlFor={`stat-${stat}`}>{stat}</label>
                                </div>
                            ))}
                        </div>
                    </FilterSection>
                     <FilterSection title="Filter by Tags">
                        {allTags.length > 0 ? (
                            <div className="filter-checkbox-grid">
                                {allTags.map(tag => (
                                    <div key={tag} className="filter-checkbox-group">
                                        <input type="checkbox" id={`tag-${tag}`} checked={localFilters.tags.includes(tag)} onChange={() => handleCheckboxChange('tags', tag)} />
                                        <label htmlFor={`tag-${tag}`}>{tag}</label>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-500 italic">No tags found in documents.</p>
                        )}
                    </FilterSection>
                </div>
                <footer className="filter-panel-footer">
                    <button onClick={handleClear} className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors border border-slate-300">Clear All</button>
                    <button onClick={handleApply} className="w-full px-5 py-2.5 rounded-lg text-sm font-semibold bg-custom-indigo-600 text-white hover:bg-custom-indigo-700 transition-colors shadow-sm">Apply</button>
                </footer>
            </aside>
        </>
    );
};

export default DocumentFilterPanel;