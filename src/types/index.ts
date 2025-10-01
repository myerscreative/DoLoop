// DoLoop TypeScript Types - Clean Implementation

export interface Loop {
  id: string
  title: string
  description?: string
  created_at: string
  updated_at: string
  user_id: string
  color_theme: LoopColorTheme
  is_active: boolean
}

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  loop_id: string
  created_at: string
  updated_at: string
  due_date?: string
  priority: 'low' | 'medium' | 'high'
}

export interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type LoopColorTheme = 
  | 'yellow' 
  | 'green' 
  | 'blue' 
  | 'purple' 
  | 'pink' 
  | 'orange'

export interface CreateLoopData {
  title: string
  description?: string
  color_theme: LoopColorTheme
}

export interface CreateTaskData {
  title: string
  description?: string
  loop_id: string
  priority: 'low' | 'medium' | 'high'
  due_date?: string
}

export interface AuthContextType {
  user: Profile | null
  session: { access_token: string; user: Profile } | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  loading: boolean
}