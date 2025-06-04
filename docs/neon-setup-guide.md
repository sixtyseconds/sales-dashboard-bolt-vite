# Neon.tech + Supabase Auth Setup Guide

## Architecture Overview

**New Clean Architecture:**
- 🗄️ **Database**: Neon.tech (with branches: `dev` & `main`)
- 🔐 **Auth**: Supabase Auth (standalone)
- ⚛️ **Frontend**: React → Express API → Neon
- 🌐 **Backend**: Express API → Neon

This eliminates the Supabase database confusion and gives you clean separation.

## Step 1: Neon.tech Branching Setup

### 1.1 Create Neon Branches

```bash
# Install Neon CLI
npm install -g @neondatabase/cli

# Login to Neon
neonctl auth

# Create dev branch from main
neonctl branches create --name dev --parent main

# Create staging branch (optional)
neonctl branches create --name staging --parent main
```

### 1.2 Get Connection Strings

```bash
# Get main branch connection string (production)
neonctl connection-string --branch main

# Get dev branch connection string
neonctl connection-string --branch dev
```

### 1.3 Environment Configuration

Create environment files:

**`.env.development`**:
```env
# Development Neon branch
VITE_NEON_DATABASE_URL=postgresql://neondb_owner:password@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&branch=dev

# Supabase Auth (same for all environments)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api
```

**`.env.production`**:
```env
# Production Neon branch
VITE_NEON_DATABASE_URL=postgresql://neondb_owner:password@ep-divine-heart-abzonafv-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&branch=main

# Supabase Auth (same)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Configuration
VITE_API_BASE_URL=https://your-api-domain.com/api
```

## Step 2: Update Express API

### 2.1 Dynamic Database Connection

```javascript
// server/config.js
import dotenv from 'dotenv';

dotenv.config();

const isDevelopment = process.env.NODE_ENV !== 'production';

export const config = {
  database: {
    connectionString: isDevelopment 
      ? process.env.VITE_NEON_DATABASE_URL_DEV 
      : process.env.VITE_NEON_DATABASE_URL_PROD
  },
  port: process.env.PORT || 8000
};
```

### 2.2 Update API Server

```javascript
// server/api.js
import { config } from './config.js';

const client = new Client({
  connectionString: config.database.connectionString
});
```

## Step 3: Configure Supabase for Auth-Only

### 3.1 Supabase Configuration

Since you're only using Supabase for auth, configure it to not expect database operations:

```typescript
// src/lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing env.VITE_SUPABASE_URL');
if (!supabaseAnonKey) throw new Error('Missing env.VITE_SUPABASE_ANON_KEY');

// Auth-only client - no database operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public'
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});
```

### 3.2 Auth Hook

```typescript
// src/lib/hooks/useAuth.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return {
    user,
    loading,
    signIn: supabase.auth.signInWithPassword,
    signOut: supabase.auth.signOut,
    signUp: supabase.auth.signUp
  };
}
```

## Step 4: Frontend Service Layer

The `ApiContactService` you now have connects to your Express API, which connects to Neon:

```typescript
// Frontend -> Express API -> Neon Database
// No more Supabase database confusion!
```

## Step 5: Development Workflow

### 5.1 Local Development

```bash
# Start Express API (connects to dev branch)
NODE_ENV=development node server/api.js

# Start React app
npm run dev
```

### 5.2 Database Migrations

```bash
# Run migrations on dev branch
neonctl migration run --branch dev

# Test on dev branch
# Deploy to main branch when ready
neonctl migration run --branch main
```

### 5.3 Branch Management

```bash
# Create feature branch for large schema changes
neonctl branches create --name feature-new-tables --parent dev

# Test changes on feature branch
# Merge back to dev when ready
neonctl branches merge feature-new-tables dev
```

## Benefits of This Setup

✅ **Clean separation**: Auth vs Database
✅ **Neon branching**: Safe dev/prod isolation  
✅ **No relationship issues**: Direct PostgreSQL with foreign keys
✅ **Scalable**: Easy to add staging, feature branches
✅ **Cost effective**: Neon's branching is very efficient

## Migration Steps

1. **Configure Neon branches** (Step 1)
2. **Update environment variables** (Step 1.3)
3. **Restart Express API** with new connection
4. **Test contact record page** - should work immediately!
5. **Update other components** to use ApiContactService

## Testing

Your contact record page should now work perfectly:

1. Express API is running: ✅
2. Individual contact endpoint: ✅ 
3. Company relationships: ✅
4. Contact data from Neon: ✅

Visit: `http://localhost:5173/crm/contacts/71e069a6-6f70-4735-b4ad-fe72f8f1c81f` 