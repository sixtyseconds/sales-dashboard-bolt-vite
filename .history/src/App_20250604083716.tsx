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
import PipelineSettings from '@/pages/admin/PipelineSettings';
import Login from '@/pages/auth/login';
import Signup from '@/pages/auth/signup';
import ForgotPassword from '@/pages/auth/forgot-password';
import ResetPassword from '@/pages/auth/reset-password';
import { PipelinePage } from '@/pages/PipelinePage';
import ActivityProcessingPage from '@/pages/ActivityProcessingPage';
import CompaniesTable from '@/pages/companies/CompaniesTable';
import ContactsTable from '@/pages/contacts/ContactsTable';
import ContactRecord from '@/pages/contacts/ContactRecord';

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
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/activity" element={<AppLayout><ActivityLog /></AppLayout>} />
          <Route path="/heatmap" element={<AppLayout><Heatmap /></AppLayout>} />
          <Route path="/funnel" element={<AppLayout><SalesFunnel /></AppLayout>} />
          <Route path="/pipeline" element={<AppLayout><PipelinePage /></AppLayout>} />
          <Route path="/companies" element={<AppLayout><CompaniesTable /></AppLayout>} />
          <Route path="/crm/companies" element={<AppLayout><CompaniesTable /></AppLayout>} />
          <Route path="/crm/contacts" element={<AppLayout><ContactsTable /></AppLayout>} />
          <Route path="/crm/contacts/:id" element={<AppLayout><ContactRecord /></AppLayout>} />
          <Route path="/profile" element={<AppLayout><Profile /></AppLayout>} />
          <Route path="/activity-processing" element={<AppLayout><ActivityProcessingPage /></AppLayout>} />
          <Route path="/admin/users" element={<AppLayout><Users /></AppLayout>} />
          <Route path="/admin/pipeline-settings" element={<AppLayout><PipelineSettings /></AppLayout>} />
        </Routes>
        <Toaster />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.15),transparent)] pointer-events-none" />
      </AuthGuard>
    </QueryClientProvider>
  );
}

export default App;