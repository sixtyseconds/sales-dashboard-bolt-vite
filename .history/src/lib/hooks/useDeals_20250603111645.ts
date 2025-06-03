import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useUser } from '@/lib/hooks/useUser';
import type { RealtimeChannel } from '@supabase/supabase-js';

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
      
      // Use a simpler query first to avoid relationship issues
      const { data, error } = await supabase
        .from('deals')
        .select(`
          *,
          deal_stages (id, name, color, default_probability),
          deal_activities (id, activity_type, notes, due_date, completed)
        `)
        .eq('owner_id', userData.id)
        .order('updated_at', { ascending: false });
        
      if (error) throw error;
      
      // Manually fetch related data to avoid schema cache issues
      const dealsWithRelations = await Promise.all(
        data.map(async (deal) => {
          const stageChangedDate = new Date(deal.stage_changed_at);
          const currentDate = new Date();
          const daysInStage = Math.floor((currentDate.getTime() - stageChangedDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let companies = null;
          let contacts = null;
          let deal_contacts: any[] = [];
          
          // Fetch company if company_id exists
          if (deal.company_id) {
            const { data: companyData } = await supabase
              .from('companies')
              .select('id, name, domain, size, industry, website, linkedin_url')
              .eq('id', deal.company_id)
              .single();
            companies = companyData;
          }
          
          // Fetch primary contact if primary_contact_id exists
          if (deal.primary_contact_id) {
            const { data: contactData } = await supabase
              .from('contacts')
              .select('id, first_name, last_name, full_name, email, phone, title, linkedin_url, is_primary')
              .eq('id', deal.primary_contact_id)
              .single();
            contacts = contactData;
          }
          
          // Fetch all deal contacts
          if (deal.id) {
            const { data: dealContactsData } = await supabase
              .from('deal_contacts')
              .select(`
                id,
                role,
                contacts (id, first_name, last_name, full_name, email, phone, title, is_primary)
              `)
              .eq('deal_id', deal.id);
            deal_contacts = dealContactsData || [];
          }
          
          return {
            ...deal,
            daysInStage,
            timeStatus: daysInStage > 14 ? 'danger' : daysInStage > 7 ? 'warning' : 'normal',
            companies,
            contacts,
            deal_contacts
          };
        })
      );
      
      console.log('🔍 Enhanced deals with CRM relationships loaded:', {
        totalDeals: dealsWithRelations.length,
        dealsWithCompanies: dealsWithRelations.filter(d => d.companies).length,
        dealsWithContacts: dealsWithRelations.filter(d => d.contacts).length,
        dealsWithMultipleContacts: dealsWithRelations.filter(d => d.deal_contacts && d.deal_contacts.length > 1).length,
        sampleDeal: dealsWithRelations[0] ? {
          id: dealsWithRelations[0].id,
          name: dealsWithRelations[0].name,
          hasCompanies: !!dealsWithRelations[0].companies,
          hasContacts: !!dealsWithRelations[0].contacts,
          companiesData: dealsWithRelations[0].companies,
          contactsData: dealsWithRelations[0].contacts
        } : null
      });
      
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
    
    // Setup realtime subscription
    let subscription: RealtimeChannel | null = null;
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
        .select('*')
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
      
      // Fetch deal stages for the new deal
      const { data: stageData } = await supabase
        .from('deal_stages')
        .select('id, name, color, default_probability')
        .eq('id', data.stage_id)
        .single();
      
      // Optimistic update with basic structure
      const newDealWithRelations = {
        ...data,
        daysInStage: 0,
        timeStatus: 'normal' as const,
        deal_activities: [],
        deal_stages: stageData,
        companies: null,
        contacts: null,
        deal_contacts: []
      };
      
      setDeals(prevDeals => [newDealWithRelations, ...prevDeals]);
      
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
        .select('*')
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