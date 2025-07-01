import React from 'react';
import { useAuditLogs, type FieldHistoryEntry } from '@/lib/hooks/useAuditLogs';
import { format } from 'date-fns';
import { History, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AuditLogViewerProps {
  tableName: string;
  recordId: string;
  fieldName?: string;
  title?: string;
}

export function AuditLogViewer({ 
  tableName, 
  recordId, 
  fieldName, 
  title = 'Change History' 
}: AuditLogViewerProps) {
  const { isAdmin, getFieldHistory, getAuditHistory, loading, error } = useAuditLogs();
  const [history, setHistory] = React.useState<FieldHistoryEntry[]>([]);

  React.useEffect(() => {
    if (isAdmin && recordId) {
      loadHistory();
    }
  }, [isAdmin, recordId, fieldName]);

  const loadHistory = async () => {
    try {
      if (fieldName) {
        const data = await getFieldHistory(tableName, recordId, fieldName);
        setHistory(data);
      } else {
        // For now, just show field history
        const data = await getAuditHistory(tableName, recordId);
        console.log('Full audit history:', data);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  if (!isAdmin) {
    return null; // Don't show anything for non-admins
  }

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <History className="w-4 h-4 text-gray-400" />
        <h3 className="text-sm font-medium text-gray-300">{title}</h3>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400">Loading history...</div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span>Failed to load history</span>
        </div>
      ) : history.length === 0 ? (
        <div className="text-sm text-gray-400">No history available</div>
      ) : (
        <div className="space-y-2">
          {history.map((entry, idx) => (
            <div key={idx} className="text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {entry.old_value && (
                    <>
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        {entry.old_value}
                      </Badge>
                      <span className="text-gray-500">→</span>
                    </>
                  )}
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                    {entry.new_value || '(empty)'}
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {format(new Date(entry.changed_at), 'MMM dd, HH:mm')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Example usage in a meeting details component:
export function MeetingTypeHistory({ activityId }: { activityId: string }) {
  return (
    <AuditLogViewer
      tableName="activities"
      recordId={activityId}
      fieldName="details"
      title="Meeting Type History"
    />
  );
}