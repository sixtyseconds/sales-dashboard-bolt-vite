import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PipelineColumn } from '../components/Pipeline/PipelineColumn';
import { DndContext } from '@dnd-kit/core';

// Mock formatCurrency utility
vi.mock('../lib/utils', () => ({
  cn: vi.fn((...args) => args.join(' ')),
  formatCurrency: vi.fn((value) => `$${value}`)
}));

describe('PipelineColumn Component', () => {
  const mockStage = {
    id: 'stage-1',
    name: 'Qualified',
    color: '#8B5CF6',
    default_probability: 25
  };
  
  const mockDeals = [
    { id: 'deal-1', name: 'Deal 1', value: 1000 },
    { id: 'deal-2', name: 'Deal 2', value: 2000 }
  ];
  
  const renderWithDndContext = (ui: React.ReactElement) => {
    return render(
      <DndContext>
        {ui}
      </DndContext>
    );
  };
  
  it('renders column with stage name', () => {
    renderWithDndContext(
      <PipelineColumn
        stage={mockStage}
        deals={[]}
        onDealClick={() => {}}
        onAddDealClick={() => {}}
      />
    );
    
    expect(screen.getByText('Qualified')).toBeInTheDocument();
  });
  
  it('displays the correct number of deals', () => {
    renderWithDndContext(
      <PipelineColumn
        stage={mockStage}
        deals={mockDeals}
        onDealClick={() => {}}
        onAddDealClick={() => {}}
      />
    );
    
    expect(screen.getByText('2')).toBeInTheDocument();
  });
  
  it('calculates and displays weighted sum correctly', () => {
    renderWithDndContext(
      <PipelineColumn
        stage={mockStage}
        deals={mockDeals}
        onDealClick={() => {}}
        onAddDealClick={() => {}}
      />
    );
    
    // Total value should be $3000
    expect(screen.getByText('$3000')).toBeInTheDocument();
    
    // Weighted value should be $750 (25% of $3000)
    expect(screen.getByText('$750')).toBeInTheDocument();
    
    // Should show the probability percentage
    expect(screen.getByText('Weighted (25%):')).toBeInTheDocument();
  });
  
  it('does not show weighted sum when there are no deals', () => {
    renderWithDndContext(
      <PipelineColumn
        stage={mockStage}
        deals={[]}
        onDealClick={() => {}}
        onAddDealClick={() => {}}
      />
    );
    
    expect(screen.queryByText('Total Value:')).not.toBeInTheDocument();
    expect(screen.queryByText('Weighted')).not.toBeInTheDocument();
  });
}); 