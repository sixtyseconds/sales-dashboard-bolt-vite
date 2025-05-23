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

const chartData = {
  labels: ['July', 'August', 'September', 'October', 'November', 'December', 'January (F)'],
  datasets: [{
    label: 'Retained Billings',
    data: [55000, 58000, 62000, 60000, 65000, 68000, 72000],
    borderColor: '#3B82F6', // blue-500
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    fill: true,
    tension: 0.3,
    pointBackgroundColor: '#3B82F6',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#3B82F6'
  }]
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: false,
      ticks: {
        callback: function(value: string | number) {
          if (typeof value === 'number') {
            return '$' + value / 1000 + 'k';
          }
          return value;
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
      display: true,
      position: 'top' as const,
      labels: {
        color: '#dce7f3'
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
        }
      }
    }
  }
};

const RetainedBillingsChart: React.FC = () => {
  return (
    <section className="mb-8">
      <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2">
        Retained Billings Forecast
      </h2>
      <div className="p-4 bg-[#1E2022] border border-[#2C3035] rounded-xl shadow-lg">
        <div className="max-h-96 h-96"> {/* Ensure canvas container has a defined height */}
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </section>
  );
};

export default RetainedBillingsChart; 