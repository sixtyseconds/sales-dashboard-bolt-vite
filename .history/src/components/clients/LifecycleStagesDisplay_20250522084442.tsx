import React from 'react';
import LifecycleStageCard from './LifecycleStageCard';

const lifecycleStagesData = [
  {
    title: 'Onboarding',
    clientCount: '32 Clients',
    mrr: '$48,500 MRR',
    titleClassName: 'text-blue-400',
  },
  {
    title: 'Active',
    clientCount: '285 Clients',
    mrr: '$155,280 MRR',
    titleClassName: 'text-green-400',
  },
  {
    title: 'Given Notice',
    clientCount: '18 Clients',
    mrr: '$10,500 MRR',
    titleClassName: 'text-yellow-400',
  },
  {
    title: 'Cancelled',
    clientCount: '10 Clients',
    mrr: '$1,500 Lost MRR',
    titleClassName: 'text-red-400',
  },
];

const LifecycleStagesDisplay: React.FC = () => {
  return (
    <section className="mb-8">
      <h2 className="text-white text-xl md:text-2xl font-semibold leading-tight tracking-[-0.015em] px-4 pb-3 pt-2">
        Client Lifecycle Stages
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-4">
        {lifecycleStagesData.map((stage) => (
          <LifecycleStageCard
            key={stage.title}
            title={stage.title}
            clientCount={stage.clientCount}
            mrr={stage.mrr}
            titleClassName={stage.titleClassName}
          />
        ))}
      </div>
    </section>
  );
};

export default LifecycleStagesDisplay; 