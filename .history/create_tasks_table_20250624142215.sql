-- Create tasks table for task management
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  notes TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  task_type TEXT DEFAULT 'general' CHECK (task_type IN ('call', 'email', 'meeting', 'follow_up', 'proposal', 'demo', 'general')),
  
  -- User relationships (references the profiles table)
  assigned_to UUID REFERENCES profiles(id) NOT NULL,
  created_by UUID REFERENCES profiles(id) NOT NULL,
  
  -- CRM relationships (optional - these tables may not exist yet)
  deal_id UUID,
  company_id UUID,
  contact_id UUID,
  
  -- Legacy contact fields for backward compatibility
  contact_email TEXT,
  contact_name TEXT,
  company TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);

-- Enable RLS (Row Level Security)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies to ensure users can only see their own tasks
CREATE POLICY "Users can view own assigned tasks" ON tasks
  FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Users can view tasks they created" ON tasks
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own assigned tasks" ON tasks
  FOR UPDATE USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can delete tasks they created" ON tasks
  FOR DELETE USING (created_by = auth.uid()); 