

import React from 'react';
import { AirtableRecord, Task } from '../types';
import { CheckSquare, Square, User, Loader2 } from 'lucide-react';
import './TaskItem.css';
import { useAirtableData } from '../contexts/AirtableDataContext';

interface TaskItemProps {
    task: AirtableRecord<Task>;
    onStatusChange: (task: AirtableRecord<Task>, newStatus: Task['Status']) => void;
    onViewDetails: (task: AirtableRecord<Task>) => void;
    isUpdating: boolean;
    style?: React.CSSProperties;
    viewMode: 'list' | 'board';
}

const getPriorityClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'priority-high';
      case 'medium': return 'priority-medium';
      case 'low': return 'priority-low';
      default: return 'priority-unknown';
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    // Adjust for timezone offset to show the correct local date
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + userTimezoneOffset).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const isOverdue = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Compare dates only, ignoring time
  return new Date(dateString) < today;
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange, onViewDetails, isUpdating, style, viewMode }) => {
    const { fields } = task;
    const isCompleted = fields.Status === 'Done';
    const { allUsers } = useAirtableData();
    
    const assigneeId = fields.Assignee?.[0];
    const assignee = assigneeId ? allUsers.find(u => u.id === assigneeId) : null;
    const assigneeAvatarUrl = assignee?.fields.Avatar?.[0]?.url;
    const assigneeInitials = assignee?.fields.Name?.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';
    const assigneeName = assignee?.fields.Name || 'Unassigned';
    
    const matterNames = (fields['Matter Name (from Matter)'] || []).join(', ');

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newStatus = isCompleted ? 'To-Do' : 'Done';
        onStatusChange(task, newStatus);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("taskId", task.id);
        e.currentTarget.classList.add('is-dragging');
    };
    
    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('is-dragging');
    };
    
    // Simplified view for Kanban Board
    if (viewMode === 'board') {
        return (
            <div 
                className={`task-item task-item--board ${isUpdating ? 'is-updating' : ''}`}
                style={style} 
                onClick={() => !isUpdating && onViewDetails(task)} 
                role="button" 
                tabIndex={isUpdating ? -1 : 0}
                draggable={!isUpdating}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
            >
                <div className={`task-item-priority-highlight ${getPriorityClass(fields.Priority)}`}></div>
                <p className="task-item-name">{fields['Task Name'] || 'Untitled Task'}</p>
                {isUpdating && (
                    <div className="task-item-board-loader">
                        <Loader2 className="w-4 h-4 animate-spin text-custom-indigo-600" />
                    </div>
                )}
            </div>
        )
    }

    // Full view for List
    return (
        <div 
            className={`task-item ${isUpdating ? 'is-updating' : ''}`}
            style={style} 
            onClick={() => !isUpdating && onViewDetails(task)} 
            role="button" 
            tabIndex={isUpdating ? -1 : 0}
            draggable={!isUpdating}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="task-item-checkbox-wrapper">
                 {isUpdating ? (
                    <Loader2 className="h-7 w-7 text-slate-400 animate-spin" />
                 ) : (
                    <button onClick={handleToggle} className="task-item-checkbox-btn" aria-label={isCompleted ? 'Mark task as incomplete' : 'Mark task as complete'}>
                        {isCompleted ? <CheckSquare className="text-custom-indigo-600" /> : <Square className="text-slate-400" />}
                    </button>
                 )}
            </div>

            <div className="task-item-main-info">
                <p className={`task-item-name ${isCompleted ? 'is-completed' : ''}`}>{fields['Task Name'] || 'Untitled Task'}</p>
                <p className="task-item-context">{matterNames || 'No linked matter'}</p>
            </div>

            <div className="task-item-meta">
                <div className="task-item-assignee" title={`Assigned to: ${assigneeName}`}>
                    {assigneeAvatarUrl ? (
                         <img src={assigneeAvatarUrl} alt={assigneeName} className="w-full h-full object-cover" />
                    ) : (
                        <span className="assignee-initials">{assigneeInitials}</span>
                    )}
                    <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-400 ring-2 ring-white"></span>
                </div>

                <div className={`task-item-date ${isOverdue(fields['Due Date']) && !isCompleted ? 'is-overdue' : ''}`}>
                    {formatDate(fields['Due Date'])}
                </div>

                {fields.Priority && (
                    <div className={`task-priority-badge ${getPriorityClass(fields.Priority)}`}>
                        {fields.Priority}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskItem;