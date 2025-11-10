
import React from 'react';
import { AirtableRecord, Task } from '../types';
import { useAirtableData } from '../contexts/AirtableDataContext';
import { CheckSquare, Square, Loader2 } from 'lucide-react';

interface ChecklistItemProps {
    task: AirtableRecord<Task>;
    onStatusChange: (task: AirtableRecord<Task>, newStatus: Task['Status']) => void;
    isUpdating: boolean;
}

const formatDate = (dateString?: string): { text: string; isOverdue: boolean } => {
    if (!dateString) return { text: 'No date', isOverdue: false };
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() + userTimezoneOffset);
    return {
        text: localDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        isOverdue: localDate < today
    };
};

const ChecklistItem: React.FC<ChecklistItemProps> = ({ task, onStatusChange, isUpdating }) => {
    const { fields } = task;
    const isCompleted = fields.Status === 'Done';
    const { allUsers } = useAirtableData();

    const assigneeId = fields.Assignee?.[0];
    const assignee = assigneeId ? allUsers.find(u => u.id === assigneeId) : null;
    const assigneeAvatarUrl = assignee?.fields.Avatar?.[0]?.url;
    const assigneeInitials = assignee?.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
    const assigneeName = assignee?.fields.Name || 'Unassigned';

    const { text: dueDate, isOverdue } = formatDate(fields['Due Date']);

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isCompleted || isUpdating) return;
        onStatusChange(task, 'Done');
    };

    return (
        <div className={`checklist-item ${isCompleted ? 'is-completed' : ''} ${isUpdating ? 'is-updating' : ''}`}>
            <div className="checklist-item-checkbox">
                {isUpdating ? (
                    <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                ) : (
                    <button onClick={handleToggle} disabled={isCompleted || isUpdating} aria-label={`Mark task "${fields['Task Name']}" as done`}>
                        {isCompleted ? <CheckSquare className="w-5 h-5 text-green-500" /> : <Square className="w-5 h-5 text-slate-400 hover:text-custom-indigo-600" />}
                    </button>
                )}
            </div>
            <p className="checklist-item-name">{fields['Task Name']}</p>
            <div className="checklist-item-meta">
                <span className={`checklist-item-date ${isOverdue && !isCompleted ? 'is-overdue' : ''}`}>{dueDate}</span>
                <div className="checklist-item-assignee" title={`Assigned to: ${assigneeName}`}>
                    {assigneeAvatarUrl ? (
                        <img src={assigneeAvatarUrl} alt={assigneeName} />
                    ) : (
                        <span>{assigneeInitials}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChecklistItem;
