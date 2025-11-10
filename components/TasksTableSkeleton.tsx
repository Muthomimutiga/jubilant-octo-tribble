import React from 'react';
import './TaskItem.css';
import './KanbanBoard.css';

interface TasksSkeletonProps {
    view: 'list' | 'board';
}

interface TaskItemSkeletonProps {
    viewMode: 'list' | 'board';
}

const TaskItemSkeleton: React.FC<TaskItemSkeletonProps> = ({ viewMode }) => {
    if (viewMode === 'board') {
        return (
            <div className="task-item task-item--board !cursor-default">
                <div className="task-item-priority-highlight bg-slate-200"></div>
                <div className="h-5 bg-slate-200 rounded w-4/5"></div>
            </div>
        );
    }
    
    // List view skeleton
    return (
        <div className="task-item !cursor-default">
            <div className="task-item-checkbox-wrapper">
                <div className="h-7 w-7 bg-slate-200 rounded-md"></div>
            </div>
            <div className="task-item-main-info space-y-2">
                <div className="h-5 bg-slate-200 rounded w-4/5"></div>
                <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
            <div className="task-item-meta">
                <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="h-6 bg-slate-200 rounded-full w-20"></div>
                <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
            </div>
        </div>
    );
};


const KanbanBoardSkeleton: React.FC = () => (
    <div className="kanban-board">
        {['To-Do', 'In-Progress', 'Done'].map(status => (
            <div key={status} className="kanban-column">
                <h3 className="kanban-column-title">
                    <div className="h-5 w-24 bg-slate-200 rounded"></div>
                    <div className="h-5 w-8 bg-slate-200 rounded-full"></div>
                </h3>
                <div className="kanban-column-tasks space-y-3">
                    <TaskItemSkeleton viewMode="board" />
                    <TaskItemSkeleton viewMode="board" />
                </div>
            </div>
        ))}
    </div>
);


const TasksTableSkeleton: React.FC<TasksSkeletonProps> = ({ view }) => {
    return (
        <div className="animate-pulse">
            {view === 'list' ? (
                <div className="task-list-container">
                    {Array.from({ length: 5 }).map((_, index) => <TaskItemSkeleton key={index} viewMode="list" />)}
                </div>
            ) : (
                <KanbanBoardSkeleton />
            )}
        </div>
    );
};

export default TasksTableSkeleton;