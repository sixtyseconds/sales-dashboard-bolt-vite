import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ResetPassword from '@/pages/auth/reset-password';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => {
  return {
    supabase: {
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: '123' } } },
        }),
        updateUser: vi.fn(),
      },
    },
  };
});

vi.mock('sonner', () => {
  return {
    toast: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

vi.mock('react-router-dom', () => {
  const actual = vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock window.location for the hash check
Object.defineProperty(window, 'location', {
  value: {
    hash: '#type=recovery',
    hostname: 'localhost',
    origin: 'http://localhost',
  },
  writable: true,
});

describe('ResetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Set New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('New Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Confirm New Password')).toBeInTheDocument();
    expect(screen.getByText('Update Password')).toBeInTheDocument();
  });

  it('validates passwords match', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill form with non-matching passwords
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm New Password');
    
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'differentpassword' } });

    // Submit the form
    const submitButton = screen.getByText('Update Password');
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match');
    });

    // Supabase update method should not be called
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('validates password length', async () => {
    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill form with short password
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm New Password');
    
    fireEvent.change(passwordInput, { target: { value: '12345' } });
    fireEvent.change(confirmInput, { target: { value: '12345' } });

    // Submit the form
    const submitButton = screen.getByText('Update Password');
    fireEvent.click(submitButton);

    // Should show error message
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters');
    });

    // Supabase update method should not be called
    expect(supabase.auth.updateUser).not.toHaveBeenCalled();
  });

  it('handles successful password update', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill form with valid matching passwords
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm New Password');
    
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });

    // Submit the form
    const submitButton = screen.getByText('Update Password');
    fireEvent.click(submitButton);

    // Verify Supabase method was called correctly
    await waitFor(() => {
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      });
      expect(toast.success).toHaveBeenCalledWith('Password updated successfully');
    });
  });

  it('handles Supabase errors', async () => {
    // Mock error response
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid password format', status: 400 },
    });

    render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill form with valid matching passwords
    const passwordInput = screen.getByLabelText('New Password');
    const confirmInput = screen.getByLabelText('Confirm New Password');
    
    fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
    fireEvent.change(confirmInput, { target: { value: 'newpassword123' } });

    // Submit the form
    const submitButton = screen.getByText('Update Password');
    fireEvent.click(submitButton);

    // Check that the error is displayed
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid password format');
    });
  });
}); 