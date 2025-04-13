import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickAdd } from '@/components/QuickAdd';
import { useActivities } from '@/lib/hooks/useActivities';
import { BrowserRouter } from 'react-router-dom';

// Mock the hooks
vi.mock('@/lib/hooks/useActivities', () => ({
  useActivities: vi.fn()
}));

vi.mock('@/lib/hooks/useUser', () => ({
  useUser: () => ({
    userData: { id: 'test-user' }
  })
}));

describe('QuickAdd Component - Outbound Activity Types', () => {
  const mockAddActivity = vi.fn();
  const mockAddSale = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup the mocked hooks
    (useActivities as any).mockReturnValue({
      addActivity: mockAddActivity,
      addSale: mockAddSale
    });
  });
  
  it('should correctly capture outbound type (Call/LinkedIn/Email)', async () => {
    // Render the component
    render(
      <BrowserRouter>
        <QuickAdd isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );
    
    // Select the outbound action
    const outboundButton = screen.getByText('Add Outbound');
    await userEvent.click(outboundButton);
    
    // Fill the form with test data
    await userEvent.type(screen.getByLabelText('Prospect Name'), 'Test Prospect');
    
    // Select LinkedIn as outbound type
    const outboundTypeSelect = screen.getByLabelText('Outbound Type');
    await userEvent.selectOptions(outboundTypeSelect, 'LinkedIn');
    
    // Set outbound count
    await userEvent.clear(screen.getByLabelText('Number of Contacts'));
    await userEvent.type(screen.getByLabelText('Number of Contacts'), '5');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);
    
    // Verify that addActivity was called with correct parameters
    await waitFor(() => {
      expect(mockAddActivity).toHaveBeenCalledTimes(1);
      expect(mockAddActivity).toHaveBeenCalledWith(expect.objectContaining({
        type: 'outbound',
        client_name: 'Test Prospect',
        details: 'LinkedIn',  // Verify the outbound type is passed correctly
        quantity: 5
      }));
    });
  });
  
  it('should use "Call" as the default outbound type', async () => {
    // Render the component
    render(
      <BrowserRouter>
        <QuickAdd isOpen={true} onClose={() => {}} />
      </BrowserRouter>
    );
    
    // Select the outbound action
    const outboundButton = screen.getByText('Add Outbound');
    await userEvent.click(outboundButton);
    
    // Fill the form with test data but don't change the default outbound type
    await userEvent.type(screen.getByLabelText('Prospect Name'), 'Test Prospect');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);
    
    // Verify that addActivity was called with correct parameters
    await waitFor(() => {
      expect(mockAddActivity).toHaveBeenCalledTimes(1);
      expect(mockAddActivity).toHaveBeenCalledWith(expect.objectContaining({
        type: 'outbound',
        client_name: 'Test Prospect',
        details: 'Call',  // Verify the default outbound type is used
      }));
    });
  });
}); 