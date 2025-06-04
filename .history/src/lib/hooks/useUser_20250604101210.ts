import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/lib/config';

const IS_DEVELOPMENT = true;

export const USER_STAGES = [
  'Trainee',
  'Junior',
  'Senior',
  'Manager',
  'Director'
];

export function useUser() {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true);
        setError(null);

        if (IS_DEVELOPMENT) {
          // Use API mock user endpoint
          const response = await fetch(`${API_BASE_URL}/user`);
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const user = await response.json();
          setUserData(user);
        } else {
          // In production, you would use Supabase auth here
          setUserData(null);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUser();
  }, []);

  const signOut = async () => {
    // In development, just clear the user data
    setUserData(null);
  };

  return {
    userData,
    isLoading,
    error,
    signOut,
    isAuthenticated: !!userData
  };
}