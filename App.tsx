

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { Dashboard } from './components/Dashboard';
import MattersPage from './pages/MattersPage';
import TasksPage from './pages/TasksPage';
import CalendarPage from './pages/CalendarPage';
import DocumentsPage from './pages/DocumentsPage';
import DocumentAutomationPage from './pages/DocumentAutomationPage';
import { NotesPage } from './pages/NotesPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import BillingPage from './pages/BillingPage';
import SettingsPage from './pages/SettingsPage';
import MatterDetailPage from './pages/MatterDetailPage';
import { AirtableDataProvider } from './contexts/AirtableDataContext';
import OnboardingModal from './components/OnboardingModal';
import { SearchProvider } from './contexts/SearchContext';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import { Loader2 } from 'lucide-react';
import ToastContainer from './components/ToastContainer';
import CommandPalette from './components/CommandPalette';
import TaskFormModal from './components/TaskFormModal';
import EventFormModal from './components/EventFormModal';
import FeenoteFormModal from './components/FeenoteFormModal';
import { ClientFormModal } from './components/ClientFormModal';
import { AirtableRecord, Client } from './types';
import { GoogleCalendarProvider } from './contexts/GoogleCalendarContext';

// The main application layout, shown only when authenticated.
const MainApp: React.FC = () => {
    const [currentPage, setCurrentPage] = useState('Dashboard');
    
    // Centralized state management for modals
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
    const [isEventFormOpen, setIsEventFormOpen] = useState(false);
    const [isFeenoteFormOpen, setIsFeenoteFormOpen] = useState(false);
    const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
    const [isClientFormOpen, setIsClientFormOpen] = useState(false);

    const [editingClient, setEditingClient] = useState<AirtableRecord<Client> | null>(null);

    // Keyboard shortcut for Command Palette
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const handleNavigate = useCallback((page: string) => {
        setCurrentPage(page);
    }, []);

    const handleOpenNewClientForm = () => {
        setEditingClient(null);
        setIsClientFormOpen(true);
    };
    
    const handleOpenEditClientForm = (client: AirtableRecord<Client>) => {
        setEditingClient(client);
        setIsClientFormOpen(true);
    };

    const handleClientFormSuccess = () => {
        setIsClientFormOpen(false);
        setEditingClient(null);
    };

    const getPageTitle = (page: string): string => {
        const [pageName] = page.split('/');

        if (pageName === 'Automation') {
            return 'Document Automation Portal';
        }
        if (pageName === 'MatterDetail') {
            return 'Matter Details';
        }
         if (pageName === 'ClientDetail') {
            return 'Client Details';
        }
        return pageName;
    };

    const renderPage = () => {
        const [page, param] = currentPage.split('/');
        switch (page) {
            case 'Matters':
                return <MattersPage onOpenOnboarding={() => setIsOnboardingOpen(true)} onNavigate={handleNavigate} />;
            case 'MatterDetail':
                return <MatterDetailPage matterId={param} onNavigate={handleNavigate} />;
            case 'Tasks':
                return <TasksPage onOpenTaskModal={() => setIsTaskFormOpen(true)} />;
            case 'Calendar':
                return <CalendarPage onOpenEventModal={() => setIsEventFormOpen(true)} onOpenTaskModal={() => setIsTaskFormOpen(true)} />;
            case 'Document':
                return <DocumentsPage />;
            case 'Automation':
                return <DocumentAutomationPage />;
            case 'Notes':
                return <NotesPage />;
            case 'Clients':
                return <ClientsPage onNavigate={handleNavigate} onOpenNewClientForm={handleOpenNewClientForm} />;
            case 'ClientDetail':
                return <ClientDetailPage clientId={param} onNavigate={handleNavigate} onOpenEditClientForm={handleOpenEditClientForm} />;
            case 'Billing':
                return <BillingPage onOpenFeenoteModal={() => setIsFeenoteFormOpen(true)} />;
            case 'Settings':
                return <SettingsPage />;
            case 'Dashboard':
            default:
                return <Dashboard 
                            onNavigate={handleNavigate} 
                            onOpenTaskModal={() => setIsTaskFormOpen(true)} 
                            onOpenFeenoteModal={() => setIsFeenoteFormOpen(true)}
                        />;
        }
    };

    return (
        <AirtableDataProvider>
            <GoogleCalendarProvider>
                <SearchProvider>
                    <ToastContainer />
                    <div className="flex h-screen font-sans bg-slate-50 text-slate-800">
                        <Sidebar 
                            currentPage={currentPage} 
                            onNavigate={handleNavigate}
                            onOpenOnboarding={() => setIsOnboardingOpen(true)}
                        />
                        <div className="ml-64 flex-1 flex flex-col overflow-hidden">
                            <Header 
                                currentPageTitle={getPageTitle(currentPage)}
                                onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
                            />
                            <main className="flex-1 p-8 overflow-y-auto">
                                {renderPage()}
                            </main>
                        </div>
                    </div>
                    
                    {/* All modals and global components are rendered here */}
                    <CommandPalette
                        isOpen={isCommandPaletteOpen}
                        onClose={() => setIsCommandPaletteOpen(false)}
                        onNavigate={handleNavigate}
                        onOpenTaskModal={() => setIsTaskFormOpen(true)}
                        onOpenEventModal={() => setIsEventFormOpen(true)}
                        onOpenOnboarding={() => setIsOnboardingOpen(true)}
                    />

                    <OnboardingModal 
                        isOpen={isOnboardingOpen}
                        onClose={() => setIsOnboardingOpen(false)}
                    />
                     <TaskFormModal
                        isOpen={isTaskFormOpen}
                        onClose={() => setIsTaskFormOpen(false)}
                        onSuccess={() => setIsTaskFormOpen(false)} // onSuccess should also close
                    />
                    <EventFormModal
                        isOpen={isEventFormOpen}
                        onClose={() => setIsEventFormOpen(false)}
                        onSuccess={() => setIsEventFormOpen(false)}
                    />
                    <FeenoteFormModal
                        isOpen={isFeenoteFormOpen}
                        onClose={() => setIsFeenoteFormOpen(false)}
                        onSuccess={() => setIsFeenoteFormOpen(false)}
                    />
                    <ClientFormModal
                        isOpen={isClientFormOpen}
                        onClose={() => setIsClientFormOpen(false)}
                        onSuccess={handleClientFormSuccess}
                        clientToEdit={editingClient}
                    />
                </SearchProvider>
            </GoogleCalendarProvider>
        </AirtableDataProvider>
    );
}


const App: React.FC = () => {
    const { isAuthenticated, loading } = useAuth();
    
    // Show a loading screen while auth state is being determined
    if (loading) {
        return (
            <div className="w-screen h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-custom-indigo-600 animate-spin" />
            </div>
        );
    }
    
    return isAuthenticated ? <MainApp /> : <LoginPage />;
}

export default App;