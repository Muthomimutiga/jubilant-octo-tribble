import React, { useMemo } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import { useAuth } from '../contexts/AuthContext';
import { Files, ListChecks, Calendar, FolderKanban, AlertTriangle } from 'lucide-react';
import { AirtableRecord, Task, Matter, CalendarEvent } from '../types';

interface WorkloadStatusProps {
    onNavigate: (page: string) => void;
}

const getStartAndEndOfWeek = (date: Date): [Date, Date] => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return [start, end];
};

const WorkloadStatusSkeleton: React.FC = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/2 mb-6"></div>
        <div className="space-y-7">
            {[1, 2, 3].map(i => (
                <div key={i}>
                    <div className="flex items-center mb-2">
                        <div className="w-8 h-8 bg-slate-200 rounded-full mr-3"></div>
                        <div className="flex-grow space-y-2">
                            <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5"></div>
                </div>
            ))}
        </div>
    </div>
);

const WorkloadStatus: React.FC<WorkloadStatusProps> = ({ onNavigate }) => {
    const { tasks, matters, events, loading, error } = useAirtableData();
    const { currentUser } = useAuth();

    const workloadStats = useMemo(() => {
        if (!currentUser || loading) {
            return { activeMatters: null, weeklyTasks: null, weeklySchedule: null };
        }
        
        // 1. Active Matters Calculation
        const userActiveMatters = matters.filter(m =>
            m.fields['Case Status'] === 'In-progress' &&
            m.fields['Brief Assistant']?.includes(currentUser.id)
        );
        const activeMatterIds = new Set(userActiveMatters.map(m => m.id));
        const tasksForActiveMatters = tasks.filter(t => t.fields.Matter?.some(mId => activeMatterIds.has(mId)));
        const completedTasksForActiveMatters = tasksForActiveMatters.filter(t => t.fields.Status === 'Done').length;
        const activeMattersProgress = tasksForActiveMatters.length > 0
            ? Math.round((completedTasksForActiveMatters / tasksForActiveMatters.length) * 100)
            : 0;

        // 2. Weekly Tasks Calculation
        const [startOfWeek, endOfWeek] = getStartAndEndOfWeek(new Date());
        const tasksThisWeek = tasks.filter(t => {
            if (!t.fields['Due Date']) return false;
            const dueDate = new Date(t.fields['Due Date']);
            return dueDate >= startOfWeek && dueDate <= endOfWeek;
        });
        const completedTasksThisWeek = tasksThisWeek.filter(t => t.fields.Status === 'Done').length;
        const weeklyTasksProgress = tasksThisWeek.length > 0
            ? Math.round((completedTasksThisWeek / tasksThisWeek.length) * 100)
            : 100; // If no tasks, 100% complete

        // 3. Weekly Schedule Calculation
        const eventsThisWeek = events.filter(e => {
            if (!e.fields['Start Time']) return false;
            const eventDate = new Date(e.fields['Start Time']);
            return eventDate >= startOfWeek && eventDate <= endOfWeek;
        });

        const totalHoursScheduled = eventsThisWeek.reduce((total, event) => {
            if (event.fields['All Day']) return total + 8; // Count all-day as 8 hours
            if (!event.fields['Start Time'] || !event.fields['End Time']) return total;
            const start = new Date(event.fields['Start Time']);
            const end = new Date(event.fields['End Time']);
            const durationMs = end.getTime() - start.getTime();
            return total + (durationMs / (1000 * 60 * 60));
        }, 0);
        const weeklyScheduleProgress = Math.min(Math.round((totalHoursScheduled / 40) * 100), 100); // Capped at 100% of a 40hr week

        return {
            activeMatters: {
                count: userActiveMatters.length,
                progress: `${activeMattersProgress}%`,
                text: `${userActiveMatters.length} active matter${userActiveMatters.length !== 1 ? 's' : ''}`
            },
            weeklyTasks: {
                count: tasksThisWeek.length,
                progress: `${weeklyTasksProgress}%`,
                text: `${completedTasksThisWeek} of ${tasksThisWeek.length} tasks due this week`
            },
            weeklySchedule: {
                count: Math.round(totalHoursScheduled),
                progress: `${weeklyScheduleProgress}%`,
                text: `${Math.round(totalHoursScheduled)} hours scheduled this week`
            }
        };

    }, [tasks, matters, events, currentUser, loading]);

    if (loading && tasks.length === 0) {
        return <WorkloadStatusSkeleton />;
    }

    if (error) {
       return (
          <div className="bg-white p-6 rounded-xl shadow-lg text-red-700 bg-red-50">
            <h3 className="font-bold text-xl text-slate-800 mb-2 flex items-center gap-2"><AlertTriangle /> Workload Status</h3>
            <p>Could not load workload data: {error.message}</p>
          </div>
       );
    }


    const statuses = [
        { title: 'ACTIVE MATTERS', icon: FolderKanban, data: workloadStats.activeMatters, page: 'Matters' },
        { title: 'WEEKLY PROGRESS', icon: ListChecks, data: workloadStats.weeklyTasks, page: 'Tasks' },
        { title: 'SCHEDULED TIME', icon: Calendar, data: workloadStats.weeklySchedule, page: 'Calendar' },
    ];


  return (
    <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 ease-in-out">
      <h3 className="font-bold text-xl text-slate-800 mb-6">Workload Status</h3>
      <div className="space-y-7">
        {statuses.map((status, index) => (
          <button 
            key={index}
            onClick={() => onNavigate(status.page)}
            className="w-full text-left focus:outline-none focus:ring-2 focus:ring-custom-indigo-300 rounded-lg p-2 -m-2 hover:bg-slate-50 transition-colors"
            aria-label={`View ${status.title}`}
          >
            <div className="flex items-center text-slate-600 mb-2">
              <status.icon className="w-5 h-5 mr-3 text-custom-indigo-500" />
              <div className="flex-grow">
                <p className="font-semibold text-sm text-slate-700">{status.title}</p>
                <p className="text-xs text-slate-500">{status.data?.text || 'Calculating...'}</p>
              </div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-sky-500 to-custom-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                style={{ width: status.data?.progress || '0%' }}
                role="progressbar"
                aria-valuenow={parseInt(status.data?.progress || '0')}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${status.title} progress`}
              ></div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default WorkloadStatus;
