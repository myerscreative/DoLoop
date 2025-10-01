import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Only create supabase client if proper credentials are provided
export const supabase = supabaseUrl.includes('placeholder') 
  ? null 
  : createClient(supabaseUrl, supabaseAnonKey)

// Types for our database tables
export type Profile = {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Loop = {
  id: string
  user_id: string
  name: string
  description?: string
  color: string
  reset_schedule: 'daily' | 'weekly' | 'monthly' | 'custom'
  reset_day?: number // For weekly/monthly resets
  is_active: boolean
  created_at: string
  updated_at: string
}

export type Task = {
  id: string
  loop_id: string
  name: string
  description?: string
  is_recurring: boolean
  is_completed: boolean
  order_index: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export type LoopMember = {
  id: string
  loop_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member'
  invited_by: string
  joined_at?: string
  created_at: string
}