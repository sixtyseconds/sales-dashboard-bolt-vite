export type ImprovementRequestStatus = 
  | 'suggested' 
  | 'planned' 
  | 'in_progress' 
  | 'testing' 
  | 'deployed' 
  | 'cancelled';

export type ImprovementRequestPriority = 
  | 'low' 
  | 'medium' 
  | 'high' 
  | 'urgent';

export type ImprovementRequestCategory = 
  | 'ui' 
  | 'feature' 
  | 'bug' 
  | 'performance' 
  | 'workflow' 
  | 'reporting' 
  | 'other';

export type BusinessImpact = 'low' | 'medium' | 'high';
export type EffortEstimate = 'small' | 'medium' | 'large' | 'xl';

export interface ImprovementRequest {
  id: string;
  title: string;
  description: string;
  category: ImprovementRequestCategory;
  priority: ImprovementRequestPriority;
  status: ImprovementRequestStatus;
  
  // Impact and effort
  business_impact?: BusinessImpact;
  effort_estimate?: EffortEstimate;
  
  // User relationships
  requested_by: string;
  assigned_to?: string;
  
  // Additional details
  current_workaround?: string;
  expected_outcome?: string;
  notes?: string;
  
  // Timestamps
  suggested_at: string;
  planned_at?: string;
  started_at?: string;
  testing_at?: string;
  deployed_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
  
  // Populated relationships (for display)
  requester?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  };
  assignee?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
    avatar_url?: string;
  };
}

export interface CreateImprovementRequestData {
  title: string;
  description: string;
  category?: ImprovementRequestCategory;
  priority?: ImprovementRequestPriority;
  business_impact?: BusinessImpact;
  effort_estimate?: EffortEstimate;
  current_workaround?: string;
  expected_outcome?: string;
  assigned_to?: string;
}

export interface UpdateImprovementRequestData {
  title?: string;
  description?: string;
  category?: ImprovementRequestCategory;
  priority?: ImprovementRequestPriority;
  status?: ImprovementRequestStatus;
  business_impact?: BusinessImpact;
  effort_estimate?: EffortEstimate;
  current_workaround?: string;
  expected_outcome?: string;
  notes?: string;
  assigned_to?: string;
}

export interface ImprovementRequestFilters {
  status?: ImprovementRequestStatus[];
  priority?: ImprovementRequestPriority[];
  category?: ImprovementRequestCategory[];
  assigned_to?: string;
  requested_by?: string;
}