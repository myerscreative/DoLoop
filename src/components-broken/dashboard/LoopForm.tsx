'use client'

import { useState } from 'react'
import { X, Palette, Calendar, Loader2 } from 'lucide-react'
import { cn, loopColors, LoopColorTheme } from '@/lib/utils'
import { loopDb, CreateLoopData } from '@/lib/db'

type LoopFormProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

type FormErrors = {
  name?: string
  color?: string
  reset_schedule?: string
  general?: string
}

const colorThemes: { value: LoopColorTheme; label: string; emoji: string }[] = [
  { value: 'bee-yellow', label: 'Bee Yellow', emoji: '🐝' },
  { value: 'honey-orange', label: 'Honey Orange', emoji: '🍯' },
  { value: 'morning-blue', label: 'Morning Blue', emoji: '🌅' },
  { value: 'forest-green', label: 'Forest Green', emoji: '🌲' },
  { value: 'lavender-purple', label: 'Lavender Purple', emoji: '🌸' },
  { value: 'rose-pink', label: 'Rose Pink', emoji: '🌹' }
]

const resetScheduleOptions = [
  { value: 'daily', label: 'Daily', description: 'Reset every day' },
  { value: 'weekly', label: 'Weekly', description: 'Reset every week' },
  { value: 'monthly', label: 'Monthly', description: 'Reset every month' },
  { value: 'custom', label: 'Custom', description: 'Advanced scheduling (coming soon)', disabled: true }
] as const

export default function LoopForm({ isOpen, onClose, onSuccess }: LoopFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: 'bee-yellow' as LoopColorTheme,
    reset_schedule: 'daily' as const
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens/closes
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      color: 'bee-yellow',
      reset_schedule: 'daily'
    })
    setErrors({})
    setIsSubmitting(false)
    onClose()
  }

  const validateForm = (): FormErrors => {
    const newErrors: FormErrors = {}

    // Validate name
    if (!formData.name.trim()) {
      newErrors.name = 'Loop name is required'
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Loop name must be at least 2 characters'
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Loop name must be less than 50 characters'
    }

    // Validate color
    if (!formData.color) {
      newErrors.color = 'Please select a color theme'
    }

    // Validate reset schedule
    if (!formData.reset_schedule) {
      newErrors.reset_schedule = 'Please select a reset schedule'
    }

    return newErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous errors
    setErrors({})
    
    // Validate form
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const createData: CreateLoopData = {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        reset_schedule: formData.reset_schedule
      }

      const { data, error } = await loopDb.create(createData)

      if (error) {
        setErrors({ general: error })
        return
      }

      if (data) {
        // Success! Close modal and refresh
        handleClose()
        onSuccess()
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const selectedTheme = loopColors[formData.color]

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50\">
      <div className=\"bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto\">
        {/* Header */}
        <div className=\"flex items-center justify-between p-6 pb-4\">
          <div className=\"flex items-center space-x-3\">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedTheme.primary}`}>
              <span className=\"text-lg\">🐝</span>
            </div>
            <h2 className=\"text-xl font-semibold text-gray-900\">Create New Loop</h2>
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

          {/* Loop Name */}
          <div>
            <label htmlFor=\"loop-name\" className=\"block text-sm font-medium text-gray-700 mb-2\">
              Loop Name <span className=\"text-red-500\">*</span>
            </label>
            <input
              id=\"loop-name\"
              type=\"text\"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={cn(
                'w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-colors',
                'text-gray-900 placeholder-gray-500',
                errors.name
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-yellow-400'
              )}
              placeholder=\"e.g., Morning Routine\"
              disabled={isSubmitting}
              maxLength={50}
            />
            {errors.name && (
              <p className=\"mt-1 text-sm text-red-600\">{errors.name}</p>
            )}
            <p className=\"mt-1 text-xs text-gray-500\">
              {formData.name.length}/50 characters
            </p>
          </div>

          {/* Description (Optional) */}
          <div>
            <label htmlFor=\"loop-description\" className=\"block text-sm font-medium text-gray-700 mb-2\">
              Description
            </label>
            <textarea
              id=\"loop-description\"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className=\"w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-colors resize-none\"
              placeholder=\"What's this loop for? (optional)\"
              rows={2}
              disabled={isSubmitting}
              maxLength={200}
            />
            <p className=\"mt-1 text-xs text-gray-500\">
              {formData.description.length}/200 characters
            </p>
          </div>

          {/* Color Theme */}
          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-3\">
              <Palette size={16} className=\"inline mr-1\" />
              Color Theme <span className=\"text-red-500\">*</span>
            </label>
            <div className=\"grid grid-cols-2 gap-3\">
              {colorThemes.map(theme => {
                const themeColors = loopColors[theme.value]
                const isSelected = formData.color === theme.value
                
                return (
                  <button
                    key={theme.value}
                    type=\"button\"
                    onClick={() => setFormData(prev => ({ ...prev, color: theme.value }))}
                    disabled={isSubmitting}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-left',
                      'hover:scale-105 active:scale-95',
                      isSelected
                        ? `${themeColors.border} ${themeColors.light}`
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <div className=\"flex items-center space-x-2\">
                      <div className={`w-4 h-4 rounded-full ${themeColors.primary}`} />
                      <span className=\"text-xs font-medium text-gray-900\">
                        {theme.emoji} {theme.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
            {errors.color && (
              <p className=\"mt-2 text-sm text-red-600\">{errors.color}</p>
            )}
          </div>

          {/* Reset Schedule */}
          <div>
            <label className=\"block text-sm font-medium text-gray-700 mb-3\">
              <Calendar size={16} className=\"inline mr-1\" />
              Reset Schedule <span className=\"text-red-500\">*</span>
            </label>
            <div className=\"space-y-2\">
              {resetScheduleOptions.map(option => (
                <button
                  key={option.value}
                  type=\"button\"
                  onClick={() => !option.disabled && setFormData(prev => ({ ...prev, reset_schedule: option.value }))}
                  disabled={isSubmitting || option.disabled}
                  className={cn(
                    'w-full p-3 rounded-xl border-2 transition-colors text-left',
                    'hover:bg-gray-50',
                    formData.reset_schedule === option.value
                      ? `${selectedTheme.border} ${selectedTheme.light}`
                      : 'border-gray-200',
                    option.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className=\"flex items-center justify-between\">
                    <div>
                      <p className=\"font-medium text-gray-900\">{option.label}</p>
                      <p className=\"text-xs text-gray-500\">{option.description}</p>
                    </div>
                    <div className={cn(
                      'w-4 h-4 rounded-full border-2',
                      formData.reset_schedule === option.value
                        ? `${selectedTheme.primary} border-transparent`
                        : 'border-gray-300'
                    )} />
                  </div>
                </button>
              ))}
            </div>
            {errors.reset_schedule && (
              <p className=\"mt-2 text-sm text-red-600\">{errors.reset_schedule}</p>
            )}
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
              disabled={isSubmitting}
              className={cn(
                'flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors',
                'flex items-center justify-center space-x-2',
                selectedTheme.primary,
                'hover:opacity-90 active:opacity-95',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className=\"animate-spin\" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Loop</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}