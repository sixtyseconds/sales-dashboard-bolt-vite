import React from 'react';

interface LifecycleStageCardProps {
  title: string;
  clientCount: string | number;
  mrr: string;
  titleClassName?: string;
}

const LifecycleStageCard: React.FC<LifecycleStageCardProps> = ({
  title,
  clientCount,
  mrr,
  titleClassName = 'text-blue-400',
}) => {
  return (
    <div className="bg-[#1E2022] border border-[#2C3035] rounded-xl p-5 shadow-lg">
      <h3 className={`text-lg font-semibold mb-1 ${titleClassName}`}>{title}</h3>
      <p className="text-2xl font-bold text-white">{clientCount}</p>
      <p className="text-sm text-[#A2ABB3]">{mrr}</p>
    </div>
  );
};

export default LifecycleStageCard; 