export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          first_name: string | null
          last_name: string | null
          full_name: string | null
          avatar_url: string | null
          role: string | null
          department: string | null
          stage: string | null
          is_admin: boolean | null
          created_at: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          id: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          department?: string | null
          stage?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string | null
          department?: string | null
          stage?: string | null
          is_admin?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      targets: {
        Row: {
          id: string
          user_id: string | null
          revenue_target: number | null
          outbound_target: number | null
          meetings_target: number | null
          proposal_target: number | null
          start_date: string | null
          end_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          revenue_target?: number | null
          outbound_target?: number | null
          meetings_target?: number | null
          proposal_target?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          revenue_target?: number | null
          outbound_target?: number | null
          meetings_target?: number | null
          proposal_target?: number | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "targets_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add other tables as needed
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_users_with_targets: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          stage: string
          avatar_url: string | null
          is_admin: boolean
          created_at: string
          last_sign_in_at: string | null
          targets: Array<{
            id: string
            user_id: string
            revenue_target: number | null
            outbound_target: number | null
            meetings_target: number | null
            proposal_target: number | null
            start_date: string | null
            end_date: string | null
            created_at: string
            updated_at: string
          }>
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
