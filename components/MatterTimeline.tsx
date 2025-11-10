
import React from 'react';
import { AirtableRecord, Matter, Task } from '../types';
import { WORKFLOW_TEMPLATES, WorkflowStep } from '../services/workflowTemplates';
import { Check, CircleDot, Circle, Clock } from 'lucide-react';
import './MatterTimeline.css';

interface MatterTimelineProps {
  matter: AirtableRecord<Matter>;
  tasks: AirtableRecord<Task>[];
  onSetCurrentStage: (step: WorkflowStep) => void;
}

const getStatus = (stepName: string, tasks: AirtableRecord<Task>[]): Task['Status'] | 'Pending' => {
  const task = tasks.find(t => t.fields['Task Name'] === stepName);
  if (!task) {
    return 'Pending';
  }
  return task.fields.Status || 'To-Do'; // Default to To-Do if status is somehow missing
};

const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'Done':
      return <Check className="w-4 h-4 text-white" />;
    case 'In-Progress':
      return <CircleDot className="w-4 h-4 text-white" />;
    case 'To-Do':
      return <Circle className="w-4 h-4 text-white" />;
    case 'Pending':
    default:
      return <Clock className="w-4 h-4 text-white" />;
  }
};

const MatterTimeline: React.FC<MatterTimelineProps> = ({ matter, tasks, onSetCurrentStage }) => {
  const caseType = matter.fields['Case Type'];
  const workflow = caseType ? WORKFLOW_TEMPLATES[caseType] : undefined;

  if (!workflow) {
    return <div className="text-slate-500 italic text-center p-4">No timeline template available for this matter type.</div>;
  }
  
  let firstNonDoneStepFound = false;

  return (
    <div className="matter-timeline">
      <div className="timeline-line"></div>
      {workflow.map((step) => {
        const status = getStatus(step.stepName, tasks);
        const taskForStep = tasks.find(t => t.fields['Task Name'] === step.stepName);
        const statusClass = `status-${status.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        
        let isCurrentStage = false;
        if (status !== 'Done' && !firstNonDoneStepFound) {
            isCurrentStage = true;
            firstNonDoneStepFound = true;
        }

        return (
          <button
            key={step.order}
            className={`timeline-item-wrapper ${statusClass} ${isCurrentStage ? 'is-active' : ''}`}
            onClick={() => onSetCurrentStage(step)}
            disabled={status === 'Done'}
            aria-label={`Set stage to: ${step.stepName}`}
          >
            <div className="timeline-item-icon">
              <StatusIcon status={status} />
            </div>
            <div className="timeline-item-content">
              <p className="timeline-item-name">{step.stepName}</p>
              <div className="timeline-item-meta">
                {step.defaultDuration && (
                  <span className="timeline-item-duration">
                    <Clock className="w-3 h-3" />
                    {step.defaultDuration} days
                  </span>
                )}
                {taskForStep?.fields['Due Date'] && (
                   <span className="timeline-item-due-date">
                     Due: {new Date(taskForStep.fields['Due Date']).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                   </span>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default MatterTimeline;
