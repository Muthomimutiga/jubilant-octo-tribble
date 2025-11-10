
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AirtableRecord, Matter } from '../types';
import { X } from 'lucide-react';

interface MatterAutocompleteProps {
  matters: AirtableRecord<Matter>[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MatterAutocomplete: React.FC<MatterAutocompleteProps> = ({
  matters,
  selectedId,
  onSelect,
  placeholder = "Search for a matter...",
  className = '',
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selectedMatterName = useMemo(() => {
    if (!selectedId) return '';
    const matter = matters.find(m => m.id === selectedId);
    return matter ? (matter.fields['Matter Name'] || matter.fields['File Number'] || '') : '';
  }, [selectedId, matters]);
  
  useEffect(() => {
    setQuery(selectedMatterName);
  }, [selectedMatterName]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(selectedMatterName); // Reset query to selected matter name if user clicks away
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef, selectedMatterName]);
  
  const filteredMatters = query
    ? matters.filter(matter => {
        if (!query || query === selectedMatterName) return false;
        const lowerQuery = query.toLowerCase();
        const matterName = matter.fields['Matter Name']?.toLowerCase() || '';
        const fileNumber = matter.fields['File Number']?.toLowerCase() || '';
        return (matterName.includes(lowerQuery) || fileNumber.includes(lowerQuery));
    }).slice(0, 7) // Limit results
    : [];

  const handleSelect = (matter: AirtableRecord<Matter>) => {
    onSelect(matter.id);
    setQuery(matter.fields['Matter Name'] || matter.fields['File Number'] || '');
    setIsOpen(false);
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (!isOpen) setIsOpen(true);
    if(selectedId && newQuery === '') {
        onSelect(null); // Deselect if user clears the input
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full h-[42px] pl-3 pr-8 border border-slate-300 rounded-lg focus:ring-2 focus:ring-custom-indigo-500 focus:border-custom-indigo-500 transition bg-white"
          disabled={disabled}
          autoComplete="off"
        />
        {query && (
            <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 hover:text-slate-800"
                aria-label="Clear selection"
            >
                <X className="w-4 h-4" />
            </button>
        )}
      </div>

      {isOpen && filteredMatters.length > 0 && (
        <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredMatters.map(matter => (
            <li
              key={matter.id}
              onClick={() => handleSelect(matter)}
              className="px-4 py-3 hover:bg-custom-indigo-100 cursor-pointer border-b border-slate-100 last:border-b-0"
              role="option"
              aria-selected="false"
            >
              <p className="font-medium text-slate-800 text-sm">{matter.fields['Matter Name']}</p>
              <p className="text-xs text-slate-500">{matter.fields['File Number']}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MatterAutocomplete;