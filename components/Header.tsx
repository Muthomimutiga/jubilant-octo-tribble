
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Bell, Search, LogOut, User, CheckSquare, FileText, AlertTriangle, DollarSign, MessageSquare, Calendar, FolderKanban, Trash2, Loader2 } from 'lucide-react';
import { useSearch } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';
import { useAirtableData } from '../contexts/AirtableDataContext';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { Notification } from '../types';

interface HeaderProps {
    currentPageTitle: string;
    onOpenCommandPalette: () => void;
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
    'New Matter': FolderKanban,
    'Task Assigned': CheckSquare,
    'Mention': MessageSquare,
    'Event Reminder': Calendar,
    'New Document': FileText,
    'Fee Note Due': DollarSign,
    'System Alert': AlertTriangle,
    'default': Bell,
};

// Define a priority order for sorting notifications. Lower number is higher priority.
const notificationTypeOrder: Record<string, number> = {
    'System Alert': 1,
    'Mention': 2,
    'Fee Note Due': 3,
    'Event Reminder': 4,
    'Task Assigned': 5,
    'New Matter': 6,
    'New Document': 7,
    'default': 99,
};


// Function to generate a simple notification sound using the Web Audio API.
// This avoids needing an external audio file.
const playNotificationSound = () => {
    if (typeof window === 'undefined' || (!window.AudioContext && !(window as any).webkitAudioContext)) {
        console.warn("Web Audio API is not supported in this browser.");
        return;
    }
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();

        // Browsers may suspend AudioContext until user interaction. Try to resume it.
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01); // Set a pleasant volume

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note, a common notification pitch
        
        oscillator.start(audioContext.currentTime);
        // Fade out quickly
        gainNode.gain.exponentialRampToValueAtTime(0.00001, audioContext.currentTime + 0.3);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
        console.error("Could not play notification sound:", error);
    }
};

