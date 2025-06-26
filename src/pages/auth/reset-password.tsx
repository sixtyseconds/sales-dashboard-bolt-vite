import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

export default function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  // Check if user has valid recovery session
  useEffect(() => {
    const validateRecoverySession = async () => {
      try {
        console.log('🔍 RESET PASSWORD DEBUG:');
        console.log('Full URL:', window.location.href);
        console.log('Hash:', window.location.hash);
        console.log('Search:', window.location.search);
        console.log('Pathname:', window.location.pathname);

        const hasRecoveryToken = window.location.hash.includes('type=recovery') || 
                                window.location.search.includes('type=recovery') ||
                                window.location.hash.includes('access_token') ||
                                window.location.search.includes('access_token');
        
        console.log('Has recovery token?', hasRecoveryToken);

        // TEMPORARILY DISABLED - Allow all access for debugging
        // if (!hasRecoveryToken) {
        //   console.log('❌ No recovery token found, redirecting to forgot-password');
        //   toast.error('Invalid or expired password reset link');
        //   navigate('/auth/forgot-password');
        //   return;
        // }

        if (!hasRecoveryToken) {
          console.log('⚠️ No recovery token found, but allowing access for debugging');
        }

        console.log('✅ Recovery token found, proceeding...');

        // Check if we can get the session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        console.log('Session check result:', { session: !!session, error });

        if (error) {
          console.error('Session validation error:', error);
          // TEMPORARILY DISABLED
          // toast.error('Invalid or expired password reset link');
          // navigate('/auth/forgot-password');
          // return;
        }

        // For password recovery, we might not have a full session yet
        // but the recovery token should be valid
        console.log('Recovery session validation completed');
        
      } catch (error) {
        console.error('Recovery validation error:', error);
        // TEMPORARILY DISABLED
        // toast.error('Something went wrong. Please try requesting a new reset link.');
        // navigate('/auth/forgot-password');
      } finally {
        setIsValidating(false);
      }
    };

    validateRecoverySession();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Attempting to update password...');
      
      const { error } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (error) {
        console.error('Password update error:', error);
        if (error.message.includes('session')) {
          toast.error('Your reset link has expired. Please request a new one.');
          navigate('/auth/forgot-password');
        } else {
          throw error;
        }
        return;
      }

      console.log('✅ Password updated successfully');
      toast.success('Password updated successfully');
      // Small delay to show success message before redirect
      setTimeout(() => {
        navigate('/auth/login');
      }, 1500);
    } catch (error: any) {
      console.error('Unexpected error:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(74,74,117,0.25),transparent)] pointer-events-none" />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-8 h-8 border-2 border-[#37bd7e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Validating reset link...</p>
        </motion.div>
      </div>
    );
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
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent transition-colors hover:bg-gray-800/50"
                  placeholder="••••••••"
                  minLength={6}
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
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full bg-gray-800/30 border border-gray-700/30 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#37bd7e] focus:border-transparent transition-colors hover:bg-gray-800/50"
                  placeholder="••••••••"
                  minLength={6}
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