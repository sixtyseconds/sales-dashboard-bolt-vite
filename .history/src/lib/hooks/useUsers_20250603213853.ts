import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Mock implementation - temporarily disabled Supabase calls to avoid 400 errors
// TODO: Implement with Neon API when user management functionality is needed

export interface Target {
  id?: string;
  user_id?: string;
  revenue_target: number | null;
  outbound_target: number | null;
  meetings_target: number | null;
  proposal_target: number | null;
  start_date: string | null;
  end_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  stage: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  targets: Target[];
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Mock implementation - returns empty data
    // Eliminates Supabase 400 errors while keeping components functional
    setIsLoading(true);
    setTimeout(() => {
      setUsers([]); // Return empty array
      setIsLoading(false);
    }, 100);
  }, []);

  const updateUser = async (userId: string, updates: Partial<User>) => {
    // Mock implementation - does nothing
    console.log('User update temporarily disabled:', { userId, updates });
    toast.success('User updated successfully (mock)');
  };

  const deleteUser = async (userId: string) => {
    // Mock implementation - does nothing
    console.log('User deletion temporarily disabled:', userId);
    toast.success('User deleted successfully (mock)');
  };

  const impersonateUser = async (userId: string) => {
    // Mock implementation - does nothing
    console.log('User impersonation temporarily disabled:', userId);
    toast.success('Impersonation started (mock)');
  };

  return {
    users,
    isLoading,
    updateUser,
    deleteUser,
    impersonateUser,
  };
}