import { supabase, Loop, Task, Profile } from './supabase'
import { LoopColorTheme } from './utils'

// Types for database operations
export type CreateLoopData = {
  name: string
  description?: string
  color: LoopColorTheme
  reset_schedule: 'daily' | 'weekly' | 'monthly' | 'custom'
  reset_day?: number
}

export type CreateTaskData = {
  name: string
  description?: string
  is_recurring?: boolean
  order_index?: number
}

// Loop operations
export const loopDb = {
  // Create a new loop
  async create(data: CreateLoopData): Promise<{ data: Loop | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data: loop, error } = await supabase
        .from('loops')
        .insert({
          user_id: user.id,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          color: data.color,
          reset_schedule: data.reset_schedule,
          reset_day: data.reset_day || null,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating loop:', error)
        return { data: null, error: error.message }
      }

      return { data: loop, error: null }
    } catch (error: any) {
      console.error('Unexpected error creating loop:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    }
  },

  // Get all loops for current user
  async getAll(): Promise<{ data: Loop[] | null; error: string | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return { data: null, error: 'User not authenticated' }
      }

      const { data: loops, error } = await supabase
        .from('loops')
        .select(`
          *,
          tasks (*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching loops:', error)
        return { data: null, error: error.message }
      }

      return { data: loops || [], error: null }
    } catch (error: any) {
      console.error('Unexpected error fetching loops:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    }
  },

  // Update a loop
  async update(id: string, data: Partial<CreateLoopData>): Promise<{ data: Loop | null; error: string | null }> {
    try {
      const updateData: any = {}
      
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.description !== undefined) updateData.description = data.description?.trim() || null
      if (data.color !== undefined) updateData.color = data.color
      if (data.reset_schedule !== undefined) updateData.reset_schedule = data.reset_schedule
      if (data.reset_day !== undefined) updateData.reset_day = data.reset_day

      const { data: loop, error } = await supabase
        .from('loops')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating loop:', error)
        return { data: null, error: error.message }
      }

      return { data: loop, error: null }
    } catch (error: any) {
      console.error('Unexpected error updating loop:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    }
  },

  // Delete a loop (soft delete by setting is_active to false)
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('loops')
        .update({ is_active: false })
        .eq('id', id)

      if (error) {
        console.error('Error deleting loop:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Unexpected error deleting loop:', error)
      return { error: error.message || 'An unexpected error occurred' }
    }
  }
}

// Additional utility functions for loops
export const loopUtils = {
  // Get a specific loop with all tasks
  async getById(id: string): Promise<{ data: Loop | null; error: string | null }> {
    try {
      const { data: loop, error } = await supabase
        .from('loops')
        .select(`
          *,
          tasks (*)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single()

      if (error) {
        console.error('Error fetching loop:', error)
        return { data: null, error: error.message }
      }

      return { data: loop, error: null }
    } catch (error: any) {
      console.error('Unexpected error fetching loop:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    }
  },

  // Calculate loop progress
  calculateProgress(tasks: Task[]): { completed: number; total: number; percentage: number } {
    const total = tasks.length
    const completed = tasks.filter(task => task.is_completed).length
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100)
    
    return { completed, total, percentage }
  }
}

// Task operations
export const taskDb = {
  // Create a new task within a loop
  async create(loopId: string, data: CreateTaskData): Promise<{ data: Task | null; error: string | null }> {
    try {
      const { data: task, error } = await supabase
        .from('tasks')
        .insert({
          loop_id: loopId,
          name: data.name.trim(),
          description: data.description?.trim() || null,
          is_recurring: data.is_recurring ?? true,
          is_completed: false,
          order_index: data.order_index ?? 0
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating task:', error)
        return { data: null, error: error.message }
      }

      return { data: task, error: null }
    } catch (error: any) {
      console.error('Unexpected error creating task:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    }
  },

  // Toggle task completion
  async toggleComplete(id: string): Promise<{ data: Task | null; error: string | null }> {
    try {
      // First get the current state
      const { data: currentTask, error: fetchError } = await supabase
        .from('tasks')
        .select('is_completed')
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Error fetching task:', fetchError)
        return { data: null, error: fetchError.message }
      }

      // Toggle the completion state
      const newCompletedState = !currentTask.is_completed
      const updateData: any = {
        is_completed: newCompletedState,
        completed_at: newCompletedState ? new Date().toISOString() : null
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating task:', error)
        return { data: null, error: error.message }
      }

      return { data: task, error: null }
    } catch (error: any) {
      console.error('Unexpected error toggling task:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    }
  },

  // Update task
  async update(id: string, data: Partial<CreateTaskData>): Promise<{ data: Task | null; error: string | null }> {
    try {
      const updateData: any = {}
      
      if (data.name !== undefined) updateData.name = data.name.trim()
      if (data.description !== undefined) updateData.description = data.description?.trim() || null
      if (data.is_recurring !== undefined) updateData.is_recurring = data.is_recurring
      if (data.order_index !== undefined) updateData.order_index = data.order_index

      const { data: task, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating task:', error)
        return { data: null, error: error.message }
      }

      return { data: task, error: null }
    } catch (error: any) {
      console.error('Unexpected error updating task:', error)
      return { data: null, error: error.message || 'An unexpected error occurred' }
    }
  },

  // Delete task
  async delete(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting task:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error: any) {
      console.error('Unexpected error deleting task:', error)
      return { error: error.message || 'An unexpected error occurred' }
    }
  }
}