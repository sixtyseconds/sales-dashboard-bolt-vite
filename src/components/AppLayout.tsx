import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence, useCycle } from 'framer-motion';
import { QuickAdd } from '@/components/QuickAdd';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  LayoutDashboard,
  Activity,
  FileText,
  LineChart,
  Settings,
  LogOut,
  Menu as MenuIcon,
  X,
  Plus,
  UserCog,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/lib/hooks/useUser';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { userData, isImpersonating, endImpersonating } = useUser();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, toggleMobileMenu] = useCycle(false, true);
  const [hasMounted, setHasMounted] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Handle stopping impersonation
  const handleStopImpersonating = async () => {
    await endImpersonating();
    // Redirect to dashboard after stopping impersonation
    if (location.pathname !== '/') {
      window.location.href = '/';
    } else {
      // Force a reload to ensure fresh data
      window.location.reload();
    }
  };

  const handleLogout = async () => {
    try {
      // If we're impersonating, stop impersonation first before logout
      if (isImpersonating) {
        await endImpersonating();
      }
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
    } catch (error: any) {
      toast.error('Error logging out');
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
    { icon: Activity, label: 'Heatmap', href: '/heatmap' },
    { icon: FileText, label: 'Activity Log', href: '/activity' },
    { icon: LineChart, label: 'Sales Funnel', href: '/funnel' },
    ...(userData?.is_admin ? [{ icon: UserCog, label: 'Admin', href: '/admin/users' }] : []),
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/10 backdrop-blur-sm text-center py-1 px-2 text-amber-400 text-xs font-medium border-b border-amber-500/20">
          <span className="flex items-center justify-center gap-1">
            <UserX className="w-3 h-3" /> You are viewing as {userData?.first_name} {userData?.last_name}
          </span>
        </div>
      )}
      
      <div className="fixed top-0 left-0 right-0 flex items-center justify-between z-50 p-4 bg-gray-950/50 backdrop-blur-sm border-b border-gray-800/50 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            {userData?.avatar_url ? (
              <img
                src={userData.avatar_url}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-[#37bd7e]/20 flex items-center justify-center">
                <span className="text-sm font-medium text-[#37bd7e]">
                  {userData?.first_name?.[0] || ''}{userData?.last_name?.[0] || ''}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white/90">
              {userData?.first_name} {userData?.last_name}
            </span>
            <span className="text-xs text-gray-400">{userData?.stage}</span>
          </div>
        </div>
        <motion.button
          animate={isMobileMenuOpen ? { opacity: 0 } : { opacity: 1 }}
          onClick={() => toggleMobileMenu()}
          className="p-2 rounded-xl bg-gray-800/50 hover:bg-gray-800/70 transition-colors lg:hidden"
        >
          <MenuIcon className="w-6 h-6 text-gray-400" />
        </motion.button>
      </div>
      
      {/* Quick Add FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsQuickAddOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-[#37bd7e] hover:bg-[#2da76c] transition-colors shadow-lg shadow-[#37bd7e]/20 z-50"
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => toggleMobileMenu()}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-[280px] bg-gray-900/50 backdrop-blur-xl border-l border-gray-800/50 p-6 z-50 lg:hidden"
            >
              <div className="relative h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden">
                      {userData?.avatar_url ? (
                        <img
                          src={userData.avatar_url}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#37bd7e]/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-[#37bd7e]">
                            {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white/90">
                        {userData?.first_name} {userData?.last_name}
                      </span>
                      <span className="text-xs text-gray-400">{userData?.stage}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleMobileMenu()}
                    className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <Link
                      to={item.href}
                      key={item.href}
                      onClick={() => toggleMobileMenu()}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                        location.pathname === item.href
                          ? 'bg-[#37bd7e]/10 text-white border border-[#37bd7e]/20'
                          : 'text-gray-400/80 hover:bg-gray-800/20'
                      )}
                    >
                      <item.icon className={cn(
                        'w-5 h-5',
                        location.pathname === item.href ? 'text-white' : 'text-gray-400/80'
                      )} />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="absolute bottom-0 left-0 p-6 border-t border-gray-800/50 w-full space-y-2">
                  <Link
                    to="/profile"
                    onClick={() => toggleMobileMenu()}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800/50 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </Link>
                  
                  {isImpersonating && (
                    <button 
                      onClick={() => {
                        toggleMobileMenu();
                        handleStopImpersonating();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
                    >
                      <UserX className="w-5 h-5" />
                      Stop Impersonating
                    </button>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.div
        initial={!hasMounted ? { opacity: 0, x: -20 } : false}
        animate={!hasMounted ? { opacity: 1, x: 0 } : false}
        className={cn( 
          'fixed top-0 left-0 h-screen bg-gray-900/50 backdrop-blur-xl border-r border-gray-800/50 p-6',
          'transition-[width] duration-300 ease-in-out flex-shrink-0',
          isCollapsed ? 'w-[80px]' : 'w-[256px]',
          'hidden lg:block'
        )}
      >
        <div className={cn(
          'flex items-center gap-3 mb-8',
          isCollapsed && 'justify-center'
        )}>
          {isCollapsed ? (
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <MenuIcon className="w-5 h-5 text-gray-400" />
            </button>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                {userData?.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#37bd7e]/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-[#37bd7e]">
                      {userData?.first_name?.[0]}{userData?.last_name?.[0]}
                    </span>
                  </div>
                )}
              </div>
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-white/90">
                      {userData?.first_name} {userData?.last_name}
                    </span>
                    <span className="text-xs text-gray-400">{userData?.stage}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
              <button
                onClick={() => setIsCollapsed(true)}
                className="absolute right-2 top-6 p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </>
          )}
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <Link
              to={item.href}
              key={item.label}
              className={cn(
                'w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-sm font-medium transition-colors',
                location.pathname === item.href
                  ? 'bg-[#37bd7e]/10 text-white border border-[#37bd7e]/20'
                  : 'text-gray-400/80 hover:bg-gray-800/20'
              )}
            >
              <motion.div
                animate={{
                  x: isCollapsed ? 0 : 0,
                  scale: isCollapsed ? 1.1 : 1
                }}
                className={cn(
                  'relative z-10 min-w-[20px] flex items-center justify-center',
                  location.pathname === item.href ? 'text-white' : 'text-gray-400/80'
                )}
              >
                <item.icon className="w-4 h-4" />
              </motion.div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          ))}
        </nav>
        
        <div className={cn(
          'absolute bottom-0 left-0 p-6 border-t border-gray-800/50 w-full'
        )}>
          <div className="flex flex-col gap-2">
            <Link
              to="/profile"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-gray-800/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Settings
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
            
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    Logout
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>

          {/* Display Stop Impersonation button at the bottom left */}
          {isImpersonating && (
            <div className="flex-shrink-0 pt-2 pb-4 px-2 border-t border-gray-800/50 mt-auto">
              <button
                onClick={handleStopImpersonating}
                className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 transition-colors"
              >
                <UserX className="w-4 h-4" />
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      Stop Impersonating
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}
        </div>
      </motion.div>
      <main className={cn(
        'flex-1 transition-[margin] duration-300 ease-in-out',
        isCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[256px]',
        'ml-0 pt-16 lg:pt-0'
      )}>
        {children}
        <QuickAdd isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      </main>
    </div>
  );
}