
import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { AirtableRecord, Matter, Task } from '../types';
import ProgressBar from './ProgressBar';
import ChecklistItem from './ChecklistItem';
import useAirtableMutation from '../hooks/useAirtableMutation';
import { useToast } from '../contexts/ToastContext';
import { useAirtableData } from '../contexts/AirtableDataContext';
import './WorkflowTracker.css';
import { Loader2, Wand2 } from 'lucide-react';

interface WorkflowTrackerProps {
    tasks: AirtableRecord<Task>[];
    matter: AirtableRecord<Matter>;
}

const WorkflowSection: React.FC<{ title: string; count: number; children: React.ReactNode; }> = ({ title, count, children }) => (
    <section className="workflow-section">
        <h5 className="workflow-section-title">{title} <span className="workflow-section-count">{count}</span></h5>
        <div className="workflow-section-items">
            {children}
        </div>
    </section>
);


const WorkflowTracker: React.FC<WorkflowTrackerProps> = ({ tasks, matter }) => {
    const { refetchTasks } = useAirtableData();
    const { updateRecord } = useAirtableMutation();
    const { addToast } = useToast();
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
    const [isApplyingWorkflow, setIsApplyingWorkflow] = useState(false);

    const { todoTasks, inProgressTasks, doneTasks, progress } = useMemo(() => {
        const todo = tasks.filter(t => t.fields.Status === 'To-Do');
        const inProgress = tasks.filter(t => t.fields.Status === 'In-Progress');
        const done = tasks.filter(t => t.fields.Status === 'Done');
        const totalTasks = tasks.length;
        const progressPercentage = totalTasks > 0 ? (done.length / totalTasks) * 100 : 0;
        return {
            todoTasks: todo,
            inProgressTasks: inProgress,
            doneTasks: done,
            progress: progressPercentage
        };
    }, [tasks]);
    
    const handleStatusChange = async (task: AirtableRecord<Task>, newStatus: Task['Status']) => {
        if (updatingTaskId) return;
        setUpdatingTaskId(task.id);
        try {
            await updateRecord('Tasks', task.id, { Status: newStatus });
            addToast(`Task marked as done!`, 'success');
            await refetchTasks({ background: true });
        } catch (e) {
            console.error("Failed to update task status:", e);
            const error = e instanceof Error ? e.message : String(e);
            addToast(`Error completing task: ${error}`, 'error');
        } finally {
            setUpdatingTaskId(null);
        }
    };

    const handleApplyWorkflow = async () => {
        setIsApplyingWorkflow(true);
        const webhookUrl = 'https://hook.eu2.make.com/j0mkqwemt5msw4vbrnha9l9zjpc677kr';
        try {
            // Webhooks often expect form-urlencoded data instead of JSON.
            // We'll create a URLSearchParams object to send the data in this format.
            const params = new URLSearchParams();
            params.append('matterId', matter.id);

            await axios.post(webhookUrl, params);

            addToast('Workflow template is being applied. Tasks will appear shortly.', 'info');
            // Poll for changes as automation might take a few seconds.
            setTimeout(() => {
                refetchTasks({ background: true });
            }, 5000); 
        } catch (error) {
            console.error('Failed to apply workflow template:', error);
            const errorMessage = axios.isAxiosError(error) ? error.message : String(error);
            addToast(`Failed to apply workflow template: ${errorMessage}`, 'error');
        } finally {
            setIsApplyingWorkflow(false);
        }
    };

    if (tasks.length === 0) {
        return (
            <div className="text-center py-4 text-slate-500 italic">
                <p>No workflow tasks have been generated for this matter yet.</p>
                <button
                    onClick={handleApplyWorkflow}
                    disabled={isApplyingWorkflow}
                    className="mt-4 inline-flex items-center gap-2 bg-custom-indigo-100 text-custom-indigo-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-custom-indigo-200 transition-colors border border-custom-indigo-200 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-wait"
                >
                    {isApplyingWorkflow ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Wand2 className="w-4 h-4" />
                    )}
                    {isApplyingWorkflow ? 'Applying...' : 'Apply Workflow Template'}
                </button>
            </div>
        );
    }
    
    return (
        <div className="workflow-tracker-container">
            <ProgressBar progress={progress} />
            
            <div className="workflow-columns">
                 <WorkflowSection title="To Do" count={todoTasks.length}>
                    {todoTasks.length > 0 ? todoTasks.map(task => (
                        <ChecklistItem 
                            key={task.id} 
                            task={task} 
                            onStatusChange={handleStatusChange} 
                            isUpdating={updatingTaskId === task.id}
                        />
                    )) : <p className="workflow-empty-state">No tasks to do.</p>}
                </WorkflowSection>
                
                <WorkflowSection title="In Progress" count={inProgressTasks.length}>
                     {inProgressTasks.length > 0 ? inProgressTasks.map(task => (
                        <ChecklistItem 
                            key={task.id} 
                            task={task} 
                            onStatusChange={handleStatusChange} 
                            isUpdating={updatingTaskId === task.id}
                        />
                    )) : <p className="workflow-empty-state">No tasks in progress.</p>}
                </WorkflowSection>
                
                <WorkflowSection title="Done" count={doneTasks.length}>
                     {doneTasks.length > 0 ? doneTasks.map(task => (
                        <ChecklistItem 
                            key={task.id} 
                            task={task} 
                            onStatusChange={handleStatusChange} 
                            isUpdating={updatingTaskId === task.id}
                        />
                    )) : <p className="workflow-empty-state">No tasks completed yet.</p>}
                </WorkflowSection>
            </div>
        </div>
    );
}

export default WorkflowTracker;
