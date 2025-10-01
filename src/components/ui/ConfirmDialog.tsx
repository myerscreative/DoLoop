'use client'

import { Loader2, AlertTriangle, Info, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ConfirmDialogProps = {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onClose: () => void
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-100',
    confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100',
    confirmButton: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500'
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100',
    confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  }
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  variant = 'info',
  isLoading = false
}: ConfirmDialogProps) {
  const style = variantStyles[variant]
  const Icon = style.icon

  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm()
    }
  }

  const handleCancel = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50\">
      <div className=\"bg-white rounded-2xl w-full max-w-sm mx-auto overflow-hidden shadow-xl\">
        {/* Header with Icon */}
        <div className=\"p-6 pb-4\">
          <div className=\"flex items-center space-x-4\">
            <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', style.iconBg)}>
              <Icon size={24} className={style.iconColor} />
            </div>
            <div className=\"flex-1\">
              <h3 className=\"text-lg font-semibold text-gray-900\">{title}</h3>
            </div>
          </div>
        </div>

        {/* Message */}
        <div className=\"px-6 pb-6\">
          <p className=\"text-gray-600 leading-relaxed\">{message}</p>
        </div>

        {/* Actions */}
        <div className=\"p-6 pt-0 flex space-x-3\">
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              'flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium',
              'text-gray-700 hover:bg-gray-50 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 py-3 px-4 rounded-xl font-medium text-white transition-colors',
              'flex items-center justify-center space-x-2',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              style.confirmButton
            )}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className=\"animate-spin\" />
                <span>Please wait...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}