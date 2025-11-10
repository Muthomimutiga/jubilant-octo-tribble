import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const FormHeader: React.FC<{title:string; description:string}> = ({title, description}) => (
    <div className="pb-5 border-b border-slate-200">
        <h3 className="text-lg font-semibold leading-6 text-slate-900">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
);

interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: () => void;
    label: string;
    description: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label, description }) => (
    <div className="toggle-switch-container">
        <div className="toggle-switch-label-group">
            <label htmlFor={id} className="toggle-switch-label">{label}</label>
            <p id={`${id}-description`} className="toggle-switch-description">{description}</p>
        </div>
        <label className="toggle-switch">
            <input 
                type="checkbox" 
                id={id}
                checked={checked}
                onChange={onChange}
                className="toggle-switch-input"
                aria-describedby={`${id}-description`}
            />
            <span className="toggle-switch-slider"></span>
        </label>
    </div>
);


const SettingsNotifications: React.FC = () => {
    // In a real app, this state would be fetched from the user's settings
    const [emailSettings, setEmailSettings] = useState({
        taskAssigned: true,
        taskDue: true,
        documentShared: false,
        dailySummary: true,
    });
    const [inAppSettings, setInAppSettings] = useState({
        taskAssigned: true,
        taskDue: true,
        mention: true,
    });
    
    // Placeholder for mutation state
    const [isSaving, setIsSaving] = useState(false);

    const handleEmailChange = (key: keyof typeof emailSettings) => {
        setEmailSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };
    
    const handleInAppChange = (key: keyof typeof inAppSettings) => {
        setInAppSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSaveChanges = () => {
        setIsSaving(true);
        // Simulate an API call
        setTimeout(() => {
            setIsSaving(false);
            // Here you would show a success message
        }, 1500);
    };

    return (
        <div className="space-y-8">
            <div className="settings-card">
                <div className="p-6">
                    <FormHeader title="Email Notifications" description="Choose which emails you want to receive." />
                </div>
                <div className="px-6 pb-6 space-y-2 divide-y divide-slate-100">
                    <ToggleSwitch 
                        id="email-task-assigned"
                        checked={emailSettings.taskAssigned}
                        onChange={() => handleEmailChange('taskAssigned')}
                        label="Task Assignments"
                        description="When a new task is assigned to you."
                    />
                    <ToggleSwitch 
                        id="email-task-due"
                        checked={emailSettings.taskDue}
                        onChange={() => handleEmailChange('taskDue')}
                        label="Task Reminders"
                        description="When one of your tasks is due within 24 hours."
                    />
                     <ToggleSwitch 
                        id="email-doc-shared"
                        checked={emailSettings.documentShared}
                        onChange={() => handleEmailChange('documentShared')}
                        label="Document Shares"
                        description="When a document is shared with you."
                    />
                    <ToggleSwitch 
                        id="email-summary"
                        checked={emailSettings.dailySummary}
                        onChange={() => handleEmailChange('dailySummary')}
                        label="Daily Summary"
                        description="A daily digest of your open tasks and upcoming events."
                    />
                </div>
            </div>

            <div className="settings-card">
                <div className="p-6">
                    <FormHeader title="In-App Notifications" description="Choose which notifications you see in the app." />
                </div>
                 <div className="px-6 pb-6 space-y-2 divide-y divide-slate-100">
                     <ToggleSwitch 
                        id="inapp-task-assigned"
                        checked={inAppSettings.taskAssigned}
                        onChange={() => handleInAppChange('taskAssigned')}
                        label="Task Assignments"
                        description="When a new task is assigned to you."
                    />
                    <ToggleSwitch 
                        id="inapp-task-due"
                        checked={inAppSettings.taskDue}
                        onChange={() => handleInAppChange('taskDue')}
                        label="Task Reminders"
                        description="For tasks due today."
                    />
                    <ToggleSwitch 
                        id="inapp-mention"
                        checked={inAppSettings.mention}
                        onChange={() => handleInAppChange('mention')}
                        label="Mentions"
                        description="When someone @mentions you in a note or comment."
                    />
                </div>
            </div>
             <div className="flex justify-end p-4 bg-slate-50 rounded-b-xl">
                <button type="button" onClick={handleSaveChanges} className="btn-primary" disabled={isSaving}>
                   {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

export default SettingsNotifications;
