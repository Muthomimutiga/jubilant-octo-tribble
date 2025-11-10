

import React, { useState, useMemo } from 'react';
import InfoCard from './InfoCard';
import { CheckSquare, Loader2, Square } from 'lucide-react';
import { AirtableRecord, Task } from '../types';
import { useAirtableData } from '../contexts/AirtableDataContext';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import useAirtableMutation from '../hooks/useAirtableMutation';

// Helper to format date and check if it's overdue
const formatDate = (dateString?: string): { text: string; isOverdue: boolean } => {
    if (!dateString) return { text: 'No date', isOverdue: false };
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Adjust for timezone offset for accurate comparison
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + userTimezoneOffset);
    return {
        text: localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isOverdue: localDate < today
    };
};

// Helper for priority styling
const getPriorityClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
        case 'high': return 'priority-high';
        case 'medium': return 'priority-medium';
        case 'low': return 'priority-low';
        default: return '';
    }
};

const DashboardTaskItem: React.FC<{
    task: AirtableRecord<Task>;
    onStatusChange: (task: AirtableRecord<Task>) => void;
    isUpdating: boolean;
}> = ({ task, onStatusChange, isUpdating }) => {
    const { fields } = task;
    const { text: dueDate, isOverdue: overdue } = formatDate(fields['Due Date']);
    const matterNames = (fields['Matter Name (from Matter)'] || []).join(', ');

    return (
        <div className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-b-0">
            <button
                onClick={() => onStatusChange(task)}
                className="p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-custom-indigo-300 disabled:cursor-wait"
                disabled={isUpdating}
                aria-label={`Mark task "${fields['Task Name']}" as done`}
            >
                {isUpdating ? <Loader2 className="w-5 h-5 text-slate-400 animate-spin" /> : <Square className="w-5 h-5 text-slate-400 hover:text-custom-indigo-600" />}
            </button>
            <div className="flex-grow overflow-hidden">
                <p className="font-semibold text-slate-800 leading-snug truncate" title={fields['Task Name']}>
                    {fields['Task Name']}
                </p>
                <p className="text-sm text-slate-500 truncate" title={matterNames}>
                    {matterNames || 'No Linked Matter'}
                </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`text-xs font-semibold w-16 text-right ${overdue ? 'text-red-600' : 'text-slate-500'}`}>{dueDate}</span>
                <span className={`h-2.5 w-2.5 rounded-full ${getPriorityClass(fields.Priority)}`} title={`Priority: ${fields.Priority}`}></span>
            </div>
        </div>
    );
};

interface MyTasksWidgetProps {
    onNavigate: (page: string) => void;
}

const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({ onNavigate }) => {
    const { loading, refetchTasks, tasks } = useAirtableData();
    const { currentUser } = useAuth();
    const { addToast } = useToast();
    const { updateRecord } = useAirtableMutation();
    
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
    const [isMyTasksCollapsed, setIsMyTasksCollapsed] = useState(false);

    const myOpenTasks = useMemo(() => {
        if (!currentUser) return [];
        const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };

        return tasks
            .filter(t => t.fields.Assignee?.includes(currentUser.id) && t.fields.Status !== 'Done')
            .sort((a, b) => {
                const priorityA = priorityOrder[a.fields.Priority || 'Low'] || 3;
                const priorityB = priorityOrder[b.fields.Priority || 'Low'] || 3;
                if (priorityA !== priorityB) return priorityA - priorityB;

                const dateA = a.fields['Due Date'] ? new Date(a.fields['Due Date']).getTime() : Infinity;
                const dateB = b.fields['Due Date'] ? new Date(b.fields['Due Date']).getTime() : Infinity;
                return dateA - dateB;
            })
            .slice(0, 5);
    }, [tasks, currentUser]);

    const handleUpdateStatus = async (task: AirtableRecord<Task>) => {
        if (updatingTaskId) return;
        setUpdatingTaskId(task.id);
        try {
            await updateRecord('Tasks', task.id, { Status: 'Done' });
            addToast(`Task "${task.fields['Task Name']}" completed!`, 'success');
            await refetchTasks();
        } catch (e) {
            console.error("Failed to update task status:", e);
            const error = e instanceof Error ? e.message : String(e);
            addToast(`Error completing task: ${error}`, 'error');
        } finally {
            setUpdatingTaskId(null);
        }
    };

    return (
        <InfoCard 
            title="My Open Tasks" 
            icon={CheckSquare} 
            isCollapsible={true} 
            isClosable={false}
            isCollapsed={isMyTasksCollapsed}
            onToggleCollapse={() => setIsMyTasksCollapsed(prev => !prev)}
            className="!mb-0" // Reset margin as it's handled by the grid gap
        >
            {loading && tasks.length === 0 && <p className="text-slate-500 italic">Loading tasks...</p>}
            {!loading && myOpenTasks.length > 0 ? (
                <div className="space-y-1 -mx-2">
                    {myOpenTasks.map(task => 
                        <DashboardTaskItem 
                            key={task.id} 
                            task={task}
                            onStatusChange={handleUpdateStatus}
                            isUpdating={updatingTaskId === task.id}
                        />
                    )}
                </div>
            ) : (
                 !loading && <p className="text-slate-600 text-center py-4">You have no open tasks. Great job!</p>
            )}
            <div className="text-center mt-6">
                <button 
                    onClick={() => onNavigate('Tasks')}
                    className="bg-slate-100 text-custom-indigo-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors w-full border border-slate-300 hover:border-custom-indigo-500 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50"
                >
                    View All My Tasks
                </button>
            </div>
        </InfoCard>
    );
};

export default MyTasksWidget;