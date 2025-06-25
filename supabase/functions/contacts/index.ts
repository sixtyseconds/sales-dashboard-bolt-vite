import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/').filter(segment => segment && segment !== 'functions' && segment !== 'v1' && segment !== 'contacts')
    const contactId = pathSegments[0]
    
    if (req.method === 'GET') {
      if (!contactId) {
        // GET /contacts - List contacts
        return await handleContactsList(supabaseClient, url)
      } else {
        // GET /contacts/:id - Single contact
        return await handleSingleContact(supabaseClient, contactId)
      }
    } else if (req.method === 'POST') {
      // POST /contacts - Create contact
      const body = await req.json()
      return await handleCreateContact(supabaseClient, body)
    } else if (req.method === 'PUT') {
      // PUT /contacts/:id - Update contact
      if (!contactId) {
        return new Response(JSON.stringify({ error: 'Contact ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      const body = await req.json()
      return await handleUpdateContact(supabaseClient, contactId, body)
    } else if (req.method === 'DELETE') {
      // DELETE /contacts/:id - Delete contact
      if (!contactId) {
        return new Response(JSON.stringify({ error: 'Contact ID required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
      return await handleDeleteContact(supabaseClient, contactId)
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error in contacts function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// List contacts
async function handleContactsList(supabaseClient: any, url: URL) {
  try {
    const includeCompany = url.searchParams.get('includeCompany') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const search = url.searchParams.get('search') || ''
    const companyId = url.searchParams.get('company_id') || ''
    const ownerId = url.searchParams.get('owner_id') || ''

    let query = supabaseClient
      .from('contacts')
      .select(`
        id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        title,
        company_id,
        owner_id,
        linkedin_url,
        notes,
        created_at,
        updated_at
        ${includeCompany ? `,
        companies:companies(
          id,
          name,
          domain,
          size,
          industry,
          website
        )
        ` : ''}
      `)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,full_name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (companyId) {
      query = query.eq('company_id', companyId)
    }
    if (ownerId) {
      query = query.eq('owner_id', ownerId)
    }

    const { data: contacts, error, count } = await query

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      data: contacts,
      count: count || 0,
      error: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return new Response(JSON.stringify({
      data: [],
      error: error.message,
      count: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Get single contact
async function handleSingleContact(supabaseClient: any, contactId: string) {
  try {
    const { data: contact, error } = await supabaseClient
      .from('contacts')
      .select(`
        *,
        companies:companies(
          id,
          name,
          domain,
          size,
          industry,
          website
        )
      `)
      .eq('id', contactId)
      .single()

    if (error) {
      throw error
    }

    if (!contact) {
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({
      data: contact,
      error: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return new Response(JSON.stringify({
      data: null,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Create contact
async function handleCreateContact(supabaseClient: any, body: any) {
  try {
    const { data: contact, error } = await supabaseClient
      .from('contacts')
      .insert(body)
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      data: contact,
      error: null
    }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating contact:', error)
    return new Response(JSON.stringify({
      data: null,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Update contact
async function handleUpdateContact(supabaseClient: any, contactId: string, body: any) {
  try {
    const { data: contact, error } = await supabaseClient
      .from('contacts')
      .update(body)
      .eq('id', contactId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      data: contact,
      error: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error updating contact:', error)
    return new Response(JSON.stringify({
      data: null,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// Delete contact
async function handleDeleteContact(supabaseClient: any, contactId: string) {
  try {
    const { error } = await supabaseClient
      .from('contacts')
      .delete()
      .eq('id', contactId)

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({
      data: { id: contactId },
      error: null
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return new Response(JSON.stringify({
      data: null,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
} 