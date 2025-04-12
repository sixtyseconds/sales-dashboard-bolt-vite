import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { impersonateUser, stopImpersonating } from '../lib/hooks/useUser';
import { supabase } from '@/lib/supabase/client';

// Mock the supabase client
vi.mock('@/lib/supabase/client', () => {
  const supabaseMock = {
    auth: {
      getSession: vi.fn(),
      signInWithPassword: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ 
        data: { subscription: { unsubscribe: vi.fn() } } 
      })),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    functions: {
      invoke: vi.fn(),
    },
  };
  
  return {
    supabase: supabaseMock
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock window.queryClient
const queryClientMock = {
  invalidateQueries: vi.fn(),
};
Object.defineProperty(window, 'queryClient', { value: queryClientMock });

describe('Impersonation Feature', () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  it('should store original user ID when impersonating', async () => {
    // Mock supabase responses for successful impersonation
    const mockSession = { user: { id: 'admin-user-id' } };
    const mockAdminProfile = { is_admin: true };
    const mockToken = { email: 'user@example.com', password: 'temp-password' };

    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null });
    vi.mocked(supabase.from().select().eq().single).mockResolvedValue({ data: mockAdminProfile, error: null });
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: mockToken, error: null });
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null });

    // Test impersonation
    await impersonateUser('user-to-impersonate');

    // Verify localStorage was set correctly
    expect(localStorageMock.setItem).toHaveBeenCalledWith('originalUserId', 'admin-user-id');
    
    // Verify sign in was called with correct credentials
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'temp-password'
    });

    // Verify queries were invalidated
    expect(queryClientMock.invalidateQueries).toHaveBeenCalled();
  });

  it('should remove original user ID when stopping impersonation', async () => {
    // Setup localStorage with an original user ID
    localStorageMock.setItem('originalUserId', 'admin-user-id');
    
    // Mock supabase responses for successful de-impersonation
    const mockToken = { email: 'admin@example.com', password: 'admin-temp-password' };
    
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: mockToken, error: null });
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ data: {}, error: null });
    
    // Test stopping impersonation
    await stopImpersonating();
    
    // Verify localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('originalUserId');
    
    // Verify sign in was called with correct credentials
    expect(supabase.functions.invoke).toHaveBeenCalledWith('restore-user', {
      body: { userId: 'admin-user-id' }
    });
    
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'admin-temp-password'
    });

    // Verify queries were invalidated
    expect(queryClientMock.invalidateQueries).toHaveBeenCalled();
  });

  it('should handle errors during impersonation', async () => {
    const mockSession = { user: { id: 'admin-user-id' } };
    const mockAdminProfile = { is_admin: true };
    
    vi.mocked(supabase.auth.getSession).mockResolvedValue({ data: { session: mockSession }, error: null });
    vi.mocked(supabase.from().select().eq().single).mockResolvedValue({ data: mockAdminProfile, error: null });
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: new Error('Edge function error') });
    
    // Test impersonation with error
    await expect(impersonateUser('user-to-impersonate')).rejects.toThrow('Edge function error');
    
    // Verify localStorage was not set
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  it('should handle errors during stop impersonation', async () => {
    // Setup localStorage with an original user ID
    localStorageMock.setItem('originalUserId', 'admin-user-id');
    
    // Mock error response
    vi.mocked(supabase.functions.invoke).mockResolvedValue({ data: null, error: new Error('Edge function error') });
    
    // Test stopping impersonation with error
    await expect(stopImpersonating()).rejects.toThrow('Edge function error');
    
    // Verify localStorage was still cleared to prevent user from being stuck
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('originalUserId');
  });
}); 