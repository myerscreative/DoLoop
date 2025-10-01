// DoLoop TypeScript Types
export type { Loop, Task, Profile, LoopMember } from '@/lib/supabase'
export type { LoopColorTheme } from '@/lib/utils'
export type { CreateLoopData, CreateTaskData } from '@/lib/db'

// Extended types for UI components
export interface LoopWithTasks extends Omit<Loop, 'tasks'> {
  tasks: Task[]
}

export interface TaskWithMetadata extends Task {
  loop?: Loop
  completedAt?: string | null
}

// UI State types
export interface LoopDetailState {
  loop: LoopWithTasks | null
  loading: boolean
  error: string | null
}

export interface TaskFormState {
  name: string
  description: string
  is_recurring: boolean
}

export interface TaskFormErrors {
  name?: string
  description?: string
  general?: string
}

// Navigation and modal types
export interface ModalProps {
  isOpen: boolean
  onClose: () => void
}

export interface ConfirmDialogProps extends ModalProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  variant?: 'danger' | 'warning' | 'info'
}

// Task interaction types
export type TaskAction = 'toggle' | 'edit' | 'delete'

export interface TaskActionPayload {
  taskId: string
  action: TaskAction
  data?: Partial<TaskFormState>
}

// Progress tracking
export interface ProgressStats {
  completed: number
  total: number
  percentage: number
  completedToday?: number
  streak?: number
}

// Theme variants for different task states
export interface TaskTheme {
  container: string
  checkbox: string
  text: string
  description: string
  actions: string
}

// Animation and transition types
export interface AnimationConfig {
  duration: number
  easing: string
  delay?: number
}