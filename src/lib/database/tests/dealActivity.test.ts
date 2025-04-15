import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/lib/supabase/client';
import { DealActivity } from '../models';

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

describe('Deal Activity Database Operations', () => {
  // Sample deal activity data
  const sampleActivity: Partial<DealActivity> = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    deal_id: '123e4567-e89b-12d3-a456-426614174000',
    user_id: '123e4567-e89b-12d3-a456-426614174020',
    activity_type: 'note',
    notes: 'Test note for the activity',
    completed: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Deal Activity', () => {
    it('should create a new activity with required fields', async () => {
      // Setup the mock to return success
      supabase.from('deal_activities').insert.mockImplementation(() => ({
        select: () => ({
          single: () => Promise.resolve({ data: sampleActivity, error: null })
        })
      }));

      // Function that would use our models to create an activity
      const createActivity = async (activityData: Partial<DealActivity>) => {
        const { data, error } = await supabase
          .from('deal_activities')
          .insert(activityData)
          .select()
          .single();
          
        return { data, error };
      };

      // Test the function
      const { data, error } = await createActivity(sampleActivity);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('deal_activities');
      expect(supabase.insert).toHaveBeenCalledWith(sampleActivity);
      
      // Verify result
      expect(error).toBeNull();
      expect(data).toEqual(sampleActivity);
    });

    it('should fail when required fields are missing', async () => {
      // Setup the mock to return an error
      const errorMessage = 'Field activity_type cannot be null';
      supabase.from('deal_activities').insert.mockImplementation(() => ({
        select: () => ({
          single: () => Promise.resolve({ 
            data: null, 
            error: { message: errorMessage } 
          })
        })
      }));

      // Missing activity_type field
      const incompleteActivity = { 
        deal_id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '123e4567-e89b-12d3-a456-426614174020',
        notes: 'Incomplete activity'
      };

      // Function that would use our models to create an activity
      const createActivity = async (activityData: Partial<DealActivity>) => {
        const { data, error } = await supabase
          .from('deal_activities')
          .insert(activityData)
          .select()
          .single();
          
        return { data, error };
      };

      // Test the function
      const { data, error } = await createActivity(incompleteActivity);
      
      // Verify error handling
      expect(data).toBeNull();
      expect(error).toEqual({ message: errorMessage });
    });
  });

  describe('Update Deal Activity', () => {
    it('should update activity fields including notes and completion status', async () => {
      // Setup the mock to return success
      const updatedActivity = {
        ...sampleActivity,
        notes: 'Updated activity notes',
        completed: true
      };
      
      supabase.from('deal_activities').update.mockImplementation(() => ({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({ data: updatedActivity, error: null })
          })
        })
      }));

      // Function that would use our models to update an activity
      const updateActivity = async (id: string, updates: Partial<DealActivity>) => {
        const { data, error } = await supabase
          .from('deal_activities')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
          
        return { data, error };
      };

      // Updates to apply
      const updates = {
        notes: 'Updated activity notes',
        completed: true
      };

      // Test the function
      const { data, error } = await updateActivity(sampleActivity.id!, updates);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('deal_activities');
      expect(supabase.update).toHaveBeenCalledWith(updates);
      expect(supabase.eq).toHaveBeenCalledWith('id', sampleActivity.id);
      
      // Verify result
      expect(error).toBeNull();
      expect(data).toEqual(updatedActivity);
    });
  });

  describe('Delete Deal Activity', () => {
    it('should delete an activity by ID', async () => {
      // Setup the mock to return success
      supabase.from('deal_activities').delete.mockImplementation(() => ({
        eq: () => Promise.resolve({ error: null })
      }));

      // Function that would use our models to delete an activity
      const deleteActivity = async (id: string) => {
        const { error } = await supabase
          .from('deal_activities')
          .delete()
          .eq('id', id);
          
        return { success: !error, error };
      };

      // Test the function
      const { success, error } = await deleteActivity(sampleActivity.id!);
      
      // Verify Supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('deal_activities');
      expect(supabase.delete).toHaveBeenCalled();
      expect(supabase.eq).toHaveBeenCalledWith('id', sampleActivity.id);
      
      // Verify result
      expect(error).toBeNull();
      expect(success).toBe(true);
    });
  });
}); 