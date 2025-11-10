import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { RevenueChartData } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
    chartData: RevenueChartData | null;
    loading: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ chartData, loading }) => {
    if (loading) {
        return (
            <div className="h-[300px] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center animate-pulse">
                <div className="w-full p-6 space-y-4">
                    <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                    <div className="flex items-end h-48 space-x-4">
                        <div className="h-24 w-1/12 bg-slate-200 rounded"></div>
                        <div className="h-32 w-1/12 bg-slate-200 rounded"></div>
                        <div className="h-40 w-1/12 bg-slate-200 rounded"></div>
                        <div className="h-28 w-1/12 bg-slate-200 rounded"></div>
                        <div className="h-36 w-1/12 bg-slate-200 rounded"></div>
                        <div className="h-44 w-1/12 bg-slate-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }
    
    if (!chartData || chartData.datasets.length === 0) {
        return (
            <div className="h-[300px] bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center flex-col gap-2 text-slate-400 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                <p>No revenue data for the selected period.</p>
            </div>
        );
    }

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                align: 'end' as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                }
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'KES' }).format(context.parsed.y);
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
            },
            y: {
                grid: {
                    color: '#f1f5f9', // slate-100
                },
                ticks: {
                     callback: function(value: any) {
                        if (value >= 1000) {
                            return `KES ${value / 1000}k`;
                        }
                        return `KES ${value}`;
                    }
                }
            },
        },
        interaction: {
            mode: 'nearest' as const,
            axis: 'x' as const,
            intersect: false,
        },
    };

    return (
        <div className="h-[350px]">
            <Line options={options} data={chartData} />
        </div>
    );
};

export default RevenueChart;
