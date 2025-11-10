import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AirtableRecord, User } from '../types';
import { X } from 'lucide-react';
import './UserMultiSelect.css';

interface UserMultiSelectProps {
    allUsers: AirtableRecord<User>[];
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    label?: string;
    disabled?: boolean;
    placeholder?: string;
}

const UserMultiSelect: React.FC<UserMultiSelectProps> = ({
    allUsers,
    selectedIds = [],
    onSelectionChange,
    label,
    disabled = false,
    placeholder = 'Add users...'
}) => {
    const [query, setQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
                setQuery('');
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const selectedUsers = useMemo(() => {
        const idSet = new Set(selectedIds || []);
        return allUsers.filter(u => idSet.has(u.id));
    }, [selectedIds, allUsers]);

    const filteredUsers = useMemo(() => {
        if (!query) return [];
        const lowerQuery = query.toLowerCase();
        const selectedIdsSet = new Set(selectedIds || []);
        return allUsers.filter(user =>
            !selectedIdsSet.has(user.id) &&
            (user.fields.Name?.toLowerCase().includes(lowerQuery) || user.fields.Email?.toLowerCase().includes(lowerQuery))
        ).slice(0, 10);
    }, [query, allUsers, selectedIds]);

    const handleSelect = (userId: string) => {
        onSelectionChange([...(selectedIds || []), userId]);
        setQuery('');
        setIsDropdownOpen(false);
    };

    const handleRemove = (userId: string) => {
        onSelectionChange((selectedIds || []).filter(id => id !== userId));
    };

    const getAvatar = (user: AirtableRecord<User>, isDropdown: boolean = false) => {
        const avatarUrl = user.fields.Avatar?.[0]?.url;
        const initials = user.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
        const sizeClass = isDropdown ? '!w-8 !h-8' : '';
        return (
            <div className={`user-multiselect-pill-avatar ${sizeClass}`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={user.fields.Name} />
                ) : (
                    <span className={`flex items-center justify-center h-full ${isDropdown ? 'text-sm font-bold' : ''}`}>{initials}</span>
                )}
            </div>
        );
    };

    const multiSelectComponent = (
        <div className="user-multiselect-wrapper" ref={wrapperRef}>
            <div className={`user-multiselect-input-container ${disabled ? 'bg-slate-100' : ''}`}>
                {selectedUsers.map(user => (
                    <div key={user.id} className="user-multiselect-pill">
                        {getAvatar(user)}
                        {user.fields.Name}
                        <button type="button" className="user-multiselect-pill-remove" onClick={() => handleRemove(user.id)} aria-label={`Remove ${user.fields.Name}`}>
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder={selectedUsers.length > 0 ? '' : placeholder}
                    className="user-multiselect-input"
                    disabled={disabled}
                />
            </div>
            {isDropdownOpen && filteredUsers.length > 0 && (
                <div className="user-multiselect-dropdown">
                    {filteredUsers.map(user => (
                        <div key={user.id} className="user-multiselect-dropdown-item" onClick={() => handleSelect(user.id)}>
                            {getAvatar(user, true)}
                            <div>
                                <p className="user-multiselect-dropdown-item-name">{user.fields.Name}</p>
                                <p className="user-multiselect-dropdown-item-email">{user.fields.Email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (label) {
        return (
            <div className="form-group">
                <label className="form-label">{label}</label>
                {multiSelectComponent}
            </div>
        );
    }

    return multiSelectComponent;
};

export default UserMultiSelect;
