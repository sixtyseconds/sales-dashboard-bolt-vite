import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Get the user from the authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check if user is admin (for certain operations)
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.is_admin || false;

    if (req.method === 'GET') {
      // Get all roadmap suggestions with user details and vote counts
      const { data: suggestions, error } = await supabase
        .from('roadmap_suggestions')
        .select(`
          *,
          submitted_by_profile:profiles!submitted_by(id, full_name, email),
          assigned_to_profile:profiles!assigned_to(id, full_name, email),
          user_vote:roadmap_votes(id)
        `)
        .eq('roadmap_votes.user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      // Transform the data to include user's vote status
      const transformedSuggestions = suggestions.map(suggestion => ({
        ...suggestion,
        hasUserVoted: suggestion.user_vote && suggestion.user_vote.length > 0,
        user_vote: undefined // Remove the raw user_vote data
      }));

      return res.status(200).json(transformedSuggestions);
    }

    if (req.method === 'POST') {
      const { title, description, type, priority } = req.body;

      if (!title || !description || !type) {
        return res.status(400).json({ error: 'Title, description, and type are required' });
      }

      const { data: suggestion, error } = await supabase
        .from('roadmap_suggestions')
        .insert({
          title,
          description,
          type,
          priority: priority || 'medium',
          submitted_by: user.id
        })
        .select(`
          *,
          submitted_by_profile:profiles!submitted_by(id, full_name, email)
        `)
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({
        ...suggestion,
        hasUserVoted: false,
        votes_count: 0
      });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const updates = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Suggestion ID is required' });
      }

      // Check permissions
      const { data: existingSuggestion } = await supabase
        .from('roadmap_suggestions')
        .select('submitted_by')
        .eq('id', id)
        .single();

      if (!existingSuggestion) {
        return res.status(404).json({ error: 'Suggestion not found' });
      }

      // Users can only update their own suggestions, admins can update any
      if (!isAdmin && existingSuggestion.submitted_by !== user.id) {
        return res.status(403).json({ error: 'Unauthorized to update this suggestion' });
      }

      // Restrict fields that regular users can update
      let allowedUpdates = {};
      if (isAdmin) {
        // Admins can update any field
        allowedUpdates = updates;
        if (updates.status === 'completed' && !updates.completion_date) {
          allowedUpdates.completion_date = new Date().toISOString();
        }
      } else {
        // Regular users can only update title, description, type, priority
        const { title, description, type, priority } = updates;
        allowedUpdates = { title, description, type, priority };
      }

      const { data: suggestion, error } = await supabase
        .from('roadmap_suggestions')
        .update(allowedUpdates)
        .eq('id', id)
        .select(`
          *,
          submitted_by_profile:profiles!submitted_by(id, full_name, email),
          assigned_to_profile:profiles!assigned_to(id, full_name, email)
        `)
        .single();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json(suggestion);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: 'Suggestion ID is required' });
      }

      // Only admins can delete suggestions
      if (!isAdmin) {
        return res.status(403).json({ error: 'Only admins can delete suggestions' });
      }

      const { error } = await supabase
        .from('roadmap_suggestions')
        .delete()
        .eq('id', id);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(204).end();
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Roadmap API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}