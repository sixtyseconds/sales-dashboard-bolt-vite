import React from 'react';
import ChurnRateTrendChart from './charts/ChurnRateTrendChart';
import ChurnReasonsChart from './charts/ChurnReasonsChart';
import CohortAnalysisTable from './CohortAnalysisTable';

const ChurnAnalysisDisplay: React.FC = () => {
  return (
    <section>
      <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2">
        Churn Analysis
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
        <ChurnRateTrendChart />
        <ChurnReasonsChart />
      </div>
      <div className="p-4 mt-6">
        <h3 className="text-white text-lg font-semibold mb-1 px-4">Cohort Analysis</h3>
        <p className="text-sm text-[#A2ABB3] mb-4 px-4">Customer retention by monthly cohort.</p>
        <CohortAnalysisTable />
      </div>
    </section>
  );
};

export default ChurnAnalysisDisplay; 