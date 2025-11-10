

import React from 'react';
import { AirtableRecord, Matter } from '../types';

interface MatterCardProps {
  matter: AirtableRecord<Matter>;
  onClick: () => void;
  style?: React.CSSProperties;
}

const getStatusBadgeClasses = (status?: string) => {
    const baseClasses = 'px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block capitalize tracking-wide whitespace-nowrap';
    switch (status?.toLowerCase().replace(' ', '-')) {
      case 'in-progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'closed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-slate-100 text-slate-800`;
    }
};

/**
 * Converts a Case Type string into a CSS-friendly class name.
 * e.g., "Matrimonial Property Suits" -> "case-type-matrimonial-property-suits"
 * @param caseType The case type string from Airtable.
 * @returns A clean CSS class name.
 */
export const getCaseTypeClass = (caseType?: string): string => {
    if (!caseType) {
        return 'case-type-undefined';
    }
    // Converts to lowercase, replaces spaces and non-alphanumeric chars with a hyphen
    return `case-type-${caseType.toLowerCase().replace(/[\s_&/]+/g, '-').replace(/[^\w-]+/g, '')}`;
};


const MatterCard: React.FC<MatterCardProps> = ({ matter, onClick, style }) => {
  const { fields } = matter;
  const clientNameRaw = fields['Client Name (from Client)'];
  const displayClientName = (Array.isArray(clientNameRaw) ? clientNameRaw.join(', ') : clientNameRaw) || 'Client Not Assigned';
  const status = fields['Case Status'] || 'Unknown';
  const caseType = fields['Case Type'] || 'N/A';
  const matterName = fields['Matter Name'] || 'Untitled Case';
  const fileNumber = fields['File Number'];

  const caseTypeClass = getCaseTypeClass(fields['Case Type']);

  return (
    <div 
      className={`matter-card ${caseTypeClass}`}
      style={style}
      onClick={onClick} 
      role="button" 
      tabIndex={0} 
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      aria-label={`View details for ${displayClientName}`}
    >
      <div className="matter-card-content">
        <div className="matter-card-header">
          <h3 className="matter-card-client-name" title={displayClientName}>{displayClientName}</h3>
          <span className={getStatusBadgeClasses(status)}>
              {status}
          </span>
        </div>
        
        <p className="matter-card-case-name" title={matterName}>{matterName}</p>
        
        <div className="matter-card-details">
            <div className="matter-card-detail-item">
                <span className="matter-card-detail-label">Case Type</span>
                <span className="matter-card-detail-data">{caseType}</span>
            </div>
            <div className="matter-card-detail-item">
                <span className="matter-card-detail-label">File No.</span>
                <span className="matter-card-detail-data font-mono">{fileNumber}</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MatterCard;