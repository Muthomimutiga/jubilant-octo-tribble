import React from 'react';
import { Users, FileText, HeartHandshake, HousePlus } from 'lucide-react';

interface PracticeAreaSelectionProps {
    onSelectPracticeArea: (area: string) => void;
}

const practiceAreas = [
    { name: 'Matrimonial Matters', icon: HeartHandshake, description: 'Divorce, separation, property suits.' },
    { name: 'Children Cases', icon: Users, description: 'Custody, maintenance, co-parenting.' },
    { name: 'Adoption', icon: HousePlus, description: 'Legal adoption proceedings.' },
    { name: 'General Matter', icon: FileText, description: 'For all other types of legal instructions.' },
];

const PracticeAreaSelection: React.FC<PracticeAreaSelectionProps> = ({ onSelectPracticeArea }) => {
    return (
        <div className="practice-area-grid">
            {practiceAreas.map((area) => (
                <button
                    key={area.name}
                    onClick={() => onSelectPracticeArea(area.name)}
                    className="practice-area-card"
                >
                    <div className="practice-area-icon-wrapper">
                        <area.icon className="w-8 h-8" />
                    </div>
                    <h3 className="practice-area-name">{area.name}</h3>
                    <p className="practice-area-description">{area.description}</p>
                </button>
            ))}
        </div>
    );
};

export default PracticeAreaSelection;