
import React from 'react';
import { NavItem } from '../types';
import { 
    LayoutDashboard, FolderKanban, CheckSquare, Calendar, Files, 
    NotebookText, Users, Landmark, Settings, UserPlus, Wand2
} from 'lucide-react';

const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '#' },
    { icon: FolderKanban, label: 'Matters', href: '#' },
    { icon: CheckSquare, label: 'Tasks', href: '#' },
    { icon: Calendar, label: 'Calendar', href: '#' },
    { icon: Files, label: 'Document', href: '#' },
    { icon: Wand2, label: 'Automation', href: '#' },
    { icon: NotebookText, label: 'Notes', href: '#' },
    { icon: Users, label: 'Clients', href: '#' },
    { icon: Landmark, label: 'Billing', href: '#' },
    { icon: Settings, label: 'Settings', href: '#' },
];

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
    onOpenOnboarding: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, onOpenOnboarding }) => {
    return (
        <aside className="bg-slate-900 text-slate-200 w-64 p-4 flex flex-col shadow-2xl fixed inset-y-0 left-0 z-30">
            <div className="mb-8">
                 <button
                    onClick={() => onNavigate('Dashboard')}
                    className="flex items-center space-x-4 p-2 rounded-lg hover:bg-slate-800 transition-colors w-full text-left focus:outline-none focus:ring-2 focus:ring-custom-indigo-500"
                    aria-label="Go to Dashboard"
                >
                    <div className="w-11 h-11 rounded-lg bg-custom-indigo-600 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0">
                        K
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-white">Kiguatha & Co.</h2>
                        <span className="text-xs text-slate-400">Advocates</span>
                    </div>
                </button>
            </div>

            <div className="mb-6 px-1">
                <button
                    onClick={onOpenOnboarding}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-custom-indigo-500 to-custom-indigo-700 text-white px-4 py-3 rounded-lg font-semibold hover:from-custom-indigo-600 hover:to-custom-indigo-800 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-75"
                >
                    <UserPlus className="w-5 h-5"/>
                    Onboard New Client
                </button>
            </div>

            <nav className="flex-grow">
                <h3 className="text-xs font-bold uppercase text-slate-500 mb-4 px-2 tracking-wider">Main Navigation</h3>
                <ul>
                    {navItems.map((item, index) => {
                        const active = currentPage === item.label;
                        const isImplemented = ['Dashboard', 'Matters', 'Tasks', 'Calendar', 'Document', 'Automation', 'Notes', 'Clients', 'Billing', 'Settings'].includes(item.label);

                        return (
                        <li key={index} className="mb-1">
                            <a 
                                href={item.href || '#'} 
                                onClick={(e) => {
                                    e.preventDefault();
                                    if(isImplemented) {
                                        onNavigate(item.label);
                                    }
                                }}
                                className={`flex items-center py-2.5 px-3 rounded-lg transition-all duration-200 ease-in-out group ${
                                    active 
                                    ? 'bg-custom-indigo-600 text-white shadow-md' 
                                    : isImplemented 
                                        ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        : 'text-slate-600 cursor-not-allowed'
                                }`}
                                aria-current={active ? 'page' : undefined}
                                role="button"
                                aria-disabled={!isImplemented}
                            >
                                <div className={`w-1 h-6 rounded-full mr-2 transition-colors duration-200 ${active ? 'bg-custom-indigo-500' : 'bg-transparent group-hover:bg-slate-700'}`}></div>
                                <item.icon className={`w-5 h-5 mr-3 transition-colors duration-200 ${active ? 'text-white' : isImplemented ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-700'}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                                {!isImplemented && <span className="text-xs text-custom-amber-500 ml-auto">(soon)</span>}
                            </a>
                        </li>
                    )})}
                </ul>
            </nav>
        </aside>
    );
}

export default Sidebar;