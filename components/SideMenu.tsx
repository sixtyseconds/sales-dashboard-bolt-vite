'use client';

import { useState } from 'react';
import { useUser } from '@/lib/hooks/useUser';
import {
  LayoutDashboard,
  Activity,
  FileText,
  LineChart,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function SideMenu() {
  const { userData } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Activity, label: 'Heatmap', href: '/heatmap' },
    { icon: FileText, label: 'Activity Log', href: '/activity' },
    { icon: LineChart, label: 'Sales Funnel', href: '/funnel' },
  ];

  return (
    <div className={cn(
      'h-screen bg-gray-900 text-white transition-all duration-300',
      isCollapsed ? 'w-20' : 'w-64'
    )}>
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
          {!isCollapsed && <span className="font-bold text-lg">Sixty Seconds</span>}
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <X className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            {!isCollapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>

      <div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
        <a
          href="/settings"
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-5 h-5" />
          {!isCollapsed && <span>Settings</span>}
        </a>
        <button
          className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-red-500 w-full mt-2"
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}