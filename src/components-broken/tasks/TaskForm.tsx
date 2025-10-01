'use client'

import { useState } from 'react'
import { X, Loader2, CheckCircle, RotateCcw } from 'lucide-react'
import { taskDb, CreateTaskData } from '@/lib/db'
import { cn } from '@/lib/utils'
import { TaskFormState, TaskFormErrors } from '@/types'
import { Task } from '@/lib/supabase'

type TaskFormProps = {
  isOpen: boolean
  loopId: string
  colorTheme: any
  task?: Task // For editing existing tasks
  onClose: () => void
  onSuccess: () => void
}

const taskTypeOptions = [
  {
    value: true,
    label: 'Recurring',
    description: 'Resets with the loop schedule',
    icon: RotateCcw
  },
  {
    value: false,
    label: 'One-time',
    description: 'Complete once and done',
    icon: CheckCircle
  }
] as const

export default function TaskForm({ 
  isOpen, 
  loopId, 
  colorTheme, 
  task, 
  onClose, 
  onSuccess 
}: TaskFormProps) {
  const isEditing = !!task

  const [formData, setFormData] = useState<TaskFormState>({
    name: task?.name || '',
    description: task?.description || '',
    is_recurring: task?.is_recurring ?? true
  })
  
  const [errors, setErrors] = useState<TaskFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClose = () => {
    if (!isEditing) {
      setFormData({
        name: '',
        description: '',
        is_recurring: true
      })
    }
    setErrors({})
    setIsSubmitting(false)
    onClose()
  }

  const validateForm = (): TaskFormErrors => {
    const newErrors: TaskFormErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Task name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Task name must be at least 2 characters'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Task name must be less than 100 characters'
    }

    // Validate description (optional but has limits)
    if (formData.description && formData.description.trim().length > 200) {
      newErrors.description = 'Description must be less than 200 characters'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setErrors({})
    
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const taskData: CreateTaskData = {
        name: formData.name,
        description: formData.description || undefined,
        is_recurring: formData.is_recurring
      }

      if (isEditing && task) {
        // Update existing task
        const { data, error } = await taskDb.update(task.id, taskData)
        
        if (error) {
          setErrors({ general: error })
          return
        }
      } else {
        // Create new task
        const { data, error } = await taskDb.create(loopId, taskData)
        
        if (error) {
          setErrors({ general: error })
          return
        }
      }

      // Success!
      handleClose()
      onSuccess()
    } catch (error: any) {
      setErrors({ general: error.message || 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50\">
      <div className=\"bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto\">
        {/* Header */}
        <div className=\"flex items-center justify-between p-6 pb-4\">
          <div className=\"flex items-center space-x-3\">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${colorTheme.primary}`}>
              <span className=\"text-lg\">🐝</span>
            </div>
            <h2 className=\"text-xl font-semibold text-gray-900\">
              {isEditing ? 'Edit Task' : 'Add New Task'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className=\"p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50\"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className=\"px-6 pb-6 space-y-6\">
          {/* General Error */}
          {errors.general && (
            <div className=\"p-3 rounded-lg bg-red-50 border border-red-200\">
              <p className=\"text-sm text-red-700\">{errors.general}</p>
            </div>
          )}

          {/* Task Name */}
          <div>
            <label htmlFor=\"task-name\" className=\"block text-sm font-medium text-gray-700 mb-2\">
              Task Name <span className=\"text-red-500\">*</span>
            </label>
            <input
              id=\"task-name\"
              type=\"text\"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={cn(
                'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-colors',
                'text-gray-900 placeholder-gray-500',
                errors.name
                  ? 'border-red-300 focus:ring-red-400'
                  : `border-gray-300 focus:ring-${colorTheme.primary.includes('yellow') ? 'yellow' : 'blue'}-400`
              )}
              placeholder=\"e.g., Drink water\"
              disabled={isSubmitting}
              maxLength={100}
              autoFocus
            />
            {errors.name && (
              <p className=\"mt-1 text-sm text-red-600\">{errors.name}</p>
            )}
            <p className=\"mt-1 text-xs text-gray-500\">
              {formData.name.length}/100 characters
            </p>
          </div>

          {/* Description (Optional) */}
          <div>
            <label htmlFor=\"task-description\" className=\"block text-sm font-medium text-gray-700 mb-2\">
              Description
            </label>
            <textarea
              id=\"task-description\"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={cn(
                'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-colors resize-none',
                'text-gray-900 placeholder-gray-500',
                errors.description
                  ? 'border-red-300 focus:ring-red-400'
                  : `border-gray-300 focus:ring-${colorTheme.primary.includes('yellow') ? 'yellow' : 'blue'}-400`
              )}
              placeholder=\"Add more details (optional)\"
              rows={2}
              disabled={isSubmitting}
              maxLength={200}
            />
            {errors.description && (
              <p className=\"mt-1 text-sm text-red-600\">{errors.description}</p>
            )}
            <p className=\"mt-1 text-xs text-gray-500\">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Task Type */}
          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-3\">
              Task Type <span className=\"text-red-500\">*</span>
            </label>
            <div className=\"space-y-3\">
              {taskTypeOptions.map(option => {
                const Icon = option.icon
                const isSelected = formData.is_recurring === option.value
                
                return (
                  <button
                    key={String(option.value)}
                    type=\"button\"
                    onClick={() => setFormData(prev => ({ ...prev, is_recurring: option.value }))}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full p-4 rounded-xl border-2 transition-all text-left',
                      'hover:bg-gray-50 active:scale-[0.98]',
                      isSelected
                        ? `${colorTheme.border} ${colorTheme.light}`
                        : 'border-gray-200'
                    )}
                  >
                    <div className=\"flex items-start space-x-3\">
                      <div className={cn(
                        'h-6 w-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5',
                        isSelected
                          ? `${colorTheme.primary} border-transparent`
                          : 'border-gray-300'
                      )}>
                        {isSelected && <div className=\"w-2 h-2 bg-white rounded-full\" />}
                      </div>
                      <div className=\"flex-1 min-w-0\">
                        <div className=\"flex items-center space-x-2 mb-1\">
                          <Icon size={16} className={isSelected ? colorTheme.text.replace('text-', 'text-') : 'text-gray-400'} />
                          <h4 className=\"font-semibold text-gray-900\">{option.label}</h4>
                        </div>
                        <p className=\"text-sm text-gray-600\">{option.description}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className=\"flex space-x-3 pt-4\">
            <button
              type=\"button\"
              onClick={handleClose}
              disabled={isSubmitting}
              className=\"flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50\"
            >
              Cancel
            </button>
            <button
              type=\"submit\"
              disabled={isSubmitting || !formData.name.trim()}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-medium text-white transition-all',
                'flex items-center justify-center space-x-2',
                colorTheme.primary,
                'hover:opacity-90 active:opacity-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className=\"animate-spin\" />
                  <span>{isEditing ? 'Updating...' : 'Adding...'}</span>
                </>
              ) : (
                <span>{isEditing ? 'Update Task' : 'Add Task'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}