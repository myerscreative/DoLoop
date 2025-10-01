import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// DoLoop color themes
export const loopColors = {
  'bee-yellow': {
    primary: 'bg-yellow-400',
    light: 'bg-yellow-50',
    dark: 'bg-yellow-500',
    text: 'text-yellow-900',
    border: 'border-yellow-200'
  },
  'honey-orange': {
    primary: 'bg-orange-400',
    light: 'bg-orange-50',
    dark: 'bg-orange-500',
    text: 'text-orange-900',
    border: 'border-orange-200'
  },
  'morning-blue': {
    primary: 'bg-blue-400',
    light: 'bg-blue-50',
    dark: 'bg-blue-500',
    text: 'text-blue-900',
    border: 'border-blue-200'
  },
  'forest-green': {
    primary: 'bg-green-400',
    light: 'bg-green-50',
    dark: 'bg-green-500',
    text: 'text-green-900',
    border: 'border-green-200'
  },
  'lavender-purple': {
    primary: 'bg-purple-400',
    light: 'bg-purple-50',
    dark: 'bg-purple-500',
    text: 'text-purple-900',
    border: 'border-purple-200'
  },
  'rose-pink': {
    primary: 'bg-pink-400',
    light: 'bg-pink-50',
    dark: 'bg-pink-500',
    text: 'text-pink-900',
    border: 'border-pink-200'
  }
} as const

export type LoopColorTheme = keyof typeof loopColors

// Date utilities for loop resets
export function getNextResetDate(schedule: 'daily' | 'weekly' | 'monthly' | 'custom', resetDay?: number): Date {
  const now = new Date()
  
  switch (schedule) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1))
    
    case 'weekly':
      const weekDay = resetDay || 1 // Default to Monday
      const daysUntilReset = (weekDay - now.getDay() + 7) % 7 || 7
      return new Date(now.setDate(now.getDate() + daysUntilReset))
    
    case 'monthly':
      const monthDay = resetDay || 1 // Default to 1st of month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, monthDay)
      return nextMonth
    
    default:
      return new Date(now.setDate(now.getDate() + 1))
  }
}

// Progress calculation
export function calculateProgress(completedTasks: number, totalTasks: number): number {
  if (totalTasks === 0) return 0
  return Math.round((completedTasks / totalTasks) * 100)
}