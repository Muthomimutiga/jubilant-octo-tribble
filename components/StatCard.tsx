import React from 'react';
import { StatCardProps } from '../types';

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, title, value }) => {
    return (
        <div className="bg-white p-4 rounded-xl shadow-md flex items-center justify-between hover:shadow-lg transition-shadow duration-300 ease-in-out">
            <div className="flex items-center">
                <div className="bg-custom-indigo-100 text-custom-indigo-600 p-3.5 rounded-lg mr-4">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h4 className="font-semibold text-xs uppercase text-slate-500 tracking-wider">{title}</h4>
                    <p className="text-2xl font-bold text-slate-800">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default StatCard;