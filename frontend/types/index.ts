export interface User {
  _id: string;
  email: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface Loop {
  _id: string;
  id: string;
  name: string;
  description?: string;
  color: string;  // One of our brand colors
  owner_id: string;
  reset_rule: 'manual' | 'daily' | 'weekly';
  created_at: Date;
  updated_at: Date;
  progress?: number;  // Calculated field 0-100
  total_tasks?: number;
  completed_tasks?: number;
  is_favorite?: boolean;  // New field for favorites
}

export interface Task {
  id: string;
  _id: string;
  loop_id: string;
  description: string;
  type: 'recurring' | 'one-time';
  assigned_user_id?: string;
  assigned_email?: string;
  due_date?: Date;
  tags?: string[];
  notes?: string;
  attachments?: any[];
  status: 'pending' | 'completed' | 'archived';
  completed_at?: Date;
  created_at: Date;
  updated_at: Date;
  order: number;  // For task ordering
}

export interface LoopMember {
  _id: string;
  user_id: string;
  loop_id: string;
  role: 'owner' | 'member';
  joined_at: Date;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface CreateLoopData {
  name: string;
  description?: string;
  color: string;
  reset_rule: 'manual' | 'daily' | 'weekly';
}

export interface CreateTaskData {
  loop_id: string;
  description: string;
  type: 'recurring' | 'one-time';
  assigned_user_id?: string;
}