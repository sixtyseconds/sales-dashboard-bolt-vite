import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';

export function useDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const { userData } = useUser();

  const fetchDeals = useCallback(async () => {
    if (!userData?.id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          deal_stages (id, name, color, default_probability),
          deal_activities (id, activity_type, notes, due_date, completed),
          companies (
            id, 
            name, 
            domain, 
            size, 
            industry, 
            website, 
            linkedin_url
          ),
          contacts:contacts!deals_primary_contact_id_fkey (
            id, 
            first_name, 
            last_name, 
            full_name,
            email, 
            phone, 
            title, 
            linkedin_url,
            is_primary
          ),
          deal_contacts (
            id,
            role,
            contacts (
              id,
              first_name,
              last_name,
              full_name,
              email,
              phone,
              title,
              is_primary
            )
          )
        `)
        .eq('owner_id', userData.id)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      // Calculate time in stage for each deal
      const dealsWithTimeInStage = data.map(deal => {
        const stageChangedDate = new Date(deal.stage_changed_at);
        const currentDate = new Date();
        const daysInStage = Math.floor((currentDate - stageChangedDate) / (1000 * 60 * 60 * 24));
        
        return {
          ...deal,
          daysInStage,
          // Setup warning levels
          timeStatus: daysInStage > 14 ? 'danger' : daysInStage > 7 ? 'warning' : 'normal'
        };
      });
      
      console.log('🔍 Enhanced deals with CRM relationships loaded:', {
        totalDeals: dealsWithTimeInStage.length,
        dealsWithCompanies: dealsWithTimeInStage.filter(d => d.companies).length,
        dealsWithContacts: dealsWithTimeInStage.filter(d => d.contacts).length,
        dealsWithMultipleContacts: dealsWithTimeInStage.filter(d => d.deal_contacts && d.deal_contacts.length > 1).length
      });
      
      setDeals(dealsWithTimeInStage);
    } catch (err) {
      console.error('Error fetching deals:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [userData?.id]);
  
  useEffect(() => {
    fetchDeals();
    
    // Setup realtime subscription
    let subscription;
    if (userData?.id) {
      subscription = supabase
        .channel('deal_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'deals',
          filter: `owner_id=eq.${userData.id}` 
        }, () => {
          fetchDeals();
        })
        .subscribe();
    }
      
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [fetchDeals, userData?.id]);
  
  const createDeal = async (dealData: any) => {
    if (!userData?.id) return null;
    
    try {
      setError(null);
      
      // Add owner_id and stage_changed_at to the data
      const newDeal = {
        ...dealData,
        owner_id: userData.id,
        stage_changed_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('deals')
        .insert(newDeal)
        .select(`
          *,
          deal_stages (id, name, color, default_probability),
          companies (id, name, domain, size, industry),
          contacts:contacts!deals_primary_contact_id_fkey (
            id, first_name, last_name, full_name, email, phone, title, is_primary
          )
        `)
        .single();
        
      if (error) throw error;
      
      // Add entry to deal_stage_history
      await supabase.from('deal_stage_history').insert({
        deal_id: data.id,
        stage_id: data.stage_id,
        user_id: userData.id
      });
      
      // Create deal-contact relationship if primary_contact_id is provided
      if (data.primary_contact_id) {
        await supabase.from('deal_contacts').insert({
          deal_id: data.id,
          contact_id: data.primary_contact_id,
          role: 'decision_maker'
        }).select();
      }
      
      // Optimistic update to avoid waiting for the subscription
      setDeals(prevDeals => [
        { 
          ...data, 
          daysInStage: 0,
          timeStatus: 'normal',
          deal_activities: [],
          deal_contacts: data.primary_contact_id ? [{ 
            id: 'temp',
            role: 'decision_maker',
            contacts: data.contacts 
          }] : []
        },
        ...prevDeals
      ]);
      
      return data;
    } catch (err) {
      console.error('Error creating deal:', err);
      setError(err);
      return null;
    }
  };
  
  const updateDeal = async (id: string, updates: any) => {
    if (!userData?.id) return false;
    
    try {
      setError(null);
      
      // Check if stage is changing
      const deal = deals.find(d => d.id === id);
      const stageChanging = deal && updates.stage_id && deal.stage_id !== updates.stage_id;
      
      // If stage is changing, update the stage_changed_at field
      const updatedData = stageChanging 
        ? { ...updates, stage_changed_at: new Date().toISOString() }
        : updates;
      
      // --- Add Log --- 
      console.log('Data being sent to Supabase update:', JSON.stringify(updatedData, null, 2));
      // --- End Log --- 
      
      const { data, error } = await supabase
        .from('deals')
        .update(updatedData)
        .eq('id', id)
        .select(`
          *,
          deal_stages (id, name, color, default_probability),
          companies (id, name, domain, size, industry),
          contacts:contacts!deals_primary_contact_id_fkey (
            id, first_name, last_name, full_name, email, phone, title, is_primary
          ),
          deal_contacts (
            id,
            role,
            contacts (id, first_name, last_name, full_name, email, phone, title, is_primary)
          )
        `)
        .single();
        
      // --- Add Log ---
      console.log('Supabase update successful. Returned data:', data);
      // --- End Log ---

      if (error) {
         // --- Add Log --- 
         console.error('Supabase update error details:', error);
         // --- End Log ---
         throw error;
      }
      
      // If stage changed, add entry to stage history
      if (stageChanging) {
        // First close the previous stage entry
        await supabase
          .from('deal_stage_history')
          .update({ 
            exited_at: new Date().toISOString(),
            duration_seconds: Math.floor((new Date().getTime() - new Date(deal.stage_changed_at).getTime()) / 1000)
          })
          .eq('deal_id', id)
          .is('exited_at', null);
        
        // Then create a new stage entry
        await supabase.from('deal_stage_history').insert({
          deal_id: id,
          stage_id: updates.stage_id,
          user_id: userData.id
        });
      }
      
      // If primary_contact_id is being updated, update deal_contacts relationship
      if (updates.primary_contact_id && updates.primary_contact_id !== deal?.primary_contact_id) {
        // Remove existing primary contact relationship
        await supabase.from('deal_contacts')
          .delete()
          .eq('deal_id', id)
          .eq('role', 'decision_maker');
        
        // Add new primary contact relationship
        await supabase.from('deal_contacts').insert({
          deal_id: id,
          contact_id: updates.primary_contact_id,
          role: 'decision_maker'
        });
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
      
      return true;
    } catch (err) {
      console.error('Error updating deal:', err);
      setError(err);
      return false;
    }
  };
  
  const deleteDeal = async (id: string) => {
    if (!userData?.id) return false;
    
    try {
      setError(null);
      
      const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Optimistic update
      setDeals(prevDeals => prevDeals.filter(d => d.id !== id));
      
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