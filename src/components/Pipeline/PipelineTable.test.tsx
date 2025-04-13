import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PipelineTable } from './PipelineTable';
import { usePipeline } from '@/lib/contexts/PipelineContext';

// Mock the PipelineContext
jest.mock('@/lib/contexts/PipelineContext', () => ({
  usePipeline: jest.fn(),
}));

describe('PipelineTable', () => {
  const mockDeals = [
    {
      id: 'deal1',
      name: 'Software License Deal',
      company: 'Acme Corp',
      value: 10000,
      stage_id: 'stage1',
      probability: 50,
      contact_name: 'John Doe',
      created_at: '2023-01-15T12:00:00Z',
      description: 'Enterprise software license deal',
      contact_email: 'john@acme.com',
      contact_phone: '123-456-7890'
    },
    {
      id: 'deal2',
      name: 'Hardware Purchase',
      company: 'XYZ Ltd',
      value: 25000,
      stage_id: 'stage2',
      probability: 75,
      contact_name: 'Jane Smith',
      created_at: '2023-02-20T12:00:00Z',
      description: 'Server hardware purchase',
      contact_email: 'jane@xyz.com',
      contact_phone: '987-654-3210'
    }
  ];

  const mockStages = [
    { id: 'stage1', name: 'Qualified Lead' },
    { id: 'stage2', name: 'Proposal' },
    { id: 'stage3', name: 'Closed Won' }
  ];

  const mockDeleteDeal = jest.fn();
  const mockOnDealClick = jest.fn();
  const mockOnDeleteDeal = jest.fn();

  beforeEach(() => {
    // Set up the mock implementation
    (usePipeline as jest.Mock).mockReturnValue({
      deals: mockDeals,
      stages: mockStages,
      searchTerm: '',
      filterOptions: {
        minValue: null,
        maxValue: null,
        probability: null,
        tags: []
      },
      deleteDeal: mockDeleteDeal
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the table with deal data', () => {
    render(
      <PipelineTable 
        onDealClick={mockOnDealClick} 
        onDeleteDeal={mockOnDeleteDeal} 
      />
    );

    // Check if company names are displayed
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('XYZ Ltd')).toBeInTheDocument();
    
    // Check stage names
    expect(screen.getByText('Qualified Lead')).toBeInTheDocument();
    expect(screen.getByText('Proposal')).toBeInTheDocument();
    
    // Check probabilities
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    
    // Check contact names
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('expands a row when clicked', async () => {
    render(
      <PipelineTable 
        onDealClick={mockOnDealClick} 
        onDeleteDeal={mockOnDeleteDeal} 
      />
    );

    // Click on the first row
    fireEvent.click(screen.getByText('Acme Corp'));
    
    // Check if the expanded content is visible
    await waitFor(() => {
      expect(screen.getByText('Deal Details')).toBeInTheDocument();
      expect(screen.getByText('Enterprise software license deal')).toBeInTheDocument();
      expect(screen.getByText('john@acme.com')).toBeInTheDocument();
    });
  });

  it('calls onDealClick when edit button is clicked', () => {
    render(
      <PipelineTable 
        onDealClick={mockOnDealClick} 
        onDeleteDeal={mockOnDeleteDeal} 
      />
    );

    // Find all edit buttons and click the first one
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);
    
    // Check if onDealClick was called with the correct deal
    expect(mockOnDealClick).toHaveBeenCalledWith(mockDeals[0]);
  });

  it('filters deals based on search term', () => {
    // Change the mock to include a search term
    (usePipeline as jest.Mock).mockReturnValue({
      deals: mockDeals,
      stages: mockStages,
      searchTerm: 'xyz',
      filterOptions: {
        minValue: null,
        maxValue: null,
        probability: null,
        tags: []
      },
      deleteDeal: mockDeleteDeal
    });

    render(
      <PipelineTable 
        onDealClick={mockOnDealClick} 
        onDeleteDeal={mockOnDeleteDeal} 
      />
    );

    // Only XYZ Ltd should be visible
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    expect(screen.getByText('XYZ Ltd')).toBeInTheDocument();
  });

  it('filters deals based on value filters', () => {
    // Change the mock to include a min value filter
    (usePipeline as jest.Mock).mockReturnValue({
      deals: mockDeals,
      stages: mockStages,
      searchTerm: '',
      filterOptions: {
        minValue: 20000,
        maxValue: null,
        probability: null,
        tags: []
      },
      deleteDeal: mockDeleteDeal
    });

    render(
      <PipelineTable 
        onDealClick={mockOnDealClick} 
        onDeleteDeal={mockOnDeleteDeal} 
      />
    );

    // Only the deal with value > 20000 should be visible
    expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    expect(screen.getByText('XYZ Ltd')).toBeInTheDocument();
  });
}); 