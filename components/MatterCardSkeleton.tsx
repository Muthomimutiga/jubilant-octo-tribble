
import React from 'react';

const MatterCardSkeleton: React.FC = () => {
  return (
    <div className="matter-card" aria-hidden="true">
      <div className="matter-card-status-bar bg-slate-200"></div>
      <div className="matter-card-content animate-pulse">
        <div className="matter-card-header">
          <div className="h-6 bg-slate-200 rounded w-3/4"></div>
          <div className="h-5 bg-slate-200 rounded-full w-16"></div>
        </div>
        
        <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
        
        <div className="matter-card-details mt-auto">
            <div className="matter-card-detail-item">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
            </div>
            <div className="matter-card-detail-item">
                <div className="h-4 bg-slate-200 rounded w-1/5"></div>
                <div className="h-4 bg-slate-200 rounded w-2/5"></div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MatterCardSkeleton;