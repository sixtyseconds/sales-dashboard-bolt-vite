import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export interface UserTargets {
  id: string;
  user_id: string;
  revenue_target: number;
  outbound_target: number;
  meetings_target: number;
  proposal_target: number;
  start_date: string;
  end_date: string;
}

async function fetchTargets(userId: string | undefined) {
  if (!userId) return null;

  // First try to get existing target
  let { data, error } = await supabase
    .from('targets')
    .select('*')
    .eq('user_id', userId)
    .order('start_date', { ascending: false })
    .limit(1);

  if (error) throw error;

  // If no target exists, create default target
  if (!data || data.length === 0) {
    const currentDate = new Date();
    const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const defaultTarget = {
      user_id: userId,
      revenue_target: 20000,
      outbound_target: 100,
      meetings_target: 20,
      proposal_target: 15,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    };

    const { data: newTarget, error: createError } = await supabase
      .from('targets')
      .insert([defaultTarget])
      .select()
      .single();

    if (createError) throw createError;
    return newTarget;
  }

  return data[0];
}

async function createTarget(target: Omit<UserTargets, 'id'>) {
  const { data, error } = await supabase
    .from('targets')
    .insert([target])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useTargets(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['targets', userId],
    queryFn: () => fetchTargets(userId),
    enabled: !!userId,
  });

  const createTargetMutation = useMutation({
    mutationFn: createTarget,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['targets'] });
    },
  });

  return {
    data,
    isLoading,
    createTarget: createTargetMutation.mutate,
  };
}