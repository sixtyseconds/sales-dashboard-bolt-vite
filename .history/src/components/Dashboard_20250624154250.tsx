import React, { useState } from 'react';
import { DashboardCard } from './DashboardCard';
import SalesActivityChart from './SalesActivityChart';
import { SalesTable } from './SalesTable';
import { Plus } from 'lucide-react';
import { useUser } from '@/lib/hooks/useUser';
import { useSalesData } from '@/lib/hooks/useSalesData';
import { useTargets } from '@/lib/hooks/useTargets';
import { useNavigate } from 'react-router-dom';
import { useActivities } from '@/lib/hooks/useActivities';

export function Dashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const { userData } = useUser();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome back, {userData?.first_name || 'Sales Rep'}! 👋
              </h1>
              <p className="text-gray-400 mt-1">
                Track your performance and manage your sales activities
              </p>
            </div>
            
            <button
              className="hidden sm:block px-4 py-2 rounded-xl bg-violet-500/10 text-violet-500 border border-violet-500/20 hover:bg-violet-500/20 transition-colors"
              onClick={() => navigate('/activity')}
            >
              <Plus className="w-4 h-4 mr-2 inline-block" />
              Add Activity
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <SalesActivityChart />
          </div>
          
          <div className="space-y-8">
            <SalesTable />
          </div>
        </div>
      </div>
    </div>
  );
}