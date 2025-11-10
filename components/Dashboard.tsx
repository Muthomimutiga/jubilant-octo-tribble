

import React, { useState, useEffect, useMemo } from 'react';
import { Settings, Loader2 } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import MyDay from './MyDay';
import FinancialSnapshot from './FinancialSnapshot';
import WorkloadStatus from './WorkloadStatus';
import MyTasksWidget from './MyTasksWidget';
import FeeNotesWidget from './FeeNotesWidget';
import AutomationWidget from './AutomationWidget';
import RecentDocumentsWidget from './RecentDocumentsWidget';
import TopContributorsWidget from './TopContributorsWidget';
import AchievementsWidget from './AchievementsWidget';
import CustomizeDashboardModal from './CustomizeDashboardModal';
import './../pages/DashboardPage.css';

interface DashboardProps {
    onNavigate: (page: string) => void;
    onOpenTaskModal: () => void;
    onOpenFeenoteModal: () => void;
}

interface WidgetConfig {
    id: string;
    title: string;
    Component: React.FC<any>;
}

export const ALL_WIDGETS: WidgetConfig[] = [
    { id: 'top-contributors', title: 'Top Contributors', Component: TopContributorsWidget },
    { id: 'achievements', title: 'My Achievements', Component: AchievementsWidget },
    { id: 'financials', title: 'Financial Snapshot', Component: FinancialSnapshot },
    { id: 'workload', title: 'Workload Status', Component: WorkloadStatus },
    { id: 'my-tasks', title: 'My Open Tasks', Component: MyTasksWidget },
    { id: 'fee-notes', title: 'Fee Notes Due Today', Component: FeeNotesWidget },
    { id: 'automation', title: 'Document Automation', Component: AutomationWidget },
    { id: 'recent-documents', title: 'Recent Documents', Component: RecentDocumentsWidget },
];

const WIDGET_MAP: Record<string, React.FC<any>> = ALL_WIDGETS.reduce((acc, widget) => {
    acc[widget.id] = widget.Component;
    return acc;
}, {} as Record<string, React.FC<any>>);

// Default layout for new users
const DEFAULT_MAIN_COLUMN = ['financials', 'fee-notes', 'automation'];
const DEFAULT_SIDEBAR_COLUMN = ['top-contributors', 'achievements', 'workload', 'my-tasks'];
const DEFAULT_HIDDEN_WIDGETS = ['recent-documents'];


