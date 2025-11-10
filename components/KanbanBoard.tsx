

import React, { useState } from 'react';
import { AirtableRecord, Task } from '../types';
import TaskItem from './TaskItem';
import './KanbanBoard.css';

type TaskStatus = 'To-Do' | 'In-Progress' | 'Done';

const KANBAN_COLUMNS: TaskStatus[] = ['To-Do', 'In-Progress', 'Done'];

const COLUMN_DOT_STYLES: Record<TaskStatus, string> = {
    'To-Do': 'dot todo',
    'In-Progress': 'dot inprogress',
    'Done': 'dot done'
};

interface KanbanBoardProps {
    tasks: AirtableRecord<Task>[];
    onStatusChange: (task: AirtableRecord<Task>, newStatus: Task['Status']) => void;
    onEditTask: (task: AirtableRecord<Task>) => void;
    updatingTaskId: string | null;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onStatusChange, onEditTask, updatingTaskId }) => {
    const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

    const tasksByStatus = tasks.reduce((acc, task) => {
        const status = task.fields.Status || 'To-Do';
        if (!acc[status]) {
            acc[status] = [];
        }
        acc[status].push(task);
        return acc;
    }, {} as Record<TaskStatus, AirtableRecord<Task>[]>);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, status: TaskStatus) => {
        e.preventDefault();
        setDragOverColumn(status);
    };

    const handleDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: TaskStatus) => {
        e.preventDefault();
        setDragOverColumn(null);
        const taskId = e.dataTransfer.getData("taskId");
        const task = tasks.find(t => t.id === taskId);
        
        if (task && task.fields.Status !== newStatus) {
            onStatusChange(task, newStatus);
        }
    };

    return (
        <div className="kanban-board">
            {KANBAN_COLUMNS.map(status => (
                <div 
                    key={status} 
                    className={`kanban-column ${dragOverColumn === status ? 'is-drag-over' : ''}`}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                >
                    <h3 className="kanban-column-title">
                        <span className="kanban-column-title-text">
                            <span className={COLUMN_DOT_STYLES[status]}></span>
                            {status.replace('-', ' ')}
                        </span>
                        <span className="kanban-column-count">
                            {(tasksByStatus[status] || []).length}
                        </span>
                    </h3>
                    <div className="kanban-column-tasks">
                        {(tasksByStatus[status] || []).map((task, index) => (
                            <TaskItem 
                                key={task.id}
                                task={task}
                                onStatusChange={onStatusChange}
                                onViewDetails={onEditTask}
                                isUpdating={updatingTaskId === task.id}
                                viewMode="board"
                                style={{ '--row-index': index } as React.CSSProperties}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;