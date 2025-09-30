import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (generated from Supabase CLI or inferred)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          display_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      loops: {
        Row: {
          id: string
          owner: string
          name: string
          description: string | null
          color: string
          reset_rule: 'daily' | 'weekly' | 'monthly' | 'custom'
          created_at: string
        }
        Insert: {
          id?: string
          owner: string
          name: string
          description?: string | null
          color?: string
          reset_rule?: 'daily' | 'weekly' | 'monthly' | 'custom'
          created_at?: string
        }
        Update: {
          id?: string
          owner?: string
          name?: string
          description?: string | null
          color?: string
          reset_rule?: 'daily' | 'weekly' | 'monthly' | 'custom'
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          loop_id: string
          description: string
          type: 'recurring' | 'one_time'
          assigned_user_id: string | null
          status: 'pending' | 'completed'
          due_date: string | null
          archived_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          loop_id: string
          description: string
          type?: 'recurring' | 'one_time'
          assigned_user_id?: string | null
          status?: 'pending' | 'completed'
          due_date?: string | null
          archived_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          loop_id?: string
          description?: string
          type?: 'recurring' | 'one_time'
          assigned_user_id?: string | null
          status?: 'pending' | 'completed'
          due_date?: string | null
          archived_at?: string | null
          created_at?: string
        }
      }
      loop_members: {
        Row: {
          id: string
          loop_id: string
          user_id: string
          role: 'owner' | 'editor' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          loop_id: string
          user_id: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          loop_id?: string
          user_id?: string
          role?: 'owner' | 'editor' | 'viewer'
          created_at?: string
        }
      }
    }
  }
}