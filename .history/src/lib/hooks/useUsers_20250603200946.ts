import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, supabaseAdmin } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

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
        updated_at
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

// Refactored updateUser function
async function updateUser(userId: string, updates: Partial<User>) {
  console.log('[updateUser] Called with:', { userId, updates }); // Log entry
  let profileUpdates = { ...updates };
  let targetError: Error | null = null;

  // Handle targets update if present
  if (profileUpdates.targets) {
    const submittedTargets = profileUpdates.targets;
    console.log('[updateUser] Processing targets:', submittedTargets); // Log submitted targets
    delete profileUpdates.targets; // Remove targets from profile updates

    try {
      // 1. Fetch current target IDs for the user
      console.log(`[updateUser] Fetching current targets for user: ${userId}`);
      const { data: currentTargets, error: fetchError } = await supabase
        .from('targets')
        .select('id')
        .eq('user_id', userId);

      if (fetchError) {
          console.error('[updateUser] Error fetching current targets:', fetchError);
          throw fetchError;
      }
      console.log('[updateUser] Current targets fetched:', currentTargets);

      const currentTargetIds = new Set(currentTargets?.map(t => t.id) || []);
      console.log('[updateUser] Current target IDs:', currentTargetIds);

      const submittedTargetIds = new Set(submittedTargets.filter(t => t.id && !t.id.startsWith('new_')).map(t => t.id));
      console.log('[updateUser] Submitted target IDs (existing):', submittedTargetIds);


      // 2. Identify targets to insert, update, delete
      const targetsToInsert = submittedTargets
          .filter(t => !t.id || t.id.startsWith('new_'))
          .map(({ id, ...rest }) => ({ ...rest, user_id: userId })); // Add user_id, remove temp id
      console.log('[updateUser] Targets to insert:', targetsToInsert);

      const targetsToUpdate = submittedTargets
          .filter(t => t.id && !t.id.startsWith('new_') && currentTargetIds.has(t.id))
          .map(t => ({ ...t, user_id: userId })); // Ensure user_id
      console.log('[updateUser] Targets to update:', targetsToUpdate);

      const targetIdsToDelete = Array.from(currentTargetIds)
          .filter(id => !submittedTargetIds.has(id));
      console.log('[updateUser] Target IDs to delete:', targetIdsToDelete);


      // 3. Perform database operations
      const operations = [];

      if (targetsToInsert.length > 0) {
        console.log('[updateUser] Pushing insert operation');
        operations.push(supabase.from('targets').insert(targetsToInsert));
      }

      if (targetsToUpdate.length > 0) {
          console.log('[updateUser] Pushing update operations');
          for (const target of targetsToUpdate) {
              const { id, ...updateData } = target;
              console.log(`[updateUser] -- Updating target ID: ${id} with data:`, updateData);
              operations.push(supabase.from('targets').update(updateData).eq('id', id));
          }
      }

      if (targetIdsToDelete.length > 0) {
        console.log('[updateUser] Pushing delete operation');
        operations.push(supabase.from('targets').delete().in('id', targetIdsToDelete));
      }

      // Execute all operations
      if (operations.length > 0) {
        console.log('[updateUser] Executing DB operations...');
        const results = await Promise.all(operations);
        console.log('[updateUser] DB operations results:', results); // Log results
        results.forEach(result => {
          if (result.error) {
            console.error('[updateUser] Target DB operation failed:', result.error);
            // Collect the first error encountered
            if (!targetError) targetError = result.error;
          }
        });
      } else {
          console.log('[updateUser] No target DB operations to execute.');
      }

      if (targetError) throw targetError; // Throw if any target operation failed
      console.log('[updateUser] Target operations successful.');

    } catch (error) {
      console.error("[updateUser] Error processing targets:", error);
      // Assign error to handle it after profile update attempt
      targetError = error instanceof Error ? error : new Error(String(error));
    }
  } else {
      console.log('[updateUser] No targets included in updates.');
  }

  // Update other user data in 'profiles' table
  let profileError: Error | null = null;
  if (Object.keys(profileUpdates).length > 0) {
    console.log('[updateUser] Updating profile with:', profileUpdates);
    try {
        const { data: profileUpdateData, error } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', userId)
          .select(); // Add select() to potentially see what was updated or if RLS blocked it

        console.log('[updateUser] Profile update result:', { profileUpdateData, error }); // Log profile update result
        if (error) throw error;
    } catch(error) {
        console.error("[updateUser] Error updating profile:", error);
        profileError = error instanceof Error ? error : new Error(String(error));
    }
  } else {
      console.log('[updateUser] No profile updates to apply.');
  }

  // Handle combined errors
  if (targetError || profileError) {
      const errorMessage = [
          targetError ? `Targets Error: ${targetError.message}` : null,
          profileError ? `Profile Error: ${profileError.message}` : null
      ].filter(Boolean).join('; ');
      console.error(`[updateUser] Failing with combined error: ${errorMessage}`);
      throw new Error(errorMessage || 'Update failed');
  }

  console.log('[updateUser] Update process completed successfully.');
}

async function impersonateUser(userId: string) {
  const { data: { session }, error } = await supabase.auth.getSession();
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
    onSuccess: (_, variables) => {
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