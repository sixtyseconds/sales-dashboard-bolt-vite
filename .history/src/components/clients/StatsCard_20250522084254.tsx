import React from 'react';

interface StatsCardProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ label, value, valueClassName = 'text-white' }) => {
  return (
    <div className="bg-[#1E2022] border border-[#2C3035] rounded-xl p-5 shadow-lg">
      <p className="text-sm text-[#A2ABB3] mb-1">{label}</p>
      <p className={`text-3xl font-bold ${valueClassName}`}>{value}</p>
    </div>
  );
};

export default StatsCard; 