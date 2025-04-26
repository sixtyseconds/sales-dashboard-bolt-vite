import React, { useMemo, useState } from 'react';
import { useOriginalActivities } from '@/lib/hooks/useOriginalActivities';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react'; // Import Loader2 for loading indicator
import { toast } from 'sonner';
import type { OriginalActivity } from '@/lib/hooks/useOriginalActivities';
import { supabase } from '@/lib/supabase/client'; // Import Supabase client

// Get user initials for fallback avatar (assuming this function exists globally or is defined here)
const getInitials = (firstName?: string | null, lastName?: string | null) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export function UnprocessedReadyActivitiesPage() {
  // Filters for activities that have an email, are not processed, AND are not 'Outbound Activity' type
  const filters = useMemo(() => ({
    contact_identifier: 'IS_NOT_NULL' as const,
    is_processed: false,
    type_neq: 'Outbound Activity' // Add filter to exclude this type
  }), []);

  const {
    activities,
    isLoading,
    error,
    refreshActivities
    // We might need updateActivity later if processing fails and we want to mark it
  } = useOriginalActivities(filters);

  // State to track which activity is currently being processed
  const [processingActivityId, setProcessingActivityId] = useState<string | null>(null);

  // Updated Handler to call the Supabase Function
  const handleProcessClick = async (activityId: string) => {
    setProcessingActivityId(activityId);
    console.log(`[UnprocessedReadyActivitiesPage] Attempting to process activity: ${activityId}`);
    const toastId = toast.loading(`Processing activity ${activityId}...`); // Keep toast ID

    try {
      // Call the Supabase Edge Function
      const { data, error: functionError } = await supabase.functions.invoke('process-single-activity', {
        body: { activityId }, // Pass activityId in the body
      });

      if (functionError) {
          // Check if the error is because it's already processed (based on function's response)
          if (functionError.message.includes('already processed')) {
              toast.info(`Activity ${activityId} was already processed.`, { id: toastId });
              // Optionally refresh to remove it from the list if realtime didn't catch it
              refreshActivities(); 
          } else {
              throw functionError; // Rethrow other errors
          }
      } else {
          console.log('[UnprocessedReadyActivitiesPage] Function response:', data);
          toast.success(`Successfully processed activity ${activityId}.`, { id: toastId });
          // No need to manually refresh if realtime listener on 'activities' table works
          // for the is_processed update. However, explicit refresh is safer.
          refreshActivities();
      }
    } catch (err: any) {
      console.error(`Error processing activity ${activityId}:`, err);
      // Check for specific Supabase FunctionInvokeError properties if available
      const context = err.context ? ` (${err.context.status || 'unknown status'})` : '';
      toast.error('Failed to process activity', { 
          id: toastId,
          description: `${err.message || 'Unknown error'}${context}`
      });
    } finally {
      setProcessingActivityId(null); // Clear loading state regardless of outcome
    }
  };

  if (isLoading && activities.length === 0) { // Show loading only on initial load
    return <div className="container mx-auto py-8">Loading activities ready for processing...</div>;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load activities: {error.message || 'Unknown error'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Process Ready Activities</h1>
      <p className="text-muted-foreground mb-6">
        These activities have a contact identifier (email) but have not yet been processed
        to create or link related deals/deal activities. Click 'Process' to handle them individually.
        (Excluding 'Outbound Activity' types).
      </p>

      {activities.length === 0 && !isLoading ? (
        <p className="mt-6">No activities found that are ready for processing.</p>
      ) : (
        <div className="my-6 p-4 bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-800/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-800/50">
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Type</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Client Name</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Contact Email</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Details</TableHead>
                <TableHead className="px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Logged By</TableHead>
                <TableHead className="px-3 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && !processingActivityId && <TableRow><TableCell colSpan={8} className="h-12 text-center text-muted-foreground">Refreshing...</TableCell></TableRow>}
              {activities.map((activity) => {
                const isProcessing = processingActivityId === activity.id;
                return (
                  <TableRow key={activity.id} className={isProcessing ? 'opacity-50 pointer-events-none border-b border-gray-800/50 hover:bg-gray-800/20' : 'border-b border-gray-800/50 hover:bg-gray-800/20'}>
                    <TableCell className="px-3 py-3 text-sm text-white">{format(new Date(activity.date), 'PP')}</TableCell>
                    <TableCell className="px-3 py-3"><Badge variant="secondary">{activity.type}</Badge></TableCell>
                    <TableCell className="px-3 py-3 text-sm text-white">{activity.client_name || '-'}</TableCell>
                    <TableCell className="px-3 py-3 text-sm text-white">{activity.contact_identifier || '-'}</TableCell>
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
                        variant="outline"
                        size="sm"
                        onClick={() => handleProcessClick(activity.id)}
                        disabled={isProcessing || isLoading}
                        className="dark:text-white"
                      >
                        {isProcessing ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                        ) : (
                          'Process'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Button 
        variant="secondary" // Use secondary or outline variant
        onClick={refreshActivities}
        disabled={isLoading || !!processingActivityId} 
        className="mt-4"
       >
        {isLoading && !processingActivityId ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Refreshing...</>
         ) : (
            'Refresh List'
         )}
       </Button>
    </div>
  );
}

export default UnprocessedReadyActivitiesPage; 