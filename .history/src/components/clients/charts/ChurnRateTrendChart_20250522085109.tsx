import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const chartData = {
  labels: ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [{
    label: 'Monthly Churn Rate',
    data: [2.8, 2.5, 3.1, 2.9, 2.6, 2.5],
    backgroundColor: [
      'rgba(239, 68, 68, 0.5)', // red-500
      'rgba(239, 68, 68, 0.5)',
      'rgba(239, 68, 68, 0.6)',
      'rgba(239, 68, 68, 0.5)',
      'rgba(239, 68, 68, 0.4)',
      'rgba(239, 68, 68, 0.4)',
    ],
    borderColor: [
      '#EF4444',
      '#EF4444',
      '#EF4444',
      '#EF4444',
      '#EF4444',
      '#EF4444',
    ],
    borderWidth: 1
  }]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: string | number) {
          return value + '%';
        },
        color: '#A2ABB3',
      },
      grid: {
        borderColor: '#2C3035',
        color: '#2C3035',
      }
    },
    x: {
        ticks: {
            color: '#A2ABB3',
        },
        grid: {
            borderColor: '#2C3035',
            color: '#2C3035',
        }
    }
  },
  plugins: {
    legend: {
      display: false
    }
  }
};

const ChurnRateTrendChart: React.FC = () => {
  return (
    <div className="bg-[#1E2022] border border-[#2C3035] rounded-xl p-6 shadow-lg">
      <h3 className="text-white text-lg font-semibold mb-1">Churn Rate Trend</h3>
      <p className="text-sm text-[#A2ABB3] mb-4">Monthly churn over the last 6 months.</p>
      <div className="max-h-64 h-64">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default ChurnRateTrendChart; 