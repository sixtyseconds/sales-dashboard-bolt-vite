import React from 'react';
import RevenueTypeBreakdownChart from './RevenueTypeBreakdownChart';
import SubscriptionTierBreakdownChart from './SubscriptionTierBreakdownChart';

const RevenueBreakdownChartsDisplay: React.FC = () => {
  return (
    <section className="mb-8">
      <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2">
        Revenue Breakdown
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        <RevenueTypeBreakdownChart />
        <SubscriptionTierBreakdownChart />
      </div>
    </section>
  );
};

export default RevenueBreakdownChartsDisplay; 