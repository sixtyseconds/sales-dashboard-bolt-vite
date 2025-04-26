import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Define the expected structure of an activity row for insertion
// Based on the COPY command: id, user_id, type, status, priority, client_name, sales_rep, details, amount, date, created_at, updated_at, quantity, contact_identifier, contact_identifier_type
interface ActivityInsert {
  id: string;
  user_id: string;
  type?: string | null;
  status?: string | null;
  priority?: string | null;
  client_name?: string | null;
  sales_rep?: string | null;
  details?: string | null;
  amount?: number | null;
  date?: string | null; // ISO 8601 format preferably
  created_at?: string | null;
  updated_at?: string | null;
  quantity?: number | null;
  contact_identifier?: string | null;
  contact_identifier_type?: string | null;
  // Add is_processed if it exists and needs default
  // is_processed?: boolean;
}

// Column order based on the user's COPY example
const COLUMN_ORDER = [
  'id', 'user_id', 'type', 'status', 'priority', 'client_name', 'sales_rep',
  'details', 'amount', 'date', 'created_at', 'updated_at', 'quantity',
  'contact_identifier', 'contact_identifier_type'
];
const EXPECTED_COLUMNS = COLUMN_ORDER.length;

console.log('Function "bulk-import-activities" up and running!');

// Removed the serve() wrapper, directly export the handler
export default async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests explicitly
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request');
    // Create headers manually for the OPTIONS response
    const optionsHeaders = new Headers();
    optionsHeaders.set('Access-Control-Allow-Origin', '*'); // Or your specific origin
    optionsHeaders.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
    optionsHeaders.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    
    return new Response('ok', { headers: optionsHeaders });
  }

  try {
    // 1. Get Supabase Admin client (needed for admin check)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Check Authorization and Admin Role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(jwt);

    if (userError || !user) {
      console.error('Auth Error:', userError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Check if the user is an admin by looking up their profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      console.error('Admin Check Error:', profileError);
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin role required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403, // Forbidden
      });
    }
    console.log(`Admin user ${user.id} authorized.`);

    // 3. Get TSV data from request body
    const tsvData = await req.text();
    if (!tsvData) {
      throw new Error('Missing data in request body.');
    }

    // 4. Parse TSV data
    const lines = tsvData.trim().split('\n');
    const activitiesToInsert: ActivityInsert[] = [];
    const errors: string[] = [];
    const skippedLines: number[] = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      if (!line.trim()) {
        // Allow skipping truly empty lines, but log potentially problematic ones
        if (line.length > 0) console.warn(`Skipping line ${lineNumber} containing only whitespace.`);
        skippedLines.push(lineNumber);
        return; // Skip empty/whitespace-only lines
      }

      const values = line.split('\t');
      if (values.length !== EXPECTED_COLUMNS) {
        errors.push(`Line ${lineNumber}: Incorrect number of columns. Expected ${EXPECTED_COLUMNS}, got ${values.length}. Line: "${line.substring(0, 50)}..."`);
        skippedLines.push(lineNumber);
        return; // Skip malformed lines
      }

      const activity: ActivityInsert = { id: '', user_id: '' }; // Initialize required fields
      let validRow = true;

      try {
        COLUMN_ORDER.forEach((colName, colIndex) => {
          let value: string | number | null = values[colIndex].trim();

          // Handle PostgreSQL's '\N' representation for NULL
          if (value === '\\N') {
            value = null;
          }

          // Basic Type Conversion/Validation
          if (value !== null) {
             if (colName === 'amount') {
              const num = parseFloat(value);
              value = isNaN(num) ? null : num;
            } else if (colName === 'quantity') {
              const num = parseInt(value, 10);
              value = isNaN(num) ? null : num;
            } else if (colName === 'date' || colName === 'created_at' || colName === 'updated_at') {
              const dateObj = new Date(value);
              if (isNaN(dateObj.getTime())) {
                errors.push(`Line ${lineNumber}: Invalid date format for column '${colName}': "${value}"`);
                value = null; // Set to null if date is invalid
              } else {
                 // Keep as the original valid string for Supabase insert
                 // Supabase client prefers ISO 8601 or compatible strings
                 // value = dateObj.toISOString(); // Alternative: Convert to ISO string
              }
            }
            // Add more type checks if needed (e.g., boolean)
          }

          // Assign value
          (activity as any)[colName] = value;
        });

        // Validate essential fields after parsing
        if (!activity.id || !activity.user_id) {
           errors.push(`Line ${lineNumber}: Missing required field 'id' or 'user_id'.`);
           validRow = false;
        }

      } catch (parseError) {
        console.error(`Line ${lineNumber}: Uncaught parsing error - ${parseError.message}`);
        errors.push(`Line ${lineNumber}: Uncaught error parsing data.`);
        validRow = false;
      }

      if (validRow) {
        activitiesToInsert.push(activity);
      } else {
        skippedLines.push(lineNumber);
      }
    });

    console.log(`Parsed ${activitiesToInsert.length} valid rows. Skipped ${skippedLines.length} rows.`);
    if (errors.length > 0) {
      console.warn("Parsing Issues Found:", errors.slice(0, 20)); // Log first few errors
    }

    // 5. Perform Bulk Insert
    let insertedCount = 0;
    if (activitiesToInsert.length > 0) {
      const { count, error: insertError } = await supabaseAdmin
        .from('activities')
        .insert(activitiesToInsert);

      if (insertError) {
        console.error('Database Insert Error:', insertError);
        const userMessage = insertError.code === '23505'
          ? `Failed due to duplicate ID(s). Check input for existing activity IDs. (Code: ${insertError.code})`
          : `Database Error: ${insertError.message}. (Code: ${insertError.code})`;

        return new Response(JSON.stringify({
            message: "Import failed during database insertion.",
            insertedCount: count ?? 0,
            parsingErrors: errors.slice(0, 10),
            databaseError: userMessage
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
      }
      insertedCount = count ?? 0;
      console.log(`Successfully inserted ${insertedCount} activities.`);
    } else {
       console.log("No valid activities found to insert.");
       if (errors.length > 0) {
         // If parsing failed for all rows, report that clearly
          return new Response(JSON.stringify({
              message: "Import failed: No valid activity rows could be parsed from the input.",
              processedLines: lines.length,
              skippedLines: skippedLines.length,
              parsingErrors: errors.slice(0, 10)
          }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400,
          });
       }
    }

    // 6. Return Success Response (even if some rows were skipped during parsing)
    const finalMessage = errors.length > 0
        ? `Import completed with ${errors.length} parsing issue(s).`
        : `Import successful.`;

    return new Response(JSON.stringify({
      message: finalMessage,
      processedLines: lines.length,
      insertedCount: insertedCount,
      skippedLines: skippedLines.length,
      parsingErrors: errors.slice(0, 10) // Include sample of errors if any
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function Error:", error.message, error.stack);
    return new Response(JSON.stringify({ error: `Internal Server Error: ${error.message}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}; 