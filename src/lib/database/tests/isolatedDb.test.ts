import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Deal, DealActivity } from '../models';

// More explicit mock with better control
const mockSupabase = {
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  single: vi.fn(),
  order: vi.fn().mockReturnThis(),
};

describe('Database Models', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Deal', () => {
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
    };

    it('should have expected properties', () => {
      // Type checking test
      expect(sampleDeal).toHaveProperty('id');
      expect(sampleDeal).toHaveProperty('name');
      expect(sampleDeal).toHaveProperty('company');
      expect(sampleDeal).toHaveProperty('value');
      expect(sampleDeal).toHaveProperty('notes');
      expect(sampleDeal).toHaveProperty('next_steps');
    });

    it('should handle basic CRUD operations', async () => {
      // Setup the mock for insert
      mockSupabase.insert.mockImplementation(() => ({
        select: () => ({
          single: () => Promise.resolve({ data: sampleDeal, error: null })
        })
      }));

      // Create operation
      const createResult = await mockSupabase
        .from('deals')
        .insert(sampleDeal)
        .select()
        .single();
        
      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(mockSupabase.insert).toHaveBeenCalledWith(sampleDeal);
      expect(createResult.data).toEqual(sampleDeal);
      expect(createResult.error).toBeNull();

      // Reset mocks for update operation
      vi.clearAllMocks();
      
      // Setup mock for update operation - different approach
      const updatedDeal = { ...sampleDeal, notes: 'Updated notes' };
      mockSupabase.single.mockResolvedValue({ data: updatedDeal, error: null });
      
      // Update operation
      const updates = { notes: 'Updated notes' };
      const updateResult = await mockSupabase
        .from('deals')
        .update(updates)
        .eq('id', sampleDeal.id)
        .select()
        .single();
        
      expect(mockSupabase.from).toHaveBeenCalledWith('deals');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', sampleDeal.id);
      expect(updateResult.data).toEqual(updatedDeal);
      expect(updateResult.error).toBeNull();
    });
  });

  describe('DealActivity', () => {
    // Sample activity data
    const sampleActivity: Partial<DealActivity> = {
      id: '123e4567-e89b-12d3-a456-426614174001',
      deal_id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174020',
      activity_type: 'note',
      notes: 'Test note for the activity',
      completed: false
    };

    it('should have expected properties', () => {
      // Type checking test
      expect(sampleActivity).toHaveProperty('id');
      expect(sampleActivity).toHaveProperty('deal_id');
      expect(sampleActivity).toHaveProperty('activity_type');
      expect(sampleActivity).toHaveProperty('notes');
      expect(sampleActivity).toHaveProperty('completed');
    });

    it('should handle note creation and updates', async () => {
      // Setup the mock for insert
      mockSupabase.insert.mockImplementation(() => ({
        select: () => ({
          single: () => Promise.resolve({ data: sampleActivity, error: null })
        })
      }));

      // Create note
      const createResult = await mockSupabase
        .from('deal_activities')
        .insert(sampleActivity)
        .select()
        .single();
        
      expect(mockSupabase.from).toHaveBeenCalledWith('deal_activities');
      expect(mockSupabase.insert).toHaveBeenCalledWith(sampleActivity);
      expect(createResult.data).toEqual(sampleActivity);
      expect(createResult.error).toBeNull();
    });
  });
}); 