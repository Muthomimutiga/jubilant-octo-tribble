

import React, { useMemo } from 'react';
import { AirtableRecord, Client, Matter } from '../types';
import { User, Building, FolderKanban } from 'lucide-react';
import './../pages/ClientsPage.css';

interface ClientCardProps {
  client: AirtableRecord<Client>;
  matters: AirtableRecord<Matter>[];
  onClick: () => void;
  onMatterClick: (matterId: string) => void;
  style?: React.CSSProperties;
}

const getStatusBadgeClasses = (status?: string) => {
    const base = 'px-2.5 py-0.5 text-xs font-semibold rounded-full inline-block capitalize tracking-wide';
    switch (status?.toLowerCase()) {
      case 'active': return `${base} bg-green-100 text-green-800`;
      case 'inactive': return `${base} bg-slate-100 text-slate-600`;
      case 'prospect': return `${base} bg-yellow-100 text-yellow-800`;
      default: return `${base} bg-slate-100 text-slate-800`;
    }
};

const ClientCard: React.FC<ClientCardProps> = ({ client, matters, onClick, onMatterClick, style }) => {
    const { fields } = client;
    const isBusiness = fields['Client type'] === 'Business';

    const linkedMatters = useMemo(() => {
        if (!fields.Matters || !matters) return [];
        const matterIds = new Set(fields.Matters);
        return matters.filter(m => matterIds.has(m.id));
    }, [fields.Matters, matters]);

    const handleMatterClick = (e: React.MouseEvent, matterId: string) => {
        e.stopPropagation(); // Prevent card's onClick from firing
        onMatterClick(matterId);
    };

    return (
        <div
            className="client-card"
            style={style}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
            aria-label={`View details for ${fields['Client Name']}`}
        >
            <div className="client-card-header">
                <div className={`client-card-avatar ${isBusiness ? 'avatar-business' : 'avatar-individual'}`}>
                    {isBusiness ? <Building className="w-8 h-8" /> : <User className="w-8 h-8" />}
                </div>
                <div>
                    <h3 className="client-card-title">{fields['Client Name'] || 'Unnamed Client'}</h3>
                    <p className="client-card-subtitle">{fields['Client type'] || 'N/A'}</p>
                </div>
            </div>

            <div className="client-card-body">
                <h4 className="client-card-body-title">
                    <FolderKanban className="w-4 h-4" />
                    Associated Matters
                </h4>
                {linkedMatters.length > 0 ? (
                    <ul className="client-card-matter-list">
                        {linkedMatters.slice(0, 3).map(matter => (
                            <li key={matter.id}>
                                <button onClick={(e) => handleMatterClick(e, matter.id)} className="client-card-matter-item">
                                    {matter.fields['Matter Name']}
                                </button>
                            </li>
                        ))}
                        {linkedMatters.length > 3 && (
                            <li>
                                <button onClick={onClick} className="client-card-matter-more">
                                    + {linkedMatters.length - 3} more
                                </button>
                            </li>
                        )}
                    </ul>
                ) : (
                    <p className="client-card-no-matters">No matters linked to this client.</p>
                )}
            </div>

            <div className="client-card-footer">
                <span className={getStatusBadgeClasses(fields['Client status'])}>
                    {fields['Client status'] || 'Unknown'}
                </span>
            </div>
        </div>
    );
};

export default ClientCard;