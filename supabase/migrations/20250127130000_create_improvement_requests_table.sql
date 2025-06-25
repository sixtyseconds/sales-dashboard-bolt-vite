/*
  # Create Improvement Requests Table

  1. New Table
    - improvement_requests: Track improvement suggestions from sales team
    - Supports kanban workflow with defined stages
    - Links to users for assignment and creation tracking
    - Includes priority, category, and detailed tracking

  2. Features
    - Request creation and assignment
    - Kanban workflow: Suggested → Planned → In Progress → Testing → Deployed
    - Priority levels (low, medium, high, urgent)
    - Category tracking (ui, feature, bug, performance, other)
    - Impact and effort estimation
    - Comment/note tracking
    - Completion tracking with timestamps

  3. Security
    - RLS policies for proper access control
    - All authenticated users can view and create
    - Only assigned users and admins can update
*/

-- Create improvement_requests table
CREATE TABLE IF NOT EXISTS improvement_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'feature' CHECK (category IN ('ui', 'feature', 'bug', 'performance', 'workflow', 'reporting', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'suggested' CHECK (status IN ('suggested', 'planned', 'in_progress', 'testing', 'deployed', 'cancelled')),
  
  -- Impact and effort estimation
  business_impact TEXT CHECK (business_impact IN ('low', 'medium', 'high')),
  effort_estimate TEXT CHECK (effort_estimate IN ('small', 'medium', 'large', 'xl')),
  
  -- User relationships
  requested_by UUID REFERENCES auth.users(id) NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  
  -- Additional details
  current_workaround TEXT,
  expected_outcome TEXT,
  notes TEXT,
  
  -- Timestamps for workflow tracking
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  planned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  testing_at TIMESTAMP WITH TIME ZONE,
  deployed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CHECK (
    (status = 'suggested' AND suggested_at IS NOT NULL) OR
    (status = 'planned' AND planned_at IS NOT NULL) OR
    (status = 'in_progress' AND started_at IS NOT NULL) OR
    (status = 'testing' AND testing_at IS NOT NULL) OR
    (status = 'deployed' AND deployed_at IS NOT NULL) OR
    (status = 'cancelled' AND cancelled_at IS NOT NULL)
  )
);

-- Create indexes for better performance
CREATE INDEX idx_improvement_requests_status ON improvement_requests(status);
CREATE INDEX idx_improvement_requests_priority ON improvement_requests(priority);
CREATE INDEX idx_improvement_requests_category ON improvement_requests(category);
CREATE INDEX idx_improvement_requests_requested_by ON improvement_requests(requested_by);
CREATE INDEX idx_improvement_requests_assigned_to ON improvement_requests(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_improvement_requests_created_at ON improvement_requests(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_improvement_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    
    -- Auto-update status timestamps
    IF NEW.status != OLD.status THEN
        CASE NEW.status
            WHEN 'suggested' THEN NEW.suggested_at = NOW();
            WHEN 'planned' THEN NEW.planned_at = NOW();
            WHEN 'in_progress' THEN NEW.started_at = NOW();
            WHEN 'testing' THEN NEW.testing_at = NOW();
            WHEN 'deployed' THEN NEW.deployed_at = NOW();
            WHEN 'cancelled' THEN NEW.cancelled_at = NOW();
            ELSE NULL;
        END CASE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_improvement_requests_updated_at
    BEFORE UPDATE ON improvement_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_improvement_requests_updated_at();

-- Enable RLS
ALTER TABLE improvement_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- All authenticated users can view improvement requests
CREATE POLICY "Users can view all improvement requests"
    ON improvement_requests FOR SELECT
    TO authenticated
    USING (true);

-- Users can create improvement requests
CREATE POLICY "Users can create improvement requests"
    ON improvement_requests FOR INSERT
    TO authenticated
    WITH CHECK (requested_by = auth.uid());

-- Users can update their own requests or requests assigned to them
-- Admins can update any request
CREATE POLICY "Users can update own or assigned requests"
    ON improvement_requests FOR UPDATE
    TO authenticated
    USING (
        requested_by = auth.uid() OR 
        assigned_to = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Users can delete their own requests if not yet planned
-- Admins can delete any request
CREATE POLICY "Users can delete own unplanned requests"
    ON improvement_requests FOR DELETE
    TO authenticated
    USING (
        (requested_by = auth.uid() AND status = 'suggested') OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );