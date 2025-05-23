import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const chartData = {
  labels: ['Starter', 'Growth', 'Scale', 'Build'],
  datasets: [{
    data: [45000, 75000, 50000, 15000],
    backgroundColor: [
      'rgba(16, 185, 129, 0.7)', // emerald-500
      'rgba(59, 130, 246, 0.7)', // blue-500
      'rgba(245, 158, 11, 0.7)', // amber-500
      'rgba(147, 51, 234, 0.7)', // purple-500
    ],
    borderColor: '#1E2022',
    borderWidth: 2,
    hoverOffset: 8,
  }],
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 15,
        color: '#A2ABB3',
      },
    },
    tooltip: {
      callbacks: {
        label: function (context: any) {
          let label = context.label || '';
          if (label) {
            label += ': ';
          }
          if (context.parsed !== null) {
            label += '$' + context.parsed.toLocaleString();
          }
          return label;
        },
      },
    },
  },
};

const SubscriptionTierBreakdownChart: React.FC = () => {
  return (
    <div className="bg-[#1E2022] border border-[#2C3035] rounded-xl p-6 shadow-lg">
      <h3 className="text-white text-lg font-semibold mb-1">Subscription Breakdown</h3>
      <p className="text-sm text-[#A2ABB3] mb-4">Distribution across subscription tiers.</p>
      <div className="max-h-64 h-64"> {/* Ensure canvas container has a defined height */}
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default SubscriptionTierBreakdownChart; 