import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase/client';
import { Deal } from '../models';

// Mock the Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    order: vi.fn().mockReturnThis(),
  }
}));

describe('Deal Database Operations', () => {
  // Sample deal data
  const sampleDeal: Partial<Deal> = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'Test Deal',
    company: 'Acme Inc',
    value: 10000,
    stage_id: '123e4567-e89b-12d3-a456-426614174010',
    owner_id: '123e4567-e89b-12d3-a456-426614174020',
    notes: 'This is a test note',
    next_steps: 'Follow up next week',
    probability: 50,
    status: 'active'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Deal', () => {
    it('should create a new deal with required fields', async () => {
      // Setup the mock to return success
      supabase.from('deals').insert.mockImplementation(() => ({
        select: () => ({
          single: () => Promise.resolve({ data: sampleDeal, error: null })
        })
      }));

      // Function that would use our models to create a deal
      const createDeal = async (dealData: Partial<Deal>) => {
        const { data, error } = await supabase
          .from('deals')
          .insert(dealData)
          .select()
          .single();
          
        return { data, error };
      };

      // Test the function
      const { data, error } = await createDeal(sampleDeal);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(supabase.insert).toHaveBeenCalledWith(sampleDeal);
      
      // Verify result
      expect(error).toBeNull();
      expect(data).toEqual(sampleDeal);
    });

    it('should fail when required fields are missing', async () => {
      // Setup the mock to return an error
      const errorMessage = 'Field company cannot be null';
      supabase.from('deals').insert.mockImplementation(() => ({
        select: () => ({
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: errorMessage } 
          })
        })
      }));

      // Missing company field
      const incompleteDeal = { 
        name: 'Incomplete Deal',
        value: 5000,
        stage_id: '123e4567-e89b-12d3-a456-426614174010',
        owner_id: '123e4567-e89b-12d3-a456-426614174020'
      };

      // Function that would use our models to create a deal
      const createDeal = async (dealData: Partial<Deal>) => {
        const { data, error } = await supabase
          .from('deals')
          .insert(dealData)
          .select()
          .single();
          
        return { data, error };
      };

      // Test the function
      const { data, error } = await createDeal(incompleteDeal);
      
      // Verify error handling
      expect(data).toBeNull();
      expect(error).toEqual({ message: errorMessage });
    });
  });

  describe('Update Deal', () => {
    it('should update deal fields including notes and next_steps', async () => {
      // Setup the mock to return success
      const updatedDeal = {
        ...sampleDeal,
        notes: 'Updated note content',
        next_steps: 'Send proposal by Friday'
      };
      
      supabase.from('deals').update.mockImplementation(() => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updatedDeal, error: null })
          })
        })
      }));

      // Function that would use our models to update a deal
      const updateDeal = async (id: string, updates: Partial<Deal>) => {
        const { data, error } = await supabase
          .from('deals')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
          
        return { data, error };
      };

      // Updates to apply
      const updates = {
        notes: 'Updated note content',
        next_steps: 'Send proposal by Friday'
      };

      // Test the function
      const { data, error } = await updateDeal(sampleDeal.id!, updates);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('deals');
      expect(supabase.update).toHaveBeenCalledWith(updates);
      expect(supabase.eq).toHaveBeenCalledWith('id', sampleDeal.id);
      
      // Verify result
      expect(error).toBeNull();
      expect(data).toEqual(updatedDeal);
    });
  });
}); 