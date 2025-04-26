// src/components/admin/BulkActivityImport.tsx
import React, { useState } from 'react';
import { supabase } from '@/lib/supabase/client'; // Your Supabase client instance
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle, XCircle, Info, UploadCloud } from 'lucide-react';

function BulkActivityImport() {
  const [tsvData, setTsvData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null); // To store the response from the function

  const handleImport = async () => {
    if (!tsvData.trim()) {
      toast.warning('Please paste some data before importing.');
      return;
    }

    setIsLoading(true);
    setResult(null); // Clear previous results

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        toast.error('Authentication error. Please log in again.');
        setIsLoading(false);
        return;
      }

      // Invoke the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('bulk-import-activities', {
        body: tsvData,
        headers: {
          'Content-Type': 'text/plain', // Send as plain text
          // Authorization header is typically handled automatically by supabase-js
        }
      });

      if (error) {
        // Handle invocation errors (network, function crash before returning structured JSON)
        console.error('Function Invoke Error:', error);
        toast.error(`Function invocation failed: ${error.message}`);
        setResult({ type: 'error', message: `Invocation failed: ${error.message}` });
      } else {
        // Handle the JSON response from the function (success or structured error)
        console.log('Function Response:', data);
        if (data.error || data.databaseError) { // Check for errors reported by the function logic
            const errorMessage = data.databaseError || data.message || data.error || 'Unknown import error.';
            toast.error(`Import failed: ${errorMessage}`);
            setResult({ type: 'error', ...data });
        } else { // Success reported by the function
            toast.success(data.message || 'Import completed.');
            setResult({ type: 'success', ...data });
            setTsvData(''); // Clear textarea on success
        }
      }

    } catch (err: any) {
      console.error('Unexpected Import Error:', err);
      toast.error('An unexpected error occurred during import.');
      setResult({ type: 'error', message: `Unexpected error: ${err.message}` });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 mb-6 bg-gray-900/50 backdrop-blur-xl rounded-lg border border-gray-800/50">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
        <UploadCloud className="w-5 h-5" />
        Bulk Import Activities (TSV)
      </h3>
      <p className="text-sm text-gray-400">
        Paste tab-separated data below. Ensure columns match the order: <code className="text-xs bg-gray-700/50 px-1 py-0.5 rounded">id, user_id, type, status, priority, client_name, sales_rep, details, amount, date, created_at, updated_at, quantity, contact_identifier, contact_identifier_type</code>. Use `\N` for null values.
      </p>
      <Textarea
        placeholder="Paste your tab-separated activity data here...
Example Row:
ca2e54a1-...\tac4efca2-...\tmeeting\tcompleted\tmedium\tClient Name\tUser Name\tNotes...\t\\N\t2025-01-27...\t2025-01-27...\t2025-01-27...\t1\t\\N\t\\N"
        value={tsvData}
        onChange={(e) => setTsvData(e.target.value)}
        rows={10}
        className="bg-gray-800/50 border-gray-700/50 text-white font-mono text-xs focus:ring-offset-gray-900 focus:ring-offset-2 focus:ring-emerald-500"
        disabled={isLoading}
      />
      <Button onClick={handleImport} disabled={isLoading || !tsvData.trim()}>
        {isLoading ? 'Importing...' : 'Import Pasted Activities'}
      </Button>

      {result && (
         <Alert variant={result.type === 'error' ? 'destructive' : 'default'} className={`${result.type === 'error' ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-300'} mt-4`}>
            {result.type === 'error' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
            <AlertTitle className={result.type === 'error' ? 'text-red-400' : 'text-emerald-400'}>
                {result.type === 'error' ? 'Import Failed' : 'Import Result'}
            </AlertTitle>
            <AlertDescription className="space-y-1 text-sm">
                <p>{result.message || (result.error ? `Error: ${result.error}` : 'Status unknown.')}</p>
                {result.databaseError && <p><strong className="font-semibold">Database Issue:</strong> {result.databaseError}</p>}
                {typeof result.insertedCount === 'number' && <p>Successfully inserted: {result.insertedCount}</p>}
                {typeof result.processedLines === 'number' && <p>Total lines processed: {result.processedLines}</p>}
                {typeof result.skippedLines === 'number' && result.skippedLines > 0 && <p>Lines skipped (format/parsing issues): {result.skippedLines}</p>}
                {result.parsingErrors && result.parsingErrors.length > 0 && (
                    <div className="pt-2">
                        <p className="font-semibold">Sample Parsing Issues:</p>
                        <ul className="list-disc pl-5 text-xs max-h-24 overflow-y-auto bg-gray-800/30 p-2 rounded">
                            {result.parsingErrors.map((err: string, i: number) => <li key={i} className="font-mono">{err}</li>)}
                        </ul>
                    </div>
                )}
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default BulkActivityImport; 