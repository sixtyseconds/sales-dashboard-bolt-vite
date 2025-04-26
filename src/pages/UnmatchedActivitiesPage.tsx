import React, { useMemo, useState } from 'react';
import { useOriginalActivities } from '@/lib/hooks/useOriginalActivities';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'; // Assuming Shadcn UI Alert
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'; // Assuming Shadcn UI Table
import { Badge } from '@/components/ui/badge'; // Assuming Shadcn UI Badge
import { format } from 'date-fns'; // For date formatting
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Import Avatar
import { Button } from '@/components/ui/button'; // Import Button
import { EditActivityEmailModal } from '@/components/activities/EditActivityEmailModal'; // Import the modal component
import type { OriginalActivity } from '@/lib/hooks/useOriginalActivities'; // Get the type definition
import { Loader2, Edit2 } from 'lucide-react'; // Import Loader2 and Edit2 icons

// Get user initials for fallback avatar
const getInitials = (firstName?: string | null, lastName?: string | null) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Rename the component to reflect its new purpose
export function MissingEmailActivitiesPage() {
  // Memoize the filters object so its reference is stable
  const filters = useMemo(() => ({
     contact_identifier: 'IS_NULL' as const, 
     type_neq: 'Outbound' // Add filter to exclude 'Outbound'
    }), []);

  // Pass the stable filters object to the hook
  const { 
    activities, 
    isLoading, 
    error, 
    refreshActivities, 
    updateActivity // Get the update function from the hook
  } = useOriginalActivities(filters);

  // State for the edit modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<OriginalActivity | null>(null);

  // Handler to open the modal
  const handleEditClick = (activity: OriginalActivity) => {
    setEditingActivity(activity);
    setIsEditModalOpen(true);
  };

  // Handler to close the modal
  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingActivity(null);
  };

  // Handler for saving from the modal
  const handleSaveEmail = async (activityId: string, email: string) => {
    if (!updateActivity) return false; // Guard if update function isn't available
    
    const success = await updateActivity(activityId, { contact_identifier: email });
    
    if (success) {
      // Refresh the list after successful update
      // Realtime listener should ideally handle this, but explicit refresh is safer
      refreshActivities(); 
      return true;
    } else {
      return false;
    }
  };

  if (isLoading) {
    return <div>Loading activities missing email...</div>; 
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {/* Update error message */}
          Failed to load activities: {error.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Update title and description */}
      <h1 className="text-2xl font-bold mb-4">Activities Missing Email</h1>
      <p className="text-muted-foreground mb-6">
        These activities (excluding 'Outbound') were logged without an email address. 
        Please update the original activity logs with the correct email address to enable pipeline linking.
      </p>

       {activities.length === 0 && !isLoading ? (
         <p className="mt-6 text-center text-gray-400">
           No activities (excluding 'Outbound') found missing an email address.
         </p>
       ) : (
        <div className="my-6 p-4 bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-800/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800/50">
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Type</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Client Name</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Details</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Logged By</TableHead>
                <TableHead className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity) => (
                <TableRow key={activity.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                  <TableCell className="px-3 py-3 text-sm text-white">{format(new Date(activity.date), 'PP')}</TableCell>
                  <TableCell className="px-3 py-3"><Badge variant="secondary">{activity.type}</Badge></TableCell>
                  <TableCell className="px-3 py-3 text-sm text-white">{activity.client_name || '-'}</TableCell>
                  <TableCell className="px-3 py-3 text-sm text-gray-400 max-w-xs truncate">{activity.details || '-'}</TableCell>
                  <TableCell className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                         <AvatarImage src={activity.profiles?.avatar_url ?? undefined} alt={activity.profiles?.first_name || 'User'} />
                         <AvatarFallback className='text-xs'>
                           {getInitials(activity.profiles?.first_name, activity.profiles?.last_name)}
                         </AvatarFallback>
                      </Avatar>
                       <span className='text-sm text-white'>{activity.profiles?.first_name} {activity.profiles?.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-right">
                    <Button 
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditClick(activity)} 
                      className="dark:text-gray-400 dark:hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="sr-only">Edit Email</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Button 
        variant="secondary" 
        onClick={refreshActivities}
        disabled={isLoading}
        className="mt-4 dark:text-white"
       >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Refresh List'}
      </Button>

      {editingActivity && (
        <EditActivityEmailModal
          activity={editingActivity}
          isOpen={isEditModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEmail}
        />
      )}
    </div>
  );
}

// Update default export if needed
export default MissingEmailActivitiesPage; 