

import React from 'react';
import { InfoCardProps } from '../types';
import { Calendar, ChevronDown, X } from 'lucide-react';

const InfoCard: React.FC<InfoCardProps & { className?: string }> = ({ title, badge, children, icon: Icon, isCollapsible = false, isCollapsed = false, onToggleCollapse, isClosable = false, className = '' }) => {
    return (
        <div className={`bg-white p-6 rounded-xl shadow-lg mb-6 hover:shadow-xl transition-shadow duration-300 ease-in-out ${className}`}>
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-5">
                <div className="flex items-center gap-3">
                    {Icon && <Icon className="w-6 h-6 text-custom-indigo-600 flex-shrink-0" />}
                    <h3 className="font-bold text-slate-800 text-xl">{title}</h3>
                    {badge && (
                        <span className="bg-custom-amber-100 text-custom-amber-700 text-xs font-semibold px-3 py-1 rounded-full flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-custom-amber-500" />
                            {badge}
                        </span>
                    )}
                </div>
                <div className="flex items-center space-x-2 text-slate-500">
                   {isCollapsible && (
                       <button 
                            onClick={onToggleCollapse}
                            className="p-1 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500"
                            aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
                            aria-expanded={!isCollapsed}
                       >
                           <ChevronDown className={`w-5 h-5 cursor-pointer hover:text-custom-indigo-600 transition-transform duration-300 ${!isCollapsed ? 'rotate-180' : ''}`} />
                       </button>
                   )}
                   {isClosable && (
                       <button className="p-1 rounded-full hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-custom-indigo-500" aria-label="Close section">
                           <X className="w-5 h-5 cursor-pointer hover:text-red-500 transition-colors" />
                       </button>
                   )}
                </div>
            </div>
            {(!isCollapsible || !isCollapsed) && (
                 <div className="text-slate-700">{children}</div>
            )}
        </div>
    );
}

export default InfoCard;
