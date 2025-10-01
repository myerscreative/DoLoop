'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, Edit3, Trash2, RotateCcw, MoreHorizontal } from 'lucide-react'
import { taskDb } from '@/lib/db'
import { cn } from '@/lib/utils'
import { Task } from '@/lib/supabase'
import TaskForm from './TaskForm'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

type TaskItemProps = {
  task: Task
  colorTheme: any
  onUpdate: () => void
  index: number
  isCompleted?: boolean
}

export default function TaskItem({ task, colorTheme, onUpdate, index, isCompleted = false }: TaskItemProps) {
  const [isToggling, setIsToggling] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleToggleComplete = async () => {
    if (isToggling) return

    setIsToggling(true)
    try {
      const { error } = await taskDb.toggleComplete(task.id)
      if (error) {
        console.error('Error toggling task:', error)
        return
      }
      onUpdate()
    } catch (error) {
      console.error('Error toggling task:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await taskDb.delete(task.id)
      if (error) {
        console.error('Error deleting task:', error)
        return
      }
      onUpdate()
    } catch (error) {
      console.error('Error deleting task:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleEdit = () => {
    setShowActions(false)
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    onUpdate()
  }

  return (
    <>
      <div
        className={cn(
          'bg-white rounded-2xl p-4 border transition-all duration-300',
          'hover:shadow-md active:scale-[0.98]',
          isCompleted ? 'opacity-75' : '',
          task.is_completed ? 'border-gray-200' : colorTheme.border,
          // Staggered animation delay based on index
        )}
        style={{
          animationDelay: `${index * 100}ms`
        }}
      >
        <div className=\"flex items-start space-x-3\">
          {/* Completion Toggle */}
          <button
            onClick={handleToggleComplete}
            disabled={isToggling}
            className={cn(
              'flex-shrink-0 mt-0.5 transition-all duration-200',
              'hover:scale-110 active:scale-95',
              isToggling && 'opacity-50 cursor-not-allowed'
            )}
          >
            {task.is_completed ? (
              <CheckCircle2 
                size={24} 
                className={cn(
                  'transition-colors',
                  colorTheme.primary.includes('yellow') ? 'text-green-500' : 'text-green-500'
                )} 
              />
            ) : (
              <Circle 
                size={24} 
                className={cn(
                  'transition-colors hover:opacity-70',
                  colorTheme.text.replace('text-', 'text-').replace('-900', '-400')
                )} 
              />
            )}
          </button>

          {/* Task Content */}
          <div className=\"flex-1 min-w-0\">
            <div className=\"flex items-start justify-between\">
              <div className=\"flex-1 min-w-0\">
                <h4 className={cn(
                  'font-medium transition-all duration-200',
                  task.is_completed 
                    ? 'line-through text-gray-500' 
                    : 'text-gray-900'
                )}>
                  {task.name}
                </h4>
                
                {task.description && (
                  <p className={cn(
                    'text-sm mt-1 transition-all duration-200',
                    task.is_completed 
                      ? 'line-through text-gray-400' 
                      : 'text-gray-600'
                  )}>
                    {task.description}
                  </p>
                )}
                
                {/* Task Type Badge */}
                <div className=\"flex items-center mt-2\">
                  <div className={cn(
                    'inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium',
                    task.is_recurring 
                      ? `${colorTheme.primary} bg-opacity-10 ${colorTheme.text}`
                      : 'bg-gray-100 text-gray-700'
                  )}>
                    {task.is_recurring ? (
                      <>
                        <RotateCcw size={10} />
                        <span>Recurring</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={10} />
                        <span>One-time</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Menu */}
              <div className=\"relative\">
                <button
                  onClick={() => setShowActions(!showActions)}
                  className={cn(
                    'p-1 rounded-full opacity-0 hover:opacity-100 transition-opacity',
                    'hover:bg-gray-100',
                    showActions && 'opacity-100'
                  )}
                >
                  <MoreHorizontal size={16} className=\"text-gray-500\" />
                </button>

                {showActions && (
                  <div className=\"absolute right-0 top-8 bg-white rounded-lg shadow-lg border z-10 min-w-[120px]\">
                    <button
                      onClick={handleEdit}
                      className=\"w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2 text-gray-700\"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowActions(false)
                        setShowDeleteDialog(true)
                      }}
                      className=\"w-full px-3 py-2 text-left text-sm hover:bg-red-50 flex items-center space-x-2 text-red-600 border-t\"
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Completion Timestamp */}
            {task.is_completed && task.completed_at && (
              <p className=\"text-xs text-gray-400 mt-2\">
                Completed {new Date(task.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Task Form */}
      <TaskForm
        isOpen={showEditForm}
        loopId={task.loop_id}
        colorTheme={colorTheme}
        task={task}
        onClose={() => setShowEditForm(false)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title=\"Delete Task\"
        message={`Are you sure you want to delete \"${task.name}\"? This action cannot be undone.`}
        confirmText=\"Delete\"
        cancelText=\"Cancel\"
        variant=\"danger\"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteDialog(false)}
        isLoading={isDeleting}
      />

      {/* Click outside to close actions menu */}
      {showActions && (
        <div
          className=\"fixed inset-0 z-5\"
          onClick={() => setShowActions(false)}
        />
      )}
    </>
  )
}