import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PipelineSettings from '../pages/admin/PipelineSettings';
import { supabaseAdmin } from '../lib/supabase/client';

// Mock supabase client
vi.mock('../lib/supabase/client', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnValue({
      data: [
        {
          id: '1',
          name: 'Lead',
          description: 'New lead',
          color: '#3B82F6',
          order_position: 10,
          default_probability: 10,
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          name: 'Qualified',
          description: 'Qualified lead',
          color: '#8B5CF6',
          order_position: 20,
          default_probability: 25,
          created_at: '2023-01-01T00:00:00.000Z',
          updated_at: '2023-01-01T00:00:00.000Z'
        }
      ],
      error: null
    })
  }
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}));

describe('PipelineSettings Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pipeline stages', async () => {
    render(
      <MemoryRouter>
        <PipelineSettings />
      </MemoryRouter>
    );

    // Check for loading state
    expect(screen.getByText('Loading stages...')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading stages...')).not.toBeInTheDocument();
    });

    // Check if stages are rendered
    expect(screen.getByText('Lead')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
  });

  it('allows adding a new stage', async () => {
    // Mock the insert function to return success
    vi.mocked(supabaseAdmin.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnValue({ error: null }),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue({
        data: [
          {
            id: '1',
            name: 'Lead',
            description: 'New lead',
            color: '#3B82F6',
            order_position: 10,
            default_probability: 10,
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z'
          }
        ],
        error: null
      })
    }));

    render(
      <MemoryRouter>
        <PipelineSettings />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading stages...')).not.toBeInTheDocument();
    });

    // Click Add Stage button
    fireEvent.click(screen.getByText('Add Stage'));

    // Verify edit form is displayed
    expect(screen.getByText('Add Pipeline Stage')).toBeInTheDocument();

    // Fill the form
    fireEvent.change(screen.getByPlaceholderText('e.g., Qualified Lead'), { 
      target: { value: 'New Stage' } 
    });
    
    // Save the new stage
    fireEvent.click(screen.getByText('Save'));
    
    // Verify supabase was called
    expect(supabaseAdmin.from).toHaveBeenCalledWith('deal_stages');
  });

  it('allows editing an existing stage', async () => {
    // Mock the update function to return success
    vi.mocked(supabaseAdmin.from).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnValue({ error: null }),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnValue({
        data: [
          {
            id: '1',
            name: 'Lead',
            description: 'New lead',
            color: '#3B82F6',
            order_position: 10,
            default_probability: 10,
            created_at: '2023-01-01T00:00:00.000Z',
            updated_at: '2023-01-01T00:00:00.000Z'
          }
        ],
        error: null
      })
    }));

    render(
      <MemoryRouter>
        <PipelineSettings />
      </MemoryRouter>
    );

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText('Loading stages...')).not.toBeInTheDocument();
    });

    // Find and click edit button (first button with edit icon)
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => button.innerHTML.includes('Edit'));
    fireEvent.click(editButton);

    // Verify edit form is displayed
    expect(screen.getByText('Edit Pipeline Stage')).toBeInTheDocument();

    // Edit the stage name
    fireEvent.change(screen.getByPlaceholderText('e.g., Qualified Lead'), { 
      target: { value: 'Updated Stage' } 
    });
    
    // Save the changes
    fireEvent.click(screen.getByText('Save'));
    
    // Verify supabase was called
    expect(supabaseAdmin.from).toHaveBeenCalledWith('deal_stages');
  });
}); 