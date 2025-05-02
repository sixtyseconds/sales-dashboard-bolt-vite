import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { toast } from 'sonner';

// Define the Target structure accurately
export interface Target {
  id?: string; // ID is optional for new targets
  user_id?: string; // user_id might not be present on client-side objects initially
  revenue_target: number | null;
  outbound_target: number | null;
  meetings_target: number | null;
  proposal_target: number | null;
  start_date: string | null; // Assuming YYYY-MM-DD string format from input
  end_date: string | null;   // Assuming YYYY-MM-DD string format from input
  created_at?: string;
  updated_at?: string;
  created_by?: string | null; // Add creator field
  closed_by?: string | null;  // Add closer field
  previous_target_id?: string | null; // Add previous link field
}

// Update User interface to use the Target array type
export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  stage: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  targets: Target[]; // Change to non-optional, default to [] later
}

// Fetch users with properly structured targets
async function fetchUsers(): Promise<User[]> {
  // Fetch profiles and their associated targets. Use a left join implicitly.
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      email,
      first_name,
      last_name,
      stage,
      avatar_url,
      is_admin,
      created_at,
      targets (
        id,
        revenue_target,
        outbound_target,
        meetings_target,
        proposal_target,
        start_date,
        end_date,
        created_at,
        updated_at,
        created_by,
        closed_by,
        previous_target_id
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    throw error;
  }

  // Ensure targets is always an array, even if null/undefined from DB
  const usersWithEnsuredTargets = data?.map(user => ({
    ...user,
    targets: user.targets || [],
  })) || [];

  // Now cast to User[]
  return usersWithEnsuredTargets as User[];
}

// Helper function to compare target data (excluding id, user_id, created_at, updated_at)
function targetsAreEqual(t1: Target, t2: Target): boolean {
  return (
    t1.revenue_target === t2.revenue_target &&
    t1.outbound_target === t2.outbound_target &&
    t1.meetings_target === t2.meetings_target &&
    t1.proposal_target === t2.proposal_target &&
    // Normalize date strings for comparison, handle nulls
    (t1.start_date || '') === (t2.start_date || '') &&
    (t1.end_date || '') === (t2.end_date || '')
  );
}