const simpleFormatDistanceToNow = (isoDate: string) => {
    const date = new Date(isoDate);
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}min ago`;
    return "Just now";
};


const Header: React.FC<HeaderProps> = ({ currentPageTitle, onOpenCommandPalette }) => {
    const { setSearchQuery } = useSearch();
    const { currentUser, logout } = useAuth();
    const { notifications, refetchNotifications } = useAirtableData();
    const { batchUpdateRecords, batchDeleteRecords } = useAirtableMutation();
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isClearing, setIsClearing] = useState(false);
    
    const menuRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);
    const prevUnreadCountRef = useRef<number | null>(null);

    const unreadCount = useMemo(() => {
        return notifications.filter(n => !n.fields.Read).length;
    }, [notifications]);

    // Enhanced sorting: unread > type priority > date
    const sortedNotifications = useMemo(() => {
        return [...notifications]
            .sort((a, b) => {
                const aRead = a.fields.Read || false;
                const bRead = b.fields.Read || false;
                if (aRead !== bRead) return aRead ? 1 : -1;

                const aPrio = notificationTypeOrder[a.fields.Type || 'default'] || 99;
                const bPrio = notificationTypeOrder[b.fields.Type || 'default'] || 99;
                if (aPrio !== bPrio) return aPrio - bPrio;

                return new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime();
            })
            .slice(0, 20); // Show up to 20 notifications
    }, [notifications]);
    
    // Effect to play sound on new notification
    useEffect(() => {
        // On the first render, just store the initial count.
        if (prevUnreadCountRef.current === null) {
            prevUnreadCountRef.current = unreadCount;
            return;
        }

        // If the new count is greater than the old one, play the sound.
        if (unreadCount > prevUnreadCountRef.current) {
            playNotificationSound();
        }

        // Update the ref for the next render.
        prevUnreadCountRef.current = unreadCount;
    }, [unreadCount]);
    

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    
    useEffect(() => {
        if (isNotificationsOpen && unreadCount > 0) {
            const recordsToUpdate = notifications
                .filter(n => !n.fields.Read)
                .map(n => ({ id: n.id, fields: { Read: true } }));
            
            batchUpdateRecords('Notifications', recordsToUpdate)
                .then(() => {
                    refetchNotifications({ background: true });
                })
                .catch(err => {
                    console.error("Failed to mark notifications as read:", err);
                });
        }
    }, [isNotificationsOpen, unreadCount, notifications, batchUpdateRecords, refetchNotifications]);

    useEffect(() => {
        setSearchQuery('');
    }, [currentPageTitle, setSearchQuery]);

    const handleClearAll = async () => {
        if (!notifications.length || isClearing) return;
        
        setIsClearing(true);
        const idsToDelete = notifications.map(n => n.id);
        
        try {
            await batchDeleteRecords('Notifications', idsToDelete);
            await refetchNotifications();
        } catch (err) {
            console.error("Failed to clear notifications:", err);
        } finally {
            setIsClearing(false);
        }
    };

    const userName = currentUser?.fields?.Name || 'User';
    const userEmail = currentUser?.fields?.Email || '';
    const avatarUrl = currentUser?.fields?.Avatar?.[0]?.url;
    const initials = currentUser?.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
    
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    return (
        <header className="flex items-center justify-between h-20 px-8 bg-white border-b border-slate-200 sticky top-0 z-20">
            {/* Page Title & View Status */}
            <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight truncate">{currentPageTitle}</h1>
            </div>

            {/* Global Search */}
            <div className="relative w-full max-w-lg mx-8">
                 <button onClick={onOpenCommandPalette} className="header-search-button">
                    <Search className="w-5 h-5 text-slate-400" />
                    <span>Search or type a command...</span>
                    <kbd className="command-palette-kbd">{isMac ? '⌘' : 'Ctrl'}+K</kbd>
                </button>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-4">
                <div className="relative" ref={notificationsRef}>
                    <button onClick={() => setIsNotificationsOpen(p => !p)} className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors" aria-label="Notifications">
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 && (
                             <span className="notification-badge">{unreadCount}</span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="notification-popover">
                            <div className="notification-header">
                                <h4 className="font-semibold text-slate-800">Notifications</h4>
                            </div>
                            <div className="notification-list">
                                {sortedNotifications.length > 0 ? (
                                    sortedNotifications.map(notification => {
                                        const type = notification.fields.Type || 'default';
                                        const Icon = NOTIFICATION_ICONS[type] || Bell;
                                        const Wrapper = notification.fields.Link ? 'a' : 'div';
                                        const typeClass = type.toLowerCase().replace(/ /g, '-');

                                        return (
                                            <Wrapper 
                                                key={notification.id} 
                                                href={notification.fields.Link || undefined}
                                                target={notification.fields.Link ? "_blank" : undefined}
                                                rel={notification.fields.Link ? "noopener noreferrer" : undefined}
                                                className={`notification-item ${!notification.fields.Read ? `is-unread type-${typeClass}` : ''}`}
                                            >
                                                <div className={`notification-item-icon-wrapper type-${typeClass}`}>
                                                    <Icon className="notification-item-icon" />
                                                </div>
                                                <div className="notification-item-content">
                                                    <p className="notification-item-message">{notification.fields.Message}</p>
                                                    <p className="notification-item-time">{simpleFormatDistanceToNow(notification.createdTime)}</p>
                                                </div>
                                            </Wrapper>
                                        );
                                    })
                                ) : (
                                    <div className="notification-empty-state">
                                        <Bell className="w-8 h-8 text-slate-300"/>
                                        <p className="font-medium text-slate-600">No new notifications</p>
                                        <p className="text-xs text-slate-400">You're all caught up!</p>
                                    </div>
                                )}
                            </div>
                             {notifications.length > 0 && (
                                <div className="notification-footer">
                                    <button
                                        onClick={handleClearAll}
                                        disabled={isClearing}
                                        className="notification-clear-btn"
                                    >
                                        {isClearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-3 h-3 inline-block mr-1" /> Clear All</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="relative" ref={menuRef}>
                    <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="relative flex items-center gap-2 text-left p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-indigo-500">
                         {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-10 h-10 rounded-full object-cover" />
                         ) : (
                            <div className="w-10 h-10 rounded-full bg-custom-indigo-100 text-custom-indigo-600 flex items-center justify-center font-bold text-lg">
                                {initials}
                            </div>
                         )}
                         <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 border-2 border-white ring-1 ring-green-500" title="Online"></span>
                    </button>
                    {isMenuOpen && (
                         <div className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30" role="menu" aria-orientation="vertical" aria-labelledby="menu-button" tabIndex={-1}>
                            <div className="py-1" role="none">
                                <div className="px-4 py-2 border-b border-slate-100">
                                    <p className="text-sm font-semibold text-slate-800" role="none">{userName}</p>
                                    <p className="text-xs text-slate-500 truncate" role="none">{userEmail}</p>
                                </div>
                                <a href="#" className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100" role="menuitem" tabIndex={-1}><User className="w-4 h-4"/> Profile</a>
                                <button
                                    onClick={logout}
                                    className="w-full text-left flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-red-50 hover:text-red-700"
                                    role="menuitem"
                                    tabIndex={-1}
                                >
                                    <LogOut className="w-4 h-4" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
