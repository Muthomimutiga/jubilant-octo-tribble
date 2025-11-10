
import React from 'react';
import { X } from 'lucide-react';
import { ALL_WIDGETS } from './Dashboard';
import './../pages/DashboardPage.css'; // Re-use styles

interface ToggleSwitchProps {
    id: string;
    checked: boolean;
    onChange: () => void;
    label: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange, label }) => (
    <div className="toggle-switch-container">
        <label htmlFor={id} className="toggle-switch-label">{label}</label>
        <label className="toggle-switch">
            <input 
                type="checkbox" 
                id={id}
                checked={checked}
                onChange={onChange}
                className="toggle-switch-input"
            />
            <span className="toggle-switch-slider"></span>
        </label>
    </div>
);


interface CustomizeDashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    hiddenWidgets: string[];
    setHiddenWidgets: React.Dispatch<React.SetStateAction<string[]>>;
}

const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({ isOpen, onClose, hiddenWidgets, setHiddenWidgets }) => {
    if (!isOpen) return null;

    const handleToggle = (widgetId: string) => {
        setHiddenWidgets(prev => {
            const isHidden = prev.includes(widgetId);
            if (isHidden) {
                return prev.filter(id => id !== widgetId);
            } else {
                return [...prev, widgetId];
            }
        });
    };

    return (
        <div className="customize-modal-overlay" onClick={onClose}>
            <div className="customize-modal-content" onClick={e => e.stopPropagation()}>
                <div className="customize-modal-header">
                    <h2 className="customize-modal-title">Customize Dashboard</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
                        <X className="w-6 h-6 text-slate-500" />
                    </button>
                </div>
                <div className="widget-toggle-list">
                    {ALL_WIDGETS.map(widget => (
                        <div key={widget.id} className="widget-toggle-item">
                            <span className="widget-toggle-label">{widget.title}</span>
                             <label className="toggle-switch">
                                <input 
                                    type="checkbox" 
                                    id={`toggle-${widget.id}`}
                                    checked={!hiddenWidgets.includes(widget.id)}
                                    onChange={() => handleToggle(widget.id)}
                                    className="toggle-switch-input"
                                />
                                <span className="toggle-switch-slider"></span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomizeDashboardModal;
