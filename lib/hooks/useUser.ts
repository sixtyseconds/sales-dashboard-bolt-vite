import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

export interface UserData {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  is_admin: boolean;
  profile_picture_url: string | null;
  stage: string;
}

export function useUser() {
  // Mock user data for development
  const mockUserData: UserData = {
    id: 'mock-user-id',
    email: 'sarah.johnson@example.com',
    name: 'Sarah Johnson',
    first_name: 'Sarah',
    last_name: 'Johnson',
    is_admin: true,
    profile_picture_url: null,
    stage: 'Trainee'
  };

  const [user] = useState<User | null>({ id: mockUserData.id } as User);
  const [userData] = useState<UserData | null>(mockUserData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(false);
  }, []);

  return { user, userData, loading, error };
}