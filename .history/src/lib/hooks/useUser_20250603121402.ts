import { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';
const IS_DEVELOPMENT = true;

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