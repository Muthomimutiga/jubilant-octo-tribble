
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import { 
    LayoutDashboard, FolderKanban, CheckSquare, Calendar, Files, 
    Wand2, NotebookText, Users, Landmark, Settings, UserPlus, 
    Search, CornerDownLeft, Hash, User, Building
} from 'lucide-react';
import './CommandPalette.css';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (page: string) => void;
    onOpenTaskModal: () => void;
    onOpenEventModal: () => void;
    onOpenOnboarding: () => void;
}

interface Action {
    id: string;
    title: string;
    subtitle?: string;
    group: string;
    icon: React.ElementType;
    onSelect: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
    isOpen, onClose, onNavigate, onOpenTaskModal, onOpenEventModal, onOpenOnboarding 
}) => {
    const { matters, clients } = useAirtableData();
    const [query, setQuery] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const activeItemRef = useRef<HTMLLIElement>(null);

    const staticActions: Action[] = useMemo(() => [
        // Navigation
        { id: 'nav-dashboard', title: 'Go to Dashboard', group: 'Navigation', icon: LayoutDashboard, onSelect: () => onNavigate('Dashboard') },
        { id: 'nav-matters', title: 'Go to Matters', group: 'Navigation', icon: FolderKanban, onSelect: () => onNavigate('Matters') },
        { id: 'nav-tasks', title: 'Go to Tasks', group: 'Navigation', icon: CheckSquare, onSelect: () => onNavigate('Tasks') },
        { id: 'nav-calendar', title: 'Go to Calendar', group: 'Navigation', icon: Calendar, onSelect: () => onNavigate('Calendar') },
        { id: 'nav-documents', title: 'Go to Documents', group: 'Navigation', icon: Files, onSelect: () => onNavigate('Document') },
        { id: 'nav-automation', title: 'Go to Automation', group: 'Navigation', icon: Wand2, onSelect: () => onNavigate('Automation') },
        { id: 'nav-notes', title: 'Go to Notes', group: 'Navigation', icon: NotebookText, onSelect: () => onNavigate('Notes') },
        { id: 'nav-clients', title: 'Go to Clients', group: 'Navigation', icon: Users, onSelect: () => onNavigate('Clients') },
        { id: 'nav-billing', title: 'Go to Billing', group: 'Navigation', icon: Landmark, onSelect: () => onNavigate('Billing') },
        { id: 'nav-settings', title: 'Go to Settings', group: 'Navigation', icon: Settings, onSelect: () => onNavigate('Settings') },
        // Creation
        { id: 'create-onboarding', title: 'Onboard New Client...', group: 'Create', icon: UserPlus, onSelect: onOpenOnboarding },
        { id: 'create-task', title: 'Create New Task...', group: 'Create', icon: CheckSquare, onSelect: onOpenTaskModal },
        { id: 'create-event', title: 'Create New Event...', group: 'Create', icon: Calendar, onSelect: onOpenEventModal },
    ], [onNavigate, onOpenTaskModal, onOpenEventModal, onOpenOnboarding]);

    const searchResults: Action[] = useMemo(() => {
        if (!query) return [];

        const lowerQuery = query.toLowerCase();
        
        const matterResults: Action[] = matters
            .filter(m => 
                m.fields['Matter Name']?.toLowerCase().includes(lowerQuery) || 
                m.fields['File Number']?.toLowerCase().includes(lowerQuery)
            )
            .map(m => ({
                id: `matter-${m.id}`,
                title: m.fields['Matter Name'] || 'Untitled Matter',
                subtitle: m.fields['File Number'],
                group: 'Matters',
                icon: Hash,
                onSelect: () => onNavigate(`MatterDetail/${m.id}`)
            }));
            
        const clientResults: Action[] = clients
            .filter(c => c.fields['Client Name']?.toLowerCase().includes(lowerQuery))
            .map(c => ({
                id: `client-${c.id}`,
                title: c.fields['Client Name'] || 'Unnamed Client',
                subtitle: c.fields.Email,
                group: 'Clients',
                icon: c.fields['Client type'] === 'Business' ? Building : User,
                // Fix: Navigate to the client detail page.
                onSelect: () => onNavigate(`ClientDetail/${c.id}`)
            }));

        return [...matterResults, ...clientResults];
    }, [query, matters, clients, onNavigate]);

    const filteredActions = useMemo(() => {
        if (!query) return staticActions;

        const lowerQuery = query.toLowerCase();
        const mainActions = staticActions.filter(action => 
            action.title.toLowerCase().includes(lowerQuery) || 
            action.group.toLowerCase().includes(lowerQuery)
        );

        return [...mainActions, ...searchResults];
    }, [query, staticActions, searchResults]);

    const groupedActions = useMemo(() => {
        // Fix: Explicitly type the accumulator to prevent type inference issues.
        return filteredActions.reduce((acc: Record<string, Action[]>, action) => {
            (acc[action.group] = acc[action.group] || []).push(action);
            return acc;
        }, {});
    }, [filteredActions]);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setActiveIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        activeItemRef.current?.scrollIntoView({
            block: 'nearest'
        });
    }, [activeIndex]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredActions.length - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredActions.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedAction = filteredActions[activeIndex];
                if (selectedAction) {
                    selectedAction.onSelect();
                    onClose();
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose, filteredActions, activeIndex]);
    
    if (!isOpen) return null;

    return (
        <div className="command-palette-overlay" onClick={onClose}>
            <div className="command-palette-modal" onClick={e => e.stopPropagation()}>
                <div className="command-palette-input-wrapper">
                    <Search className="w-6 h-6 text-slate-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setActiveIndex(0);
                        }}
                        placeholder="Type a command or search..."
                        className="command-palette-input"
                        autoComplete="off"
                    />
                </div>
                <ul className="command-palette-list">
                    {Object.entries(groupedActions).map(([group, actions]) => (
                        <li key={group}>
                            <div className="command-palette-group">{group}</div>
                            <ul>
                                {actions.map((action) => {
                                    const isSelected = filteredActions[activeIndex]?.id === action.id;
                                    const Icon = action.icon;
                                    return (
                                        <li
                                            key={action.id}
                                            ref={isSelected ? activeItemRef : null}
                                            className={`command-palette-item ${isSelected ? 'is-active' : ''}`}
                                            onClick={() => {
                                                action.onSelect();
                                                onClose();
                                            }}
                                            onMouseMove={() => setActiveIndex(filteredActions.findIndex(a => a.id === action.id))}
                                            role="option"
                                            aria-selected={isSelected}
                                        >
                                            <Icon className="command-palette-item-icon" />
                                            <div className="command-palette-item-content">
                                                <p className="command-palette-item-title">{action.title}</p>
                                                {action.subtitle && <p className="command-palette-item-subtitle">{action.subtitle}</p>}
                                            </div>
                                            {isSelected && <CornerDownLeft className="w-4 h-4 text-slate-500" />}
                                        </li>
                                    )
                                })}
                            </ul>
                        </li>
                    ))}
                    {filteredActions.length === 0 && (
                        <div className="text-center p-8 text-slate-500">
                            No results found for "{query}"
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default CommandPalette;
