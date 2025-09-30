'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface CreateLoopFormProps {
  onLoopCreated: () => void
  onCancel: () => void
}

const COLORS = [
  '#FFC107', // Yellow (default)
  '#FF5722', // Red
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#795548', // Brown
  '#607D8B', // Blue Grey
]

const RESET_RULES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
] as const

export function CreateLoopForm({ onLoopCreated, onCancel }: CreateLoopFormProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [resetRule, setResetRule] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('weekly')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('loops')
        .insert({
          owner: user.id,
          name: name.trim(),
          description: description.trim() || null,
          color,
          reset_rule: resetRule,
        })

      if (error) throw error

      onLoopCreated()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create loop')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Create New Loop</h2>
            <p className="text-gray-600 mt-1">
              Set up a recurring checklist to build consistent routines
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Loop Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="e.g., Morning Routine, Weekly Cleaning, Workout Schedule"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Optional: Add more details about this loop..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Color Theme
            </label>
            <div className="flex flex-wrap gap-3">
              {COLORS.map((colorOption) => (
                <button
                  key={colorOption}
                  type="button"
                  onClick={() => setColor(colorOption)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    color === colorOption
                      ? 'border-gray-400 ring-2 ring-blue-500'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ backgroundColor: colorOption }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Reset Schedule
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {RESET_RULES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setResetRule(value)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    resetRule === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              {loading ? 'Creating...' : 'Create Loop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}