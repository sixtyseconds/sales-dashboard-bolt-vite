import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ActivityPayload {
  type: 'outbound' | 'meeting' | 'proposal' | 'sale'
  clientName: string
  details?: string
  amount?: number
  priority?: 'low' | 'medium' | 'high'
  salesRep: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the JWT and API key from headers
    const authHeader = req.headers.get('Authorization')
    const apiKey = req.headers.get('apikey')

    if (!authHeader || !apiKey) {
      throw new Error('Missing authorization headers')
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the JWT token
    const token = authHeader.replace('Bearer ', '')

    // Verify the JWT and get the user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid token')
    }

    // Parse request body
    const { type, clientName, details, amount, priority = 'medium', salesRep } = await req.json() as ActivityPayload

    // Validate required fields
    if (!type || !clientName || !salesRep) {
      throw new Error('Missing required fields')
    }

    // Validate activity type
    if (!['outbound', 'meeting', 'proposal', 'sale'].includes(type)) {
      throw new Error('Invalid activity type')
    }

    // Create activity
    const { data, error } = await supabaseAdmin
      .from('activities')
      .insert({
        user_id: user.id,
        type,
        client_name: clientName,
        details,
        amount: type === 'sale' ? amount : null,
        priority,
        sales_rep: salesRep,
        date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      throw new Error('Failed to create activity')
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})