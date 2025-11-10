
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AirtableRecord, User } from '../types';
import { X } from 'lucide-react';

interface UserAutocompleteProps {
  users: AirtableRecord<User>[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const UserAutocomplete: React.FC<UserAutocompleteProps> = ({
  users,
  selectedId,
  onSelect,
  placeholder = "Search for a user...",
  className = '',
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedUser = useMemo(() => {
    if (!selectedId) return null;
    return users.find(u => u.id === selectedId);
  }, [selectedId, users]);

  const selectedUserName = selectedUser?.fields.Name || '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery('');
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  const filteredUsers = query
    ? users.filter(user => {
        const lowerQuery = query.toLowerCase();
        const name = user.fields.Name?.toLowerCase() || '';
        const email = user.fields.Email?.toLowerCase() || '';
        if(user.id === selectedId) return false;
        return name.includes(lowerQuery) || email.includes(lowerQuery);
    }).slice(0, 5)
    : [];

  const handleSelect = (user: AirtableRecord<User>) => {
    onSelect(user.id);
    setQuery('');
    setIsOpen(false);
  };
  
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    if (!isOpen) setIsOpen(true);
  };
  
  const getAvatar = (user: AirtableRecord<User>) => {
      const avatarUrl = user.fields.Avatar?.[0]?.url;
      const initials = user.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
      const sizeClass = 'w-6 h-6';
      if (avatarUrl) {
          return <img src={avatarUrl} alt={user.fields.Name} className={`${sizeClass} rounded-full object-cover`} />;
      }
      return (
          <div className={`${sizeClass} rounded-full bg-custom-indigo-100 text-custom-indigo-600 flex items-center justify-center font-bold text-xs`}>
              {initials}
          </div>
      );
  }

  const getDropdownAvatar = (user: AirtableRecord<User>) => {
      const avatarUrl = user.fields.Avatar?.[0]?.url;
      const initials = user.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
      if (avatarUrl) {
          return <img src={avatarUrl} alt={user.fields.Name} className="w-8 h-8 rounded-full object-cover" />;
      }
      return (
          <div className="w-8 h-8 rounded-full bg-custom-indigo-100 text-custom-indigo-600 flex items-center justify-center font-bold text-sm">
              {initials}
          </div>
      );
  }

  return (
    <div className={`user-autocomplete-wrapper ${className}`} ref={wrapperRef}>
      <div className={`user-autocomplete-input-container ${disabled ? 'bg-slate-100' : ''}`}>
        {selectedUser ? (
          <div className="user-pill">
            {getAvatar(selectedUser)}
            <span className="user-pill-name">{selectedUserName}</span>
            {!disabled && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="user-pill-clear"
                    aria-label="Clear selection"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="user-autocomplete-input"
            disabled={disabled}
            autoComplete="off"
          />
        )}
      </div>

      {isOpen && !selectedUser && filteredUsers.length > 0 && (
        <ul className="user-autocomplete-dropdown">
          {filteredUsers.map(user => (
            <li
              key={user.id}
              onClick={() => handleSelect(user)}
              className="px-4 py-3 hover:bg-custom-indigo-100 cursor-pointer border-b border-slate-100 last:border-b-0 flex items-center gap-3"
              role="option"
              aria-selected="false"
            >
              {getDropdownAvatar(user)}
              <div>
                <p className="font-medium text-slate-800 text-sm">{user.fields.Name}</p>
                <p className="text-xs text-slate-500">{user.fields.Email}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserAutocomplete;
