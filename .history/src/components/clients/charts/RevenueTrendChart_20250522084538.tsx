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
  labels: ['Aug \'23', 'Sep \'23', 'Oct \'23', 'Nov \'23', 'Dec \'23', 'Jan \'24', 'Feb \'24', 'Mar \'24', 'Apr \'24', 'May \'24', 'Jun \'24', 'Jul \'24'],
  datasets: [{
    label: 'Total Revenue',
    data: [180000, 185000, 190000, 195000, 200000, 205000, 210000, 212000, 215000, 218000, 220000, 215780],
    borderColor: '#10B981', // emerald-500
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    fill: true,
    tension: 0.3,
    pointBackgroundColor: '#10B981',
    pointBorderColor: '#fff',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: '#10B981'
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
        color: '#A2ABB3', // Match original text color for ticks
      },
      grid: {
        borderColor: '#2C3035', // Match original border color
        color: '#2C3035', // For grid lines
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

const RevenueTrendChart: React.FC = () => {
  return (
    <section className="mb-8">
      <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2">
        Revenue Trend (Last 12 Months)
      </h2>
      <div className="p-4 bg-[#1E2022] border border-[#2C3035] rounded-xl shadow-lg">
        <div className="max-h-96 h-96"> {/* Ensure canvas container has a defined height */}
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </section>
  );
};

export default RevenueTrendChart; 