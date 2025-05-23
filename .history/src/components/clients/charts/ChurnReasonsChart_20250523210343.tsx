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
  labels: ['Budget Cuts', 'Product Fit', 'Switched Competitor', 'Poor Service', 'Other'],
  datasets: [{
    label: 'Churn Reasons',
    data: [35, 25, 20, 15, 5],
    backgroundColor: [
      'rgba(239, 68, 68, 0.7)',   // red-500
      'rgba(245, 158, 11, 0.7)', // amber-500
      'rgba(59, 130, 246, 0.7)',  // blue-500
      'rgba(16, 185, 129, 0.7)',  // emerald-500
      'rgba(107, 114, 128, 0.7)' // gray-500
    ],
    borderColor: '#1E2022',
    borderWidth: 2,
    hoverOffset: 8
  }]
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
      }
    }
  }
};

const ChurnReasonsChart: React.FC = () => {
  return (
    <div className="bg-[#1E2022] border border-[#2C3035] rounded-xl p-6 shadow-lg">
      <h3 className="text-white text-lg font-semibold mb-1">Reasons for Cancellation</h3>
      <p className="text-sm text-[#A2ABB3] mb-4">Breakdown of churn reasons.</p>
      <div className="max-h-64 h-64">
        <Doughnut data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ChurnReasonsChart; 