
import React from 'react';
import { AirtableRecord, Task } from '../types';
import { X, Pencil, Trash2, Calendar, ListChecks, Flag, FileText, User } from 'lucide-react';
import { useAirtableData } from '../contexts/AirtableDataContext';

// Helper to safely get display string
const safeGetString = (value: unknown): string => {
    if (Array.isArray(value)) return value.join(', ');
    return value ? String(value) : '';
};

// Detail Item component
const DetailItem: React.FC<{ icon: React.ElementType; label: string; children: React.ReactNode }> = ({ icon: Icon, label, children }) => (
    <div className="flex items-start gap-4">
        <Icon className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
        <div className="flex-grow">
            <h4 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{label}</h4>
            <div className="text-base text-slate-800 mt-1">{children}</div>
        </div>
    </div>
);

// Status Badge
const getStatusBadgeClasses = (status?: string) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full inline-block capitalize';
    switch (status) {
        case 'To-Do': return `${base} bg-blue-100 text-blue-800`;
        case 'In-Progress': return `${base} bg-yellow-100 text-yellow-800`;
        case 'Done': return `${base} bg-green-100 text-green-800`;
        default: return `${base} bg-slate-100 text-slate-800`;
    }
};

// Priority Badge
const getPriorityBadgeClasses = (priority?: string) => {
    const base = 'px-3 py-1 text-xs font-semibold rounded-full inline-block capitalize';
    switch (priority) {
        case 'High': return `${base} bg-red-100 text-red-800`;
        case 'Medium': return `${base} bg-orange-100 text-orange-800`;
        case 'Low': return `${base} bg-sky-100 text-sky-800`;
        default: return `${base} bg-slate-100 text-slate-800`;
    }
};

interface TaskDetailModalProps {
    task: AirtableRecord<Task> | null;
    onClose: () => void;
    onEdit: (task: AirtableRecord<Task>) => void;
    onDelete: (taskId: string) => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onEdit, onDelete }) => {
    const { allUsers } = useAirtableData();
    if (!task) return null;

    const { fields } = task;

    const assigneeId = fields.Assignee?.[0];
    const assignee = assigneeId ? allUsers.find(u => u.id === assigneeId) : null;
    const assigneeName = assignee?.fields.Name || 'Unassigned';

    const formattedDueDate = fields['Due Date'] 
        ? new Date(fields['Due Date']).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) 
        : 'Not set';

    return (
        <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="task-detail-title">
            <div className="modal-content !max-w-2xl" onClick={(e) => e.stopPropagation()}>
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500"
                    aria-label="Close task details"
                >
                    <X className="w-6 h-6" />
                </button>
                
                <header className="pb-4 mb-2">
                    <div className="flex justify-between items-start gap-4">
                        <h2 id="task-detail-title" className="text-3xl font-bold text-slate-800 flex-grow">{fields['Task Name'] || 'Untitled Task'}</h2>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button 
                                onClick={() => onEdit(task)}
                                className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-300 hover:border-custom-indigo-500 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50"
                                aria-label="Edit task"
                            >
                                <Pencil className="w-4 h-4" /> Edit
                            </button>
                             <button 
                                onClick={() => onDelete(task.id)}
                                className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                                aria-label="Delete task"
                            >
                                <Trash2 className="w-4 h-4" /> Delete
                            </button>
                        </div>
                    </div>
                </header>

                <div className="modal-body-content space-y-6 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                         <div className="flex items-center gap-3">
                             <ListChecks className="w-6 h-6 text-custom-indigo-500"/>
                             <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase">Status</h4>
                                <span className={getStatusBadgeClasses(fields.Status)}>{fields.Status || 'N/A'}</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-3">
                             <Flag className="w-6 h-6 text-custom-indigo-500"/>
                             <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase">Priority</h4>
                                <span className={getPriorityBadgeClasses(fields.Priority)}>{fields.Priority || 'N/A'}</span>
                             </div>
                         </div>
                         <div className="flex items-center gap-3">
                             <Calendar className="w-6 h-6 text-custom-indigo-500"/>
                             <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase">Due Date</h4>
                                <p className="text-slate-800 font-medium">{formattedDueDate}</p>
                             </div>
                         </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 space-y-6">
                        <DetailItem icon={FileText} label="Related Matter">
                            <p className="text-custom-indigo-700 font-semibold">{safeGetString(fields['Matter Name (from Matter)']) || <span className="text-slate-500 italic">No linked matter.</span>}</p>
                        </DetailItem>
                        <DetailItem icon={User} label="Assignee">
                            <p>{assigneeName}</p>
                        </DetailItem>
                        <DetailItem icon={Pencil} label="Description">
                            <p className="whitespace-pre-wrap">{fields.Description || <span className="text-slate-500 italic">No description provided.</span>}</p>
                        </DetailItem>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;