// Refactored updateUser function for historical tracking & detailed auditing
async function updateUser(userId: string, updates: Partial<User>) {
  console.log('[updateUser HISTORICAL AUDIT V2] Called with:', { userId, updates });

  // Get Current Admin User ID
  const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
  if (authError || !adminUser) {
    console.error("[updateUser HISTORICAL AUDIT V2] Error fetching admin user:", authError);
    throw new Error("Could not identify the authenticated user performing the action.");
  }
  const adminUserId = adminUser.id;
  console.log(`[updateUser HISTORICAL AUDIT V2] Action performed by admin user: ${adminUserId}`);

  let profileUpdates = { ...updates };
  let targetError: Error | null = null;
  const now = new Date().toISOString();

  if (profileUpdates.targets) {
    const submittedTargets: Target[] = profileUpdates.targets;
    console.log('[updateUser HISTORICAL AUDIT V2] Processing targets:', submittedTargets);
    delete profileUpdates.targets;

    try {
      // 1. Fetch currently active targets (unchanged)
      console.log(`[updateUser HISTORICAL AUDIT V2] Fetching active targets for user: ${userId}`);
      const { data: activeDbTargets, error: fetchError } = await supabase
      .from('targets')
        .select('*')
        .eq('user_id', userId)
        .lte('start_date', now)
        .or(`end_date.is.null,end_date.gt.${now}`);

      if (fetchError) {
        console.error('[updateUser HISTORICAL AUDIT V2] Error fetching active targets:', fetchError);
        throw fetchError;
      }
      const activeTargetsMap = new Map(activeDbTargets?.map(t => [t.id, t]) || []);
      console.log('[updateUser HISTORICAL AUDIT V2] Active DB targets fetched:', activeDbTargets);

      const operations = [];
      const submittedTargetIds = new Set<string>();

      // 2. Process submitted targets
      for (const submittedTarget of submittedTargets) {
        if (!submittedTarget.id || submittedTarget.id.startsWith('new_')) {
          // --- Target to INSERT (New) ---
          console.log('[updateUser HISTORICAL AUDIT V2] Identifying INSERT:', submittedTarget);
          const { id, ...insertData } = submittedTarget;
          operations.push(
            supabase.from('targets').insert({
              ...insertData,
              user_id: userId,
              created_by: adminUserId // Set creator
              // closed_by remains NULL
            })
          );
        } else {
          submittedTargetIds.add(submittedTarget.id);
          const existingActiveTarget = activeTargetsMap.get(submittedTarget.id);

          if (existingActiveTarget) {
            if (!targetsAreEqual(submittedTarget, existingActiveTarget)) {
              console.log(`[updateUser HISTORICAL AUDIT V2 - LINKING] Identifying UPDATE for ID ${submittedTarget.id}: Closing old, Inserting new.`);
              // --- Target to CLOSE (due to update) ---
              operations.push(
                supabase.from('targets').update({
                  end_date: now,
                  closed_by: adminUserId // Set closer
                  // created_by is NOT changed
                }).eq('id', submittedTarget.id)
              );
              // --- Target to INSERT (the updated version with link) ---
              const { id, ...insertData } = submittedTarget;
              operations.push(
                supabase.from('targets').insert({
                  ...insertData,
                  user_id: userId,
                  created_by: adminUserId,
                  previous_target_id: existingActiveTarget.id
                })
              );
            } else {
              console.log(`[updateUser HISTORICAL AUDIT V2 - LINKING] Target ID ${submittedTarget.id} submitted but identical. No change.`);
            }
          } else {
            console.warn(`[updateUser HISTORICAL AUDIT V2 - LINKING] Submitted target ID ${submittedTarget.id} not active. Ignoring.`);
          }
        }
      }

      // 3. Process active targets not submitted (UI deletions)
      for (const [id] of activeTargetsMap.entries()) {
        if (!submittedTargetIds.has(id)) {
          // --- Target to CLOSE (due to UI deletion) ---
          console.log(`[updateUser HISTORICAL AUDIT V2] Identifying CLOSE for ID ${id} (deleted in UI).`);
          operations.push(
            supabase.from('targets').update({
              end_date: now,
              closed_by: adminUserId // Set closer
              // created_by is NOT changed
            }).eq('id', id)
          );
        }
      }

      // 4. Execute all DB operations
      if (operations.length > 0) {
        console.log('[updateUser HISTORICAL AUDIT V2] Executing DB operations...', operations.length);
        const results = await Promise.all(operations);
        console.log('[updateUser HISTORICAL AUDIT V2] DB operations results:', results);
        results.forEach(result => {
          if (result.error) {
            console.error('[updateUser HISTORICAL AUDIT V2] Target DB operation failed:', result.error);
            if (!targetError) targetError = result.error;
          }
        });
      } else {
        console.log('[updateUser HISTORICAL AUDIT V2] No target DB operations needed.');
      }

    if (targetError) throw targetError;
      console.log('[updateUser HISTORICAL AUDIT V2] Target operations successful.');

    } catch (error) {
      console.error("[updateUser HISTORICAL AUDIT V2] Error processing targets:", error);
      targetError = error instanceof Error ? error : new Error(String(error));
    }
  } else {
    console.log('[updateUser HISTORICAL AUDIT V2] No targets included in updates.');
  }

  // 5. Update profile data (remains the same)
  let profileError: Error | null = null;
  if (Object.keys(profileUpdates).length > 0) {
    console.log('[updateUser HISTORICAL AUDIT V2] Updating profile with:', profileUpdates);
    try {
      const { data: profileUpdateData, error } = await supabase
      .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)
        .select();
      console.log('[updateUser HISTORICAL AUDIT V2] Profile update result:', { profileUpdateData, error });
    if (error) throw error;
    } catch(error) {
      console.error("[updateUser HISTORICAL AUDIT V2] Error updating profile:", error);
      profileError = error instanceof Error ? error : new Error(String(error));
    }
  } else {
    console.log('[updateUser HISTORICAL AUDIT V2] No profile updates to apply.');
  }

  // 6. Handle combined errors (remains the same)
  if (targetError || profileError) {
    const errorMessage = [
        targetError ? `Targets Error: ${targetError.message}` : null,
        profileError ? `Profile Error: ${profileError.message}` : null
    ].filter(Boolean).join('; ');
    console.error(`[updateUser HISTORICAL AUDIT V2] Failing with combined error: ${errorMessage}`);
    throw new Error(errorMessage || 'Update failed');
  }

  console.log('[updateUser HISTORICAL AUDIT V2] Update process completed successfully.');
}

