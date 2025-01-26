'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';

const SalesActivityChart = () => {
  const [timeframe, setTimeframe] = useState('daily');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const generateData = () => {
    if (timeframe === 'daily') {
      // Generate last 14 days of data
      return Array.from({ length: 14 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          name: format(date, 'MMM d'),
          Outbound: Math.floor(Math.random() * 50) + 10,
          Meetings: Math.floor(Math.random() * 15) + 2,
          Proposals: Math.floor(Math.random() * 8) + 1,
          Sales: Math.floor(Math.random() * 4) + 1,
        };
      }).reverse();
    }
    
    if (timeframe === 'weekly') {
      // Generate last 12 weeks of data
      return Array.from({ length: 12 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i * 7));
        return {
          name: `WC ${format(date, 'MMM d')}`,
          Outbound: Math.floor(Math.random() * 100) + 20,
          Meetings: Math.floor(Math.random() * 25) + 5,
          Proposals: Math.floor(Math.random() * 15) + 2,
          Sales: Math.floor(Math.random() * 8) + 1,
        };
      }).reverse();
    }

    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return months.map((month) => ({
      name: month,
      Outbound: Math.floor(Math.random() * 400) + 100,
      Meetings: Math.floor(Math.random() * 100) + 20,
      Proposals: Math.floor(Math.random() * 50) + 10,
      Sales: Math.floor(Math.random() * 25) + 5,
    }));
  };

  const data = generateData();

  const timeframeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  // Custom tooltip component to avoid defaultProps warning
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload) return null;

    return (
      <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-xl p-3 shadow-xl">
        <p className="text-gray-400 text-sm font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4 text-sm">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="text-white font-medium">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl p-6 border border-gray-800/50">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">
            Sales Activities Overview
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            {timeframe === 'daily' ? 'Last 14 days' : 
             timeframe === 'weekly' ? 'Last 12 weeks' : 
             'Year to date'} breakdown of all sales activities
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 text-gray-300 hover:bg-[#37bd7e]/20 hover:text-white transition-all duration-300 text-sm border border-transparent hover:border-[#37bd7e]/30"
          >
            <Calendar className="w-4 h-4" />
            <span className="capitalize">{timeframe}</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-40 bg-gray-900/95 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-xl z-10"
            >
              {timeframeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setTimeframe(option.value);
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-[#37bd7e]/20 hover:text-white first:rounded-t-xl last:rounded-b-xl"
                >
                  {option.label}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data || []}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="meetingsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="proposalsGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dy={10}
              scale="point"
              padding={{ left: 10, right: 10 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              dx={-10}
              scale="log"
              domain={[1, 'auto']}
              allowDataOverflow={false}
              tickFormatter={(value) => value.toLocaleString()}
            >
              <Label
                value="Count (log scale)"
                angle={-90}
                position="insideLeft"
                style={{ fill: '#9CA3AF', fontSize: 12 }}
              />
            </YAxis>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingTop: '1rem',
                color: '#9CA3AF',
                fontSize: '12px'
              }}
            />
            <Bar
              dataKey="Outbound"
              fill="url(#outboundGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Bar
              dataKey="Meetings"
              fill="url(#meetingsGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Bar
              dataKey="Proposals"
              fill="url(#proposalsGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
            <Bar
              dataKey="Sales"
              fill="url(#salesGradient)"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SalesActivityChart;