import { useState, useEffect, useCallback } from 'react';
import { neonClient } from '@/lib/database/neonClient';
import { useUser } from '@/lib/hooks/useUser';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function useDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { userData } = useUser();

  const fetchDeals = useCallback(async () => {
    // Use mock user for development
    const userId = userData?.id || 'dev-user-123';
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('🔍 Fetching deals from Neon database...');
      
      // Use our enhanced Neon client method
      const { data: dealsWithRelations, error: fetchError } = await neonClient.getDealsWithRelationships(userId);
      
      if (fetchError) throw fetchError;
      
      console.log(`✅ Loaded ${dealsWithRelations.length} deals with CRM relationships`);
      
      setDeals(dealsWithRelations);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.id]);
  
  useEffect(() => {
    fetchDeals();
    
    // Note: Real-time subscriptions disabled for development
    // In production, you would set up Supabase subscriptions here
    console.log('📝 Real-time subscriptions disabled for Neon development mode');
      
    return () => {
      // No cleanup needed for development mode
    };
  }, [fetchDeals]);
  
  const createDeal = async (dealData: any) => {
    const userId = userData?.id || 'dev-user-123';
    
    try {
      setError(null);
      
      // Add owner_id and stage_changed_at to the data
      const newDeal = {
        ...dealData,
        owner_id: userId,
        stage_changed_at: new Date().toISOString(),
        status: 'active'
      };
      
      console.log('🔧 Creating deal in Neon database...', newDeal);
      
      // Insert the deal
      const query = `
        INSERT INTO deals (
          name, company, contact_name, contact_email, contact_phone, value, description, 
          notes, stage_id, owner_id, expected_close_date, probability, status, 
          stage_changed_at, company_id, primary_contact_id, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *
      `;
      
      const values = [
        newDeal.name,
        newDeal.company || '',
        newDeal.contact_name || null,
        newDeal.contact_email || null,
        newDeal.contact_phone || null,
        newDeal.value || 0,
        newDeal.description || null,
        newDeal.notes || null,
        newDeal.stage_id,
        newDeal.owner_id,
        newDeal.expected_close_date || null,
        newDeal.probability || null,
        newDeal.status,
        newDeal.stage_changed_at,
        newDeal.company_id || null,
        newDeal.primary_contact_id || null
      ];
      
      const result = await neonClient.query(query, values);
      const createdDeal = result.rows[0];
      
      // Add entry to deal_stage_history
      await neonClient.query(
        'INSERT INTO deal_stage_history (deal_id, stage_id, user_id, entered_at) VALUES ($1, $2, $3, NOW())',
        [createdDeal.id, createdDeal.stage_id, userId]
      );
      
      // Create deal-contact relationship if primary_contact_id is provided
      if (createdDeal.primary_contact_id) {
        await neonClient.query(
          'INSERT INTO deal_contacts (deal_id, contact_id, role, created_at) VALUES ($1, $2, $3, NOW())',
          [createdDeal.id, createdDeal.primary_contact_id, 'decision_maker']
        );
      }
      
      // Optimistic update
      const enhancedDeal = {
        ...createdDeal,
        daysInStage: 0,
        timeStatus: 'normal' as const,
        deal_activities: [],
        deal_stages: null,
        companies: null,
        contacts: null,
        deal_contacts: []
      };
      
      setDeals(prevDeals => [enhancedDeal, ...prevDeals]);
      
      console.log('✅ Deal created successfully');
      return createdDeal;
    } catch (err) {
      console.error('Error creating deal:', err);
      setError(err);
      return null;
    }
  };
  
  const updateDeal = async (id: string, updates: any) => {
    const userId = userData?.id || 'dev-user-123';
    
    try {
      setError(null);
      
      // Check if stage is changing
      const deal = deals.find(d => d.id === id);
      const stageChanging = deal && updates.stage_id && deal.stage_id !== updates.stage_id;
      
      // If stage is changing, update the stage_changed_at field
      const updatedData = stageChanging 
        ? { ...updates, stage_changed_at: new Date().toISOString() }
        : updates;
      
      console.log('🔧 Updating deal in Neon database...', updatedData);
      
      // Build dynamic UPDATE query
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      Object.entries(updatedData).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at') {
          setParts.push(`${key} = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      });

      setParts.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE deals 
        SET ${setParts.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await neonClient.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Deal not found');
      }

      const data = result.rows[0];
      
      // If stage changed, add entry to stage history
      if (stageChanging) {
        // First close the previous stage entry
        await neonClient.query(
          `UPDATE deal_stage_history 
           SET exited_at = NOW(), 
               duration_seconds = EXTRACT(EPOCH FROM (NOW() - entered_at))::INTEGER
           WHERE deal_id = $1 AND exited_at IS NULL`,
          [id]
        );
        
        // Then create a new stage entry
        await neonClient.query(
          'INSERT INTO deal_stage_history (deal_id, stage_id, user_id, entered_at) VALUES ($1, $2, $3, NOW())',
          [id, updates.stage_id, userId]
        );
      }
      
      // If primary_contact_id is being updated, update deal_contacts relationship
      if (updates.primary_contact_id && updates.primary_contact_id !== deal?.primary_contact_id) {
        // Remove existing primary contact relationship
        await neonClient.query(
          'DELETE FROM deal_contacts WHERE deal_id = $1 AND role = $2',
          [id, 'decision_maker']
        );
        
        // Add new primary contact relationship
        await neonClient.query(
          'INSERT INTO deal_contacts (deal_id, contact_id, role, created_at) VALUES ($1, $2, $3, NOW())',
          [id, updates.primary_contact_id, 'decision_maker']
        );
      }
      
      // Optimistic update
      setDeals(prevDeals => 
        prevDeals.map(d => {
          if (d.id === id) {
            const updatedDeal = { ...d, ...data };
            
            // If stage changed, reset days in stage
            if (stageChanging) {
              updatedDeal.daysInStage = 0;
              updatedDeal.timeStatus = 'normal';
            }
            
            return updatedDeal;
          }
          return d;
        })
      );
      
      console.log('✅ Deal updated successfully');
      return true;
    } catch (err) {
      console.error('Error updating deal:', err);
      setError(err);
      return false;
    }
  };
  
  const deleteDeal = async (id: string) => {
    try {
      setError(null);
      
      console.log('🗑️ Deleting deal from Neon database...');
      
      await neonClient.query('DELETE FROM deals WHERE id = $1', [id]);
      
      // Optimistic update
      setDeals(prevDeals => prevDeals.filter(d => d.id !== id));
      
      console.log('✅ Deal deleted successfully');
      return true;
    } catch (err) {
      console.error('Error deleting deal:', err);
      setError(err);
      return false;
    }
  };
  
  const moveDealToStage = async (dealId: string, newStageId: string) => {
    return updateDeal(dealId, { stage_id: newStageId });
  };

  return {
    deals,
    isLoading,
    error,
    createDeal,
    updateDeal,
    deleteDeal,
    moveDealToStage,
    refreshDeals: fetchDeals
  };
} 