import { handleCORS, apiResponse } from './_db.js';

export default function handler(request) {
  // Handle CORS preflight
  const corsResponse = handleCORS(request);
  if (corsResponse) return corsResponse;

  if (request.method === 'GET') {
    // Return Andrew Bryce's profile
    const userData = {
      id: 'ac4efca2-1fe1-49b3-9d5e-6ac3d8bf3459', // Andrew's actual UUID from the database
      email: 'andrew.bryce@sixtyseconds.video',
      first_name: 'Andrew',
      last_name: 'Bryce',
      stage: 'Director',
      is_admin: true,
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return apiResponse(userData);
  }

  return apiResponse(null, 'Method not allowed', 405);
} 