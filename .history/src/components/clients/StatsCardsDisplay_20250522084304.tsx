import React from 'react';
import StatsCard from './StatsCard';

const statsData = [
  {
    label: 'Total Active Clients',
    value: 345,
  },
  {
    label: 'Monthly Recurring Revenue',
    value: '$215,780',
  },
  {
    label: 'Monthly Churn Rate',
    value: '2.5%',
    valueClassName: 'text-red-400',
  },
  {
    label: 'Clients Signed This Month',
    value: 28,
    valueClassName: 'text-green-400',
  },
];

const StatsCardsDisplay: React.FC = () => {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-4">
      {statsData.map((stat) => (
        <StatsCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          valueClassName={stat.valueClassName}
        />
      ))}
    </section>
  );
};

export default StatsCardsDisplay; 