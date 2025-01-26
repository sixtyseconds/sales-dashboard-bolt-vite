'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '@/lib/hooks/useUser';
import { useSalesData } from '@/lib/hooks/useSalesData';
import { useTargets } from '@/lib/hooks/useTargets';
import { Users, Phone, FileText, DollarSign } from 'lucide-react';
import { useActivityFilters } from '@/lib/hooks/useActivityFilters';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '@/lib/hooks/useActivities';
import { startOfMonth } from 'date-fns';

export default function SalesFunnel() {
  const { userData } = useUser();
  const navigate = useNavigate();
  const [dateRange] = useState({
    start: new Date(new Date().setDate(1)),
    end: new Date(),
  });
  const { setFilters } = useActivityFilters();
  const { activities } = useActivities();

  const { data: salesData } = useSalesData(
    userData?.id,
    dateRange.start,
    dateRange.end
  );

  const { data: targets } = useTargets(userData?.id);

  // Calculate funnel metrics from activities
  const funnelMetrics = useMemo(() => {
    const monthStart = startOfMonth(new Date());
    const monthActivities = activities.filter(activity => {
      const activityDate = new Date(activity.date);
      return activityDate >= monthStart && activityDate <= new Date();
    });

    return {
      outbound: monthActivities.filter(a => a.type === 'outbound').length,
      meetings: monthActivities.filter(a => a.type === 'meeting').length,
      proposals: monthActivities.filter(a => a.type === 'proposal').length,
      closed: monthActivities.filter(a => a.type === 'sale').length
    };
  }, [activities]);

  if (!salesData || !targets) return null;

  const funnelStages = [
    {
      id: 'outbound',
      label: 'Outbound',
      value: funnelMetrics.outbound,
      icon: Phone,
      color: 'blue',
      description: 'Initial outreach attempts'
    },
    {
      id: 'meetings',
      label: 'Meetings',
      value: funnelMetrics.meetings,
      icon: Users,
      color: 'violet',
      description: 'Qualified meetings held'
    },
    {
      id: 'proposals',
      label: 'Proposals',
      value: funnelMetrics.proposals,
      icon: FileText,
      color: 'orange',
      description: 'Proposals sent'
    },
    {
      id: 'closed',
      label: 'Signed',
      value: funnelMetrics.closed,
      icon: DollarSign,
      color: 'emerald',
      description: 'Deals signed'
    },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 mt-12 lg:mt-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-3xl font-bold">Sales Funnel</h1>
          <p className="text-gray-400 mt-1">Visualise your sales pipeline conversion rates</p>
        </div>

        {/* Funnel Visualization */}
        <div className="relative max-w-4xl mx-auto">
          {funnelStages.map((stage, index) => {
            const width = 100 - (index * 15);
            return (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="mb-4"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className={`p-2 rounded-lg ${
                    stage.color === 'blue'
                      ? 'bg-blue-400/5'
                      : `bg-${stage.color}-500/10`
                  } border ${
                    stage.color === 'blue'
                      ? 'border-blue-500/10'
                      : `border-${stage.color}-500/20`
                  }`}>
                    <stage.icon className={`w-5 h-5 ${
                      stage.color === 'blue'
                        ? 'text-blue-400'
                        : `text-${stage.color}-500`
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-medium text-white">{stage.label}</span>
                      <span className="text-sm text-gray-400">{stage.description}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">{stage.value}</div>
                  </div>
                </div>
                <div className="relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    onClick={() => {
                      setFilters({ type: stage.id, dateRange });
                      navigate('/activity');
                    }}
                    className={`h-16 ${
                      stage.color === 'blue'
                        ? 'bg-blue-400/5 border-blue-500/10 hover:bg-blue-400/10 hover:border-blue-500/20 hover:shadow-blue-400/10'
                        : `bg-${stage.color}-500/10 border-${stage.color}-500/20 hover:bg-${stage.color}-500/20 hover:border-${stage.color}-500/40 hover:shadow-${stage.color}-500/20`
                    } backdrop-blur-xl border rounded-xl relative overflow-hidden group transition-all duration-300 hover:shadow-lg cursor-pointer`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                    {index < funnelStages.length - 1 && (
                      <div className="absolute -bottom-4 left-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[16px] border-gray-800/50" style={{ transform: 'translateX(-50%)' }} />
                    )}
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Conversion Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10 lg:mt-12">
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50 hover:border-[#37bd7e]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#37bd7e]/20 group">
            <h3 className="text-lg font-medium mb-2">Overall Conversion</h3>
            <div className="text-3xl font-bold text-[#37bd7e] group-hover:scale-105 transition-transform duration-300">8%</div>
            <p className="text-sm text-gray-400 mt-1">Outbound to Closed Won</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50 hover:border-[#37bd7e]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#37bd7e]/20 group">
            <h3 className="text-lg font-medium mb-2">Avg. Deal Size</h3>
            <div className="text-3xl font-bold text-[#37bd7e] group-hover:scale-105 transition-transform duration-300">£15,750</div>
            <p className="text-sm text-gray-400 mt-1">Per closed deal</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-xl rounded-xl p-6 border border-gray-800/50 hover:border-[#37bd7e]/30 transition-all duration-300 hover:shadow-lg hover:shadow-[#37bd7e]/20 group">
            <h3 className="text-lg font-medium mb-2">Sales Velocity</h3>
            <div className="text-3xl font-bold text-[#37bd7e] group-hover:scale-105 transition-transform duration-300">18 days</div>
            <p className="text-sm text-gray-400 mt-1">Average sales cycle</p>
          </div>
        </div>
      </div>
    </div>
  );
}