async function impersonateUser(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Check if current user is admin
  const { data: currentUser } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!currentUser?.is_admin) {
    throw new Error('Unauthorized');
  }

  // Get impersonation token
  const { data: token, error: tokenError } = await supabase.functions.invoke('impersonate-user', {
    body: { userId }
  });

  if (tokenError) throw tokenError;

  // Store original user ID for restoring later
  localStorage.setItem('originalUserId', session.user.id);

  // Sign in as impersonated user
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: token.email,
    password: token.password
  });

  if (signInError) throw signInError;

  // Clear any cached queries to ensure fresh data load for impersonated user
  if (window.queryClient) {
    window.queryClient.invalidateQueries();
  }
}

async function deleteUser(userId: string) {
  try {
    // Delete user's activities
    const { error: activitiesError } = await supabase
      .from('activities')
      .delete()
      .eq('user_id', userId);

    if (activitiesError) {
      console.error('[Users] Delete activities:', activitiesError);
      throw activitiesError;
    }

    // Delete user's targets
    const { error: targetsError } = await supabase
      .from('targets')
      .delete()
      .eq('user_id', userId);

    if (targetsError) {
      console.error('[Users] Delete targets:', targetsError);
      throw targetsError;
    }

    // Delete user's profile
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('[Users] Delete profile:', profileError);
      throw profileError;
    }

    // Delete auth user using admin client
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('[Users] Delete auth user:', authError);
      throw authError;
    }

    toast.success('User deleted successfully');
  } catch (error) {
    console.error('[Users] Delete operation failed:', error);
    toast.error('Failed to delete user');
    throw error;
  }
}

export function useUsers() {
  const queryClient = useQueryClient();

  const { data: users = [], isLoading, error: usersError } = useQuery<User[], Error>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  // Handle potential initial fetch error
  if (usersError) {
      console.error("[useUsers] Initial fetch error:", usersError);
      // Optionally inform the user, depending on desired UX
      // toast.error("Failed to load users data.");
  }

  const updateUserMutation = useMutation<
    void, // Return type on success (void if no specific return)
    Error, // Error type
    { userId: string; updates: Partial<User> } // Variables type
  >({
    mutationFn: ({ userId, updates }) => updateUser(userId, updates),
    onSuccess: (_) => {
      // Invalidate queries to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Maybe invalidate specific user query if you have one
      // queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      toast.success('User updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Update failed: ${error.message}`);
      console.error('[Users Update Mutation]', error);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      toast.error('Failed to delete user');
      console.error('[Users]', error);
    },
  });

  const impersonateUserMutation = useMutation({
    mutationFn: impersonateUser,
    onSuccess: () => {
      toast.success('Impersonation started');
    },
    onError: (error: Error) => {
      toast.error('Failed to impersonate user');
      console.error('[Users]', error);
    },
  });

  return {
    users,
    isLoading,
    updateUser: updateUserMutation.mutateAsync,
    deleteUser: deleteUserMutation.mutateAsync,
    impersonateUser: impersonateUserMutation.mutateAsync,
  };
}