export const Dashboard: React.FC<DashboardProps> = (props) => {
    const { loading } = useAirtableData();
    const [isInitialized, setIsInitialized] = useState(false);
    
    // State for widget layout
    const [mainColumn, setMainColumn] = useState<string[]>(DEFAULT_MAIN_COLUMN);
    const [sidebarColumn, setSidebarColumn] = useState<string[]>(DEFAULT_SIDEBAR_COLUMN);
    const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(DEFAULT_HIDDEN_WIDGETS);

    // State for drag & drop
    const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
    const [dragOverInfo, setDragOverInfo] = useState<{ column: 'main' | 'sidebar', index: number } | null>(null);
    
    // State for customization modal
    const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);

    // Load layout from localStorage on initial render
    useEffect(() => {
        try {
            const savedLayout = localStorage.getItem('dashboardLayout');
            if (savedLayout) {
                const { main, sidebar, hidden } = JSON.parse(savedLayout);
                if(Array.isArray(main) && Array.isArray(sidebar) && Array.isArray(hidden)) {
                    setMainColumn(main);
                    setSidebarColumn(sidebar);
                    setHiddenWidgets(hidden);
                }
            }
        } catch (e) {
            console.error("Failed to load dashboard layout from localStorage", e);
            // Revert to defaults if localStorage is corrupt
            setMainColumn(DEFAULT_MAIN_COLUMN);
            setSidebarColumn(DEFAULT_SIDEBAR_COLUMN);
            setHiddenWidgets(DEFAULT_HIDDEN_WIDGETS);
        }
        setIsInitialized(true);
    }, []);

    // Save layout to localStorage whenever it changes
    useEffect(() => {
        if (!isInitialized) return;
        const layout = { main: mainColumn, sidebar: sidebarColumn, hidden: hiddenWidgets };
        localStorage.setItem('dashboardLayout', JSON.stringify(layout));
    }, [mainColumn, sidebarColumn, hiddenWidgets, isInitialized]);

    const visibleMainWidgets = useMemo(() => mainColumn.filter(id => !hiddenWidgets.includes(id)), [mainColumn, hiddenWidgets]);
    const visibleSidebarWidgets = useMemo(() => sidebarColumn.filter(id => !hiddenWidgets.includes(id)), [sidebarColumn, hiddenWidgets]);

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, id: string) => {
        setDraggedWidgetId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.classList.add('is-dragging');
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('is-dragging');
        setDraggedWidgetId(null);
        setDragOverInfo(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, column: 'main' | 'sidebar', index: number) => {
        e.preventDefault();
        if (draggedWidgetId) {
            setDragOverInfo({ column, index });
        }
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumn: 'main' | 'sidebar', targetIndex: number) => {
        e.preventDefault();
        if (!draggedWidgetId) return;

        // Find and remove the dragged widget from its original position
        let sourceColumnWidgets = [...mainColumn];
        let otherColumnWidgets = [...sidebarColumn];
        let sourceColumnSetter = setMainColumn;
        let otherColumnSetter = setSidebarColumn;

        const sourceIndex = mainColumn.indexOf(draggedWidgetId);
        if (sourceIndex === -1) {
            sourceColumnWidgets = [...sidebarColumn];
            otherColumnWidgets = [...mainColumn];
            sourceColumnSetter = setSidebarColumn;
            otherColumnSetter = setMainColumn;
        }
        
        const [removed] = sourceColumnWidgets.splice(sourceColumnWidgets.indexOf(draggedWidgetId), 1);
        
        // Add to new position
        if (targetColumn === (sourceColumnSetter === setMainColumn ? 'main' : 'sidebar')) {
            sourceColumnWidgets.splice(targetIndex, 0, removed);
            sourceColumnSetter(sourceColumnWidgets);
        } else {
            otherColumnWidgets.splice(targetIndex, 0, removed);
            sourceColumnSetter(sourceColumnWidgets);
            otherColumnSetter(otherColumnWidgets);
        }

        setDraggedWidgetId(null);
        setDragOverInfo(null);
    };
    
    const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>, column: 'main' | 'sidebar') => {
        e.preventDefault();
        const currentColumn = column === 'main' ? visibleMainWidgets : visibleSidebarWidgets;
        // If dragging over the empty space at the bottom of a column
        if (!e.currentTarget.querySelector('.drop-indicator')) {
             setDragOverInfo({ column, index: currentColumn.length });
        }
    }

    const renderWidget = (id: string, column: 'main' | 'sidebar', index: number) => {
        const WidgetComponent = WIDGET_MAP[id];
        if (!WidgetComponent) return null;

        return (
            <div key={id}>
                {dragOverInfo?.column === column && dragOverInfo.index === index && (
                    <div className="drop-indicator"></div>
                )}
                <div 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, column, index)}
                    onDrop={(e) => handleDrop(e, column, index)}
                    className="widget-container"
                >
                    <WidgetComponent {...props} />
                </div>
            </div>
        );
    };

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-12 h-12 text-custom-indigo-600 animate-spin" />
            </div>
        )
    }

    return (
        <>
            <MyDay />
            <div className="dashboard-header">
                <h2 className="dashboard-title">My Dashboard</h2>
                <button onClick={() => setIsCustomizeModalOpen(true)} className="customize-btn">
                    <Settings className="w-4 h-4" />
                    Customize
                </button>
            </div>
            <div className="dashboard-grid">
                <div className="dashboard-main-column" onDragOver={(e) => handleColumnDragOver(e, 'main')}>
                    {visibleMainWidgets.map((id, index) => renderWidget(id, 'main', index))}
                    {dragOverInfo?.column === 'main' && dragOverInfo.index === visibleMainWidgets.length && (
                         <div className="drop-indicator"></div>
                    )}
                </div>
                <div className="dashboard-sidebar-column" onDragOver={(e) => handleColumnDragOver(e, 'sidebar')}>
                     {visibleSidebarWidgets.map((id, index) => renderWidget(id, 'sidebar', index))}
                     {dragOverInfo?.column === 'sidebar' && dragOverInfo.index === visibleSidebarWidgets.length && (
                         <div className="drop-indicator"></div>
                    )}
                </div>
            </div>
            
            <CustomizeDashboardModal
                isOpen={isCustomizeModalOpen}
                onClose={() => setIsCustomizeModalOpen(false)}
                hiddenWidgets={hiddenWidgets}
                setHiddenWidgets={setHiddenWidgets}
            />
        </>
    );
};