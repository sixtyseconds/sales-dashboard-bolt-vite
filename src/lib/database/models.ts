/**
 * Database model definitions
 * 
 * This file defines TypeScript interfaces that match our database schema
 * to provide type safety across the application.
 */

/**
 * Deal Stage model
 */
export interface DealStage {
  id: string;
  name: string;
  description?: string;
  color: string;
  order_position: number;
  default_probability: number;
  created_at: string;
  updated_at: string;
}

/**
 * Deal model
 */
export interface Deal {
  id: string;
  name: string;
  company: string;
  contact_name?: string;
  contact_email?: string;
  contact_phone?: string;
  value: number;
  description?: string;
  notes?: string;
  stage_id: string;
  owner_id: string;
  expected_close_date?: string;
  probability?: number;
  status: 'active' | 'archived' | 'deleted';
  created_at: string;
  updated_at: string;
  stage_changed_at: string;
  next_steps?: string;
  contact_identifier?: string;
  contact_identifier_type?: string;
  
  // Joined relations
  deal_stages?: DealStage;
  deal_activities?: DealActivity[];
  
  // Computed fields
  daysInStage?: number;
  timeStatus?: 'normal' | 'warning' | 'danger';
}

/**
 * Deal Activity model
 */
export interface DealActivity {
  id: string;
  deal_id: string;
  user_id: string;
  activity_type: 'note' | 'call' | 'email' | 'meeting' | 'task' | 'stage_change';
  notes?: string;
  due_date?: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined relations
  profiles?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

/**
 * Deal Stage History model
 */
export interface DealStageHistory {
  id: string;
  deal_id: string;
  stage_id: string;
  user_id: string;
  entered_at: string;
  exited_at?: string;
  duration_seconds?: number;
}

/**
 * User Profile model
 */
export interface UserProfile {
  id: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
} 