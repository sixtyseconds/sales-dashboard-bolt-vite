import { Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/AppLayout';
import { AuthGuard } from '@/components/AuthGuard';
import Dashboard from '@/pages/Dashboard';
import ActivityLog from '@/pages/ActivityLog';
import Heatmap from '@/pages/Heatmap';
import SalesFunnel from '@/pages/SalesFunnel';
import Profile from '@/pages/Profile';
import Users from '@/pages/admin/Users';
import Login from '@/pages/auth/login';
import Signup from '@/pages/auth/signup';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Make queryClient globally available
declare global {
  interface Window {
    queryClient: QueryClient;
  }
}
window.queryClient = queryClient;

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGuard>
        <Routes>
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/activity" element={<AppLayout><ActivityLog /></AppLayout>} />
          <Route path="/heatmap" element={<AppLayout><Heatmap /></AppLayout>} />
          <Route path="/funnel" element={<AppLayout><SalesFunnel /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route path="/admin/users" element={<AppLayout><Users /></AppLayout>} />
        </Routes>
        <Toaster />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.15),transparent)] pointer-events-none" />
      </AuthGuard>
    </QueryClientProvider>
  );
}

export default App;