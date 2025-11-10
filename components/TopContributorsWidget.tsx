import React, { useMemo } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import { AirtableRecord, User } from '../types';
import InfoCard from './InfoCard';
import { Trophy, Medal, UserPlus } from 'lucide-react';
import './TopContributorsWidget.css';

const ContributorSkeleton: React.FC = () => (
    <div className="contributor-item animate-pulse">
        <div className="contributor-rank bg-slate-200 rounded w-6 h-6"></div>
        <div className="contributor-avatar bg-slate-200 rounded-full w-10 h-10"></div>
        <div className="contributor-details flex-grow">
            <div className="h-4 bg-slate-200 rounded w-3/4 mb-1"></div>
        </div>
        <div className="contributor-count bg-slate-200 rounded-full w-8 h-6"></div>
    </div>
);

/**
 * Formats a user's name for display. If the name is missing or generic,
 * it derives a name from the user's email address.
 */
const formatContributorName = (user: AirtableRecord<User>): string => {
    const name = user.fields.Name;
    const email = user.fields.Email;

    // Return name if it's meaningful
    if (name && name.trim() && name.toLowerCase() !== 'user') {
        return name;
    }
    // Otherwise, derive from email
    if (email) {
        const emailName = email.split('@')[0];
        // Capitalize parts of the email name (e.g., john.doe -> John Doe)
        return emailName
            .replace(/[._-]/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    }
    return 'Unnamed Contributor';
};


const TopContributorsWidget: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const { allUsers, matters, loading } = useAirtableData();

    const leaderboard = useMemo(() => {
        if (!allUsers.length) {
            return [];
        }

        const matterCounts = new Map<string, number>();

        // Count matters for each user based on 'Brief Assistant' field
        matters.forEach(matter => {
            const assistants = matter.fields['Brief Assistant'];
            if (assistants) {
                assistants.forEach(userId => {
                    matterCounts.set(userId, (matterCounts.get(userId) || 0) + 1);
                });
            }
        });

        // Filter out the specified user, then map all other users to their counts and sort.
        // This will include users with 0 matters.
        return allUsers
            .filter(user => formatContributorName(user) !== 'Leah Kiguatha')
            .map(user => ({
                ...user,
                matterCount: matterCounts.get(user.id) || 0,
            }))
            .sort((a, b) => b.matterCount - a.matterCount);
    }, [allUsers, matters]);
    
    const getMedal = (rank: number) => {
        if (rank === 0) return <Medal className="w-5 h-5 text-yellow-500" />;
        if (rank === 1) return <Medal className="w-5 h-5 text-slate-400" />;
        if (rank === 2) return <Medal className="w-5 h-5 text-amber-700" />;
        return <span className="contributor-rank-number">{rank + 1}</span>;
    };

    const renderContent = () => {
        if (loading && matters.length === 0) {
            return (
                <div className="space-y-3">
                    <ContributorSkeleton />
                    <ContributorSkeleton />
                    <ContributorSkeleton />
                </div>
            );
        }

        if (leaderboard.length === 0) {
            return (
                <div className="text-center py-6">
                    <Trophy className="mx-auto h-10 w-10 text-slate-300" />
                    <h4 className="mt-2 text-md font-semibold text-slate-700">No users found</h4>
                    <p className="mt-1 text-sm text-slate-500">Add users to the system to start tracking contributions.</p>
                </div>
            );
        }

        return (
            <div className="contributor-list-scrollable">
                {leaderboard.map((user, index) => {
                    const formattedName = formatContributorName(user);
                    const avatarUrl = user.fields.Avatar?.[0]?.url;
                    const initials = formattedName.match(/\b\w/g)?.join('').substring(0, 2).toUpperCase() || '?';

                    return (
                        <div key={user.id} className="contributor-item">
                            <div className="contributor-rank">
                                {getMedal(index)}
                            </div>
                             <div className="contributor-avatar">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt={formattedName} />
                                ) : (
                                    <span>{initials}</span>
                                )}
                            </div>
                            <div className="contributor-details">
                                <p className="contributor-name" title={formattedName}>{formattedName}</p>
                            </div>
                            <div className="contributor-count">
                                {user.matterCount}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <InfoCard title="Top Contributors" icon={Trophy} className="!mb-0">
            <p className="widget-description">
                This leaderboard ranks users by the number of matters they are assigned to. Keep onboarding clients to climb the ranks!
            </p>
            {renderContent()}
             <div className="mt-6">
                <button 
                    onClick={() => onNavigate('Matters')}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 text-custom-indigo-700 px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors border border-slate-300 hover:border-custom-indigo-500 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500 focus:ring-opacity-50"
                >
                    <UserPlus className="w-4 h-4" />
                    Onboard a Client
                </button>
            </div>
        </InfoCard>
    );
};

export default TopContributorsWidget;