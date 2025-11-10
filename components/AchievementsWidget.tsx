import React, { useMemo } from 'react';
import { useAirtableData } from '../contexts/AirtableDataContext';
import InfoCard from './InfoCard';
import { Trophy, FolderPlus, Folders, Award, Gavel } from 'lucide-react';
import './AchievementsWidget.css';
import { IconComponent } from '../types';

interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: IconComponent;
    goal: number;
    check: (userMatters: ReturnType<typeof useAirtableData>['matters']) => number;
}

const achievementsList: Achievement[] = [
    {
        id: 'case-opener',
        title: 'Case Opener',
        description: 'Create your first matter.',
        icon: FolderPlus,
        goal: 1,
        check: (userMatters) => userMatters.length,
    },
    {
        id: 'litigation-starter',
        title: 'Litigation Starter',
        description: 'Create 5 matters.',
        icon: Folders,
        goal: 5,
        check: (userMatters) => userMatters.length,
    },
    {
        id: 'senior-contributor',
        title: 'Senior Contributor',
        description: 'Create 50 matters.',
        icon: Award,
        goal: 50,
        check: (userMatters) => userMatters.length,
    },
    {
        id: 'practice-area-pro',
        title: 'Practice Area Pro',
        description: 'Create 10 matters in a single category.',
        icon: Gavel,
        goal: 10,
        check: (userMatters) => {
            if (userMatters.length === 0) return 0;
            const counts: Record<string, number> = {};
            userMatters.forEach(matter => {
                const caseType = matter.fields['Case Type'] || 'Uncategorized';
                counts[caseType] = (counts[caseType] || 0) + 1;
            });
            return Math.max(0, ...Object.values(counts));
        },
    },
];

const AchievementBadge: React.FC<{ achievement: Achievement; progress: number }> = ({ achievement, progress }) => {
    const isUnlocked = progress >= achievement.goal;
    const { icon: Icon } = achievement;
    const progressPercentage = Math.min((progress / achievement.goal) * 100, 100);

    const radius = 28;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progressPercentage / 100) * circumference;

    const title = isUnlocked
        ? `${achievement.title} - Unlocked! (${achievement.description})`
        : `${achievement.title} (${Math.floor(progress)}/${achievement.goal}) - ${achievement.description}`;

    return (
        <div className={`achievement-badge ${isUnlocked ? 'unlocked' : 'locked'}`} title={title}>
            <div className="achievement-badge-progress-wrapper">
                <svg className="achievement-progress-svg" width="64" height="64" viewBox="0 0 64 64">
                    <circle
                        className="progress-track"
                        cx="32" cy="32" r={radius}
                        strokeWidth="6"
                    />
                    <circle
                        className="progress-fill"
                        cx="32" cy="32" r={radius}
                        strokeWidth="6"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="badge-icon-wrapper">
                    <Icon className="badge-icon" />
                </div>
            </div>
            <p className="achievement-title">{achievement.title}</p>
        </div>
    );
};

const AchievementsWidgetSkeleton: React.FC = () => (
    <div className="achievements-grid animate-pulse">
        {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="achievement-badge">
                <div className="achievement-badge-progress-wrapper">
                     <div className="badge-icon-wrapper bg-slate-200 rounded-full"></div>
                </div>
                <div className="h-3 bg-slate-200 rounded w-12 mt-2"></div>
            </div>
        ))}
    </div>
);

const AchievementsWidget: React.FC = () => {
    const { matters, loading } = useAirtableData();

    return (
        <InfoCard title="My Achievements" icon={Trophy} className="!mb-0">
             <p className="widget-description">
                Unlock badges by completing milestones. Your progress is tracked automatically as you work.
            </p>
            {loading && matters.length === 0 ? <AchievementsWidgetSkeleton /> : (
                <div className="achievements-grid">
                    {achievementsList.map(ach => {
                        const progress = ach.check(matters);
                        return <AchievementBadge key={ach.id} achievement={ach} progress={progress} />;
                    })}
                </div>
            )}
        </InfoCard>
    );
};

export default AchievementsWidget;