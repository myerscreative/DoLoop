'use client'

import { Task } from '@/lib/supabase'
import TaskItem from './TaskItem'

type TaskListProps = {
  tasks: Task[]
  colorTheme: any
  onTaskUpdate: () => void
}

export default function TaskList({ tasks, colorTheme, onTaskUpdate }: TaskListProps) {
  // Sort tasks: incomplete first, then completed, then by creation date
  const sortedTasks = [...tasks].sort((a, b) => {
    // Primary sort: incomplete tasks first
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1
    }
    
    // Secondary sort: by order_index if available, then by creation date
    if (a.order_index !== b.order_index) {
      return a.order_index - b.order_index
    }
    
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  const completedTasks = tasks.filter(task => task.is_completed)
  const incompleteTasks = tasks.filter(task => !task.is_completed)

  return (
    <div className=\"p-4 space-y-4\">
      {/* Active Tasks */}
      {incompleteTasks.length > 0 && (
        <div className=\"space-y-2\">
          <h3 className=\"text-sm font-medium text-gray-700 mb-3\">
            Tasks to Complete ({incompleteTasks.length})
          </h3>
          <div className=\"space-y-2\">
            {sortedTasks
              .filter(task => !task.is_completed)
              .map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  colorTheme={colorTheme}
                  onUpdate={onTaskUpdate}
                  index={index}
                />
              ))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className=\"space-y-2\">
          <h3 className=\"text-sm font-medium text-gray-500 mb-3\">
            Completed Tasks ({completedTasks.length})
          </h3>
          <div className=\"space-y-2 opacity-75\">
            {sortedTasks
              .filter(task => task.is_completed)
              .map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  colorTheme={colorTheme}
                  onUpdate={onTaskUpdate}
                  index={index}
                  isCompleted
                />
              ))}
          </div>
        </div>
      )}

      {/* Progress Summary */}
      <div className={`mt-8 p-4 rounded-2xl ${colorTheme.light} border ${colorTheme.border}`}>
        <div className=\"flex items-center justify-between\">
          <div className=\"flex items-center space-x-2\">
            <div className={`h-3 w-3 rounded-full ${colorTheme.primary}`} />
            <span className={`text-sm font-medium ${colorTheme.text}`}>
              Progress Summary
            </span>
          </div>
          <span className={`text-sm font-semibold ${colorTheme.text}`}>
            {completedTasks.length}/{tasks.length}
          </span>
        </div>
        
        {tasks.length > 0 && (
          <div className=\"mt-3 space-y-2 text-xs\">
            <div className=\"flex justify-between items-center\">
              <span className={`${colorTheme.text} opacity-80`}>
                {incompleteTasks.length} remaining
              </span>
              <span className={`${colorTheme.text} opacity-80`}>
                {Math.round((completedTasks.length / tasks.length) * 100)}% complete
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}