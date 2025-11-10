
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AirtableRecord, Client } from '../types';
import { X } from 'lucide-react';
import './ContactMultiSelect.css';

interface ClientMultiSelectProps {
  allClients: AirtableRecord<Client>[];
  selectedClientIds: string[];
  onSelectionChange: (ids: string[]) => void;
  disabled?: boolean;
}

const getClientDisplayName = (clientFields: Client): string => {
    return clientFields['Client Name'] || 'Unnamed Client';
};

const ClientMultiSelect: React.FC<ClientMultiSelectProps> = ({ allClients, selectedClientIds, onSelectionChange, disabled }) => {
    const [inputValue, setInputValue] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const selectedClients = useMemo(() => {
        const idSet = new Set(selectedClientIds);
        return allClients.filter(c => idSet.has(c.id));
    }, [selectedClientIds, allClients]);

    const filteredClients = useMemo(() => {
        if (!inputValue) return [];
        const lowerQuery = inputValue.toLowerCase();
        const selectedIdsSet = new Set(selectedClientIds);
        return allClients.filter(client => 
            !selectedIdsSet.has(client.id) && 
            getClientDisplayName(client.fields).toLowerCase().includes(lowerQuery)
        ).slice(0, 10);
    }, [inputValue, allClients, selectedClientIds]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setInputValue('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelectClient = (clientId: string) => {
        onSelectionChange([...selectedClientIds, clientId]);
        setInputValue('');
        setIsDropdownOpen(false);
    };

    const handleRemoveClient = (clientId: string) => {
        onSelectionChange(selectedClientIds.filter(id => id !== clientId));
    };

    return (
        <div className="multiselect-wrapper" ref={wrapperRef}>
            <div className="multiselect-input-container">
                {selectedClients.map(client => (
                    <div key={client.id} className="multiselect-pill">
                        {getClientDisplayName(client.fields)}
                        <button 
                            type="button" 
                            className="multiselect-pill-remove" 
                            onClick={() => handleRemoveClient(client.id)}
                            aria-label={`Remove ${getClientDisplayName(client.fields)}`}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={selectedClients.length > 0 ? '' : 'Search for attendees...'}
                    className="multiselect-input"
                    disabled={disabled}
                />
            </div>
            {isDropdownOpen && filteredClients.length > 0 && (
                <div className="multiselect-dropdown">
                    {filteredClients.map(client => (
                        <div key={client.id} className="multiselect-dropdown-item" onClick={() => handleSelectClient(client.id)}>
                            <p className="multiselect-dropdown-item-name">{getClientDisplayName(client.fields)}</p>
                            <p className="multiselect-dropdown-item-email">{client.fields.Email}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClientMultiSelect;
