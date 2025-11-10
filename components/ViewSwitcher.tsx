
import React from 'react';
import { LayoutGrid, List, Clock } from 'lucide-react';

type View = 'accordion' | 'list' | 'timeline';

interface ViewSwitcherProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const views: { id: View; icon: React.ElementType; label: string }[] = [
  { id: 'accordion', icon: LayoutGrid, label: 'Grouped View' },
  { id: 'list', icon: List, label: 'List View' },
  { id: 'timeline', icon: Clock, label: 'Timeline View' },
];

const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="view-switcher">
      {views.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => onViewChange(id)}
          className={`view-switcher-btn ${activeView === id ? 'is-active' : ''}`}
          aria-label={label}
          aria-pressed={activeView === id}
        >
          <Icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};

export default ViewSwitcher;
