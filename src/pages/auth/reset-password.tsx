import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/contexts/AuthContext';
import { supabase } from '@/lib/supabase/clientV2';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidRecovery, setIsValidRecovery] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { updatePassword } = useAuth();

  // Check if this is a valid password recovery session
  useEffect(() => {
    const checkRecoverySession = async () => {
      try {
        console.log('Current URL:', window.location.href);
        console.log('Hash params:', window.location.hash);
        
        // Check if we have recovery parameters in the URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        console.log('Hash params parsed:', { accessToken: !!accessToken, type });
        
        if (type === 'recovery' && accessToken) {
          console.log('Valid recovery link detected');
          
          // Let Supabase handle the recovery session automatically
          const { data: { session }, error } = await supabase.auth.getSession();
          
          console.log('Session after recovery:', { session: !!session, error });
          
          if (error) {
            console.error('Session error:', error);
            toast.error('Invalid or expired password reset link');
            navigate('/auth/forgot-password');
            return;
          }
          
          if (session) {
            setIsValidRecovery(true);
          } else {
            toast.error('Invalid password reset link');
            navigate('/auth/forgot-password');
          }
        } else {
          console.log('No valid recovery parameters found');
          toast.error('Invalid password reset link');
          navigate('/auth/forgot-password');
        }
        
        setIsCheckingSession(false);
      } catch (error) {
        console.error('Recovery check error:', error);
        toast.error('Invalid password reset link');
        navigate('/auth/forgot-password');
        setIsCheckingSession(false);
      }
    };

    checkRecoverySession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await updatePassword(formData.password);

      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Password updated successfully! Please sign in with your new password.');
        navigate('/auth/login');
      }
    } catch (error: any) {
      console.error('Password update error:', error);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking recovery session
  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.25),transparent)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-2 border-[#37bd7e] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Verifying password reset link...</p>
        </motion.div>
      </div>
    );
  }

  // Only show the form if we have a valid recovery session
  if (!isValidRecovery) {
    return null; // Component will navigate away
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.25),transparent)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="relative bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-gray-800/50 p-6 sm:p-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/90 via-gray-900/70 to-gray-900/30 rounded-2xl -z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.15),transparent)] rounded-2xl -z-10" />
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-[#37bd7e]/10 blur-3xl rounded-full" />

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2 text-white">Set New Password</h1>
            <p className="text-gray-400">Create a new password for your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent transition-colors hover:bg-gray-800/50"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent transition-colors hover:bg-gray-800/50"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#37bd7e] text-white py-2.5 rounded-xl font-medium hover:bg-[#2da76c] focus:outline-none focus:ring-2 focus:ring-[#37bd7e] focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#37bd7e]/20"
            >
              {isLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
} 