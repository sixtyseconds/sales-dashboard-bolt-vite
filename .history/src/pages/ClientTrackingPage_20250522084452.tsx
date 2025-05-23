import React from 'react';
import StatsCardsDisplay from '@/components/clients/StatsCardsDisplay';
import LifecycleStagesDisplay from '@/components/clients/LifecycleStagesDisplay';

const ClientTrackingPage: React.FC = () => {
  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#121416] dark group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header will be handled by the main App layout or a shared Header component */}
        <main className="px-6 md:px-10 lg:px-12 xl:px-20 flex flex-1 justify-center py-8 bg-[#121416]">
          <div className="layout-content-container flex flex-col w-full max-w-screen-2xl">
            <div className="flex flex-wrap justify-between items-center gap-4 p-4 mb-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-white tracking-tight text-3xl md:text-4xl font-bold leading-tight">Client Tracking & Retention</h1>
                <p className="text-[#A2ABB3] text-sm md:text-base font-normal leading-normal">Monitor client health, forecast billings, and analyze churn.</p>
              </div>
            </div>
            <StatsCardsDisplay />
            <LifecycleStagesDisplay />
            {/* Sections will be added here as components */}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ClientTrackingPage; 