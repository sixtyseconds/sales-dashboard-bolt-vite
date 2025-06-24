# Sales Dashboard

A modern sales performance tracking and analytics platform built with React, Vite, and Supabase.

## Features

- Real-time sales activity tracking
- Interactive sales funnel visualization
- Activity heatmap
- Performance analytics
- Team management
- User authentication and authorization

## Tech Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Supabase
- React Query
- React Router
- Framer Motion
- Recharts
- Lucide Icons

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Build

To build for production:

```bash
npm run build
```

## Deployment & Troubleshooting

### Recent Fixes (Latest Update)

**API Timeout Issues Fixed:**
- Updated database connection handling for Vercel serverless environment
- Implemented proper connection cleanup to prevent memory leaks
- Increased API timeout from 10s to 30s in `vercel.json`
- Fixed URL parsing in contacts and deals APIs

**Supabase Client Issues Fixed:**
- Implemented singleton pattern to prevent multiple client instances
- Added unique storage keys for regular and admin clients
- Fixed environment variable type declarations

**Key Changes:**
- `api/_db.js`: New `executeQuery()` function with automatic connection cleanup
- `src/lib/supabase/client.ts`: Singleton pattern for client instances
- `vercel.json`: Increased `maxDuration` to 30 seconds
- All API endpoints updated to use new connection management

### Health Check

Monitor API health at: `/api/health`

### Common Issues

1. **504 Gateway Timeout**: Fixed with new connection management
2. **Multiple Supabase clients warning**: Fixed with singleton pattern
3. **404 for contact endpoints**: Fixed URL parsing logic

## License

MIT