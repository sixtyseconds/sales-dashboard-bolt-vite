'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import { useSalesData } from '@/lib/hooks/useSalesData';
import { useTargets } from '@/lib/hooks/useTargets';
import { calculateProgress, calculateTrend } from '@/lib/utils/calculations';
import {
  TrendingUp,
  Users,
  Target,
  Phone,
  FileText,
  DollarSign,
} from 'lucide-react';

export function DashboardCards() {
  const { userData } = useUser();
  const [dateRange] = useState({
    start: new Date(new Date().setDate(1)), // First day of current month
    end: new Date(),
  });

  const { data: salesData } = useSalesData(
    userData?.id,
    dateRange.start,
    dateRange.end
  );

  const { data: targets } = useTargets(userData?.id);

  if (!salesData || !targets) return null;

  const metrics = [
    {
      title: 'Revenue',
      icon: DollarSign,
      value: salesData.performance.reduce((sum, sale) => sum + sale.amount, 0),
      target: targets.revenue_target,
     color: 'emerald', // Green for deals/sales
      isPrimary: true,
    },
    {
      title: 'Outbound',
      icon: Phone,
      value: salesData.activities.filter(a => 
        a.activity_type.type_name === 'Outbound'
      ).reduce((sum, a) => sum + a.count, 0),
      target: targets.outbound_target,
     color: 'blue', // Blue for outbound
      isPrimary: false,
    },
    {
      title: 'Meetings',
      icon: Users,
      value: salesData.activities.filter(a => 
        a.activity_type.type_name === 'Meeting'
      ).reduce((sum, a) => sum + a.count, 0),
      target: targets.meetings_target,
     color: 'violet', // Purple for meetings
      isPrimary: false,
    },
    {
      title: 'Proposals',
      icon: FileText,
      value: salesData.activities.filter(a => 
        a.activity_type.type_name === 'Proposal'
      ).reduce((sum, a) => sum + a.count, 0),
      target: targets.proposal_target,
     color: 'orange', // Orange for proposals
      isPrimary: false,
    },
  ];

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-violet-500/10 to-sky-500/10 blur-3xl -z-10 opacity-30" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className={`relative backdrop-blur-xl bg-gray-900/40 rounded-3xl p-6 md:p-8 border border-gray-800/50 hover:border-${metric.color}-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl hover:shadow-${metric.color}-500/20 overflow-hidden ${metric.isPrimary ? 'md:col-span-2' : ''}`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-900/75 to-gray-900/40 rounded-3xl" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.25),transparent)] rounded-3xl" />
            <div className={`absolute -right-20 -top-20 w-40 h-40 bg-${metric.color}-500/10 blur-3xl rounded-full group-hover:bg-${metric.color}-500/20 transition-all duration-500`} />
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 ${metric.isPrimary ? 'md:p-5' : 'md:p-4'} rounded-2xl bg-${metric.color}-500/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-${metric.color}-500/30 ring-2 ring-${metric.color}-500/40 group-hover:ring-${metric.color}-500/60 backdrop-blur-sm`}>
                    <metric.icon className={`w-5 h-5 md:w-6 md:h-6 text-white drop-shadow-glow group-hover:animate-pulse`} />
                  </div>
                  <div>
                    <h3 className={`text-white font-semibold tracking-wide ${metric.isPrimary ? 'text-lg md:text-xl' : 'text-base md:text-lg'}`}>{metric.title}</h3>
                    <p className="text-gray-200 text-sm">This month</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium bg-${metric.color}-500/10 text-white border border-${metric.color}-500/30 shadow-lg shadow-${metric.color}-500/20 backdrop-blur-sm flex items-center gap-1`}>
                  <div className={`w-1.5 h-1.5 rounded-full bg-${metric.color}-400 animate-pulse`} />
                  {calculateTrend(metric.value, metric.target)}
                </div>
              </div>
              
              <div className="flex items-baseline gap-2 mb-6">
                <span className={`font-mono font-bold text-white tracking-tight transition-colors drop-shadow-glow ${metric.isPrimary ? 'text-4xl md:text-5xl' : 'text-3xl md:text-4xl'}`}>
                  {metric.title === 'Revenue' ? 
                    `£${(metric.value / 1000).toFixed(1)}K` :
                    metric.value}
                </span>
                <span className="text-xs md:text-sm text-gray-200 font-medium">
                  / {metric.title === 'Revenue' ? 
                    `£${(metric.target / 1000).toFixed(1)}K` :
                    metric.target}
                </span>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-200 font-medium">Progress</span>
                  <span className="text-white font-semibold">
                    {calculateProgress(metric.value, metric.target)}%
                  </span>
                </div>
                <div className="h-2 md:h-3 bg-gray-800/60 rounded-full overflow-hidden backdrop-blur-sm ring-1 ring-gray-700/50">
                  <div
                    className={`h-full bg-gradient-to-r from-[#37bd7e] to-[#2da76c] rounded-full transition-all duration-700 group-hover:from-[#37bd7e] group-hover:to-[#2da76c] shadow-lg relative overflow-hidden after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/30 after:to-transparent after:animate-shimmer`}
                    style={{
                      width: `${calculateProgress(metric.value, metric.target)}%`
                    }}
                  />
                </div>
                {metric.isPrimary && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#37bd7e]/20 to-transparent" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}