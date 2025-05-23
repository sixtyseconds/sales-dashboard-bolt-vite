import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const chartData = {
  labels: ['Subscription Revenue', 'One-Off Revenue'],
  datasets: [{
    data: [185000, 30780],
    backgroundColor: [
      'rgba(59, 130, 246, 0.7)', // blue-500
      'rgba(234, 179, 8, 0.7)',  // yellow-500
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

const RevenueTypeBreakdownChart: React.FC = () => {
  return (
    <div className="bg-[#1E2022] border border-[#2C3035] rounded-xl p-6 shadow-lg">
      <h3 className="text-white text-lg font-semibold mb-1">One-Off vs. Subscription</h3>
      <p className="text-sm text-[#A2ABB3] mb-4">Proportion of revenue types.</p>
      <div className="max-h-64 h-64"> {/* Ensure canvas container has a defined height */}
        <Pie data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default RevenueTypeBreakdownChart; 