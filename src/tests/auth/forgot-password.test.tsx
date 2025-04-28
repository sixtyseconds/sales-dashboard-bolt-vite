/**
 * Tests for the Forgot Password flow.
 * Ensures correct form rendering, submission, error handling,
 * and that email addresses are handled in a case-insensitive manner (lowercased before sending to Supabase).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ForgotPassword from '@/pages/auth/forgot-password';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => {
  return {
    supabase: {
      auth: {
        resetPasswordForEmail: vi.fn(),
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

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the form correctly', () => {
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
    expect(screen.getByText('Back to Login')).toBeInTheDocument();
  });

  it('handles form submission correctly', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {},
      error: null,
    });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Fill in the form
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Submit the form
    const submitButton = screen.getByText('Send Reset Link');
    fireEvent.click(submitButton);

    // Check that the Supabase method was called with the correct arguments
    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: expect.stringContaining('/auth/reset-password'),
        }
      );
      expect(toast.success).toHaveBeenCalled();
    });

    // Verify that the success message is shown
    expect(screen.getByText('Check your email for reset instructions')).toBeInTheDocument();
  });

  it('handles Supabase errors', async () => {
    // Mock error response
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: null,
      error: { message: 'Invalid email', status: 400 },
    });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Fill in the form with invalid email
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Submit the form
    const submitButton = screen.getByText('Send Reset Link');
    fireEvent.click(submitButton);

    // Check that the error is displayed
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid email');
    });

    // Form should still be visible (not switched to success state)
    expect(screen.getByText('Send Reset Link')).toBeInTheDocument();
  });

  it('handles email with uppercase letters by lowercasing before sending to Supabase', async () => {
    // Mock successful response
    vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue({
      data: {},
      error: null,
    });

    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

    // Fill in the form with uppercase email
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'Test@Example.COM' } });

    // Submit the form
    const submitButton = screen.getByText('Send Reset Link');
    fireEvent.click(submitButton);

    // Check that the Supabase method was called with the lowercased email
    await waitFor(() => {
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          redirectTo: expect.stringContaining('/auth/reset-password'),
        }
      );
      expect(toast.success).toHaveBeenCalled();
    });
  });
}); 