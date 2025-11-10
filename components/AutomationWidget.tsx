
import React from 'react';
import InfoCard from './InfoCard';
import { Wand2 } from 'lucide-react';

interface AutomationWidgetProps {
    onNavigate: (page: string) => void;
}

const AutomationWidget: React.FC<AutomationWidgetProps> = ({ onNavigate }) => {
    return (
        <InfoCard title="Document Automation" icon={Wand2} className="!mb-0">
            <p className="text-slate-600 mb-6">Streamline your document creation with our automated tools. Go to the portal to get started.</p>
            <div className="flex">
                <button onClick={() => onNavigate('Automation')} className="bg-gradient-to-r from-custom-indigo-500 to-custom-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:from-custom-indigo-600 hover:to-custom-indigo-800 transition-all duration-300 ease-in-out shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-75">
                    Launch Automation Portal
                </button>
            </div>
        </InfoCard>
    );
};

export default AutomationWidget;
