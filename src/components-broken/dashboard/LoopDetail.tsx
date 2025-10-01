'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Plus, Settings, Calendar, Target } from 'lucide-react'
import { loopUtils, loopDb } from '@/lib/db'
import { loopColors, cn } from '@/lib/utils'
import { LoopWithTasks, LoopColorTheme } from '@/types'
import { Task } from '@/lib/supabase'
import LoadingSpinner from '@/components/LoadingSpinner'
import TaskForm from '@/components/tasks/TaskForm'
import TaskList from '@/components/tasks/TaskList'

type LoopDetailProps = {
  loopId: string
  isOpen: boolean
  onClose: () => void
  onLoopUpdate?: () => void
}

export default function LoopDetail({ loopId, isOpen, onClose, onLoopUpdate }: LoopDetailProps) {
  const [loop, setLoop] = useState<LoopWithTasks | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showTaskForm, setShowTaskForm] = useState(false)

  useEffect(() => {
    if (isOpen && loopId) {
      fetchLoop()
    }
  }, [isOpen, loopId])

  const fetchLoop = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fetchError } = await loopUtils.getById(loopId)
      
      if (fetchError) {
        setError(fetchError)
        return
      }

      if (data) {
        setLoop(data as LoopWithTasks)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load loop')
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdate = () => {
    fetchLoop() // Refresh the loop data
    if (onLoopUpdate) {
      onLoopUpdate() // Update the dashboard
    }
  }

  const handleClose = () => {
    setLoop(null)
    setError(null)
    setShowTaskForm(false)
    onClose()
  }

  if (!isOpen) return null

  const colorTheme = loop ? loopColors[loop.color as LoopColorTheme] || loopColors['bee-yellow'] : loopColors['bee-yellow']
  const progress = loop ? loopUtils.calculateProgress(loop.tasks || []) : { completed: 0, total: 0, percentage: 0 }

  return (
    <div className=\"fixed inset-0 bg-black bg-opacity-50 flex flex-col z-50\">
      <div className=\"bg-white h-full overflow-hidden flex flex-col\">
        {loading ? (
          <div className=\"flex-1 flex items-center justify-center\">
            <LoadingSpinner size=\"lg\" />
          </div>
        ) : error ? (
          <div className=\"flex-1 flex items-center justify-center p-6\">
            <div className=\"text-center\">
              <div className=\"h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4\">
                <span className=\"text-2xl\">😟</span>
              </div>
              <h3 className=\"text-lg font-semibold text-gray-900 mb-2\">Oops!</h3>
              <p className=\"text-gray-600 mb-4\">{error}</p>
              <button
                onClick={handleClose}
                className=\"px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors\"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : loop ? (
          <>
            {/* Header */}
            <header className={`${colorTheme.light} px-4 py-4 border-b border-white border-opacity-30`}>
              <div className=\"flex items-center justify-between mb-4\">
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-full ${colorTheme.primary} bg-opacity-20 hover:bg-opacity-30 transition-colors`}
                >
                  <ArrowLeft size={20} className={colorTheme.text} />
                </button>
                
                <div className=\"flex items-center space-x-2\">
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className={`p-2 rounded-full ${colorTheme.primary} text-white hover:opacity-90 transition-opacity`}
                    title=\"Add Task\"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    className={`p-2 rounded-full ${colorTheme.primary} bg-opacity-20 hover:bg-opacity-30 transition-colors`}
                    title=\"Loop Settings\"
                  >
                    <Settings size={20} className={colorTheme.text} />
                  </button>
                </div>
              </div>

              {/* Loop Info */}
              <div className=\"mb-4\">
                <h1 className={`text-2xl font-bold ${colorTheme.text} mb-2`}>
                  {loop.name}
                </h1>
                {loop.description && (
                  <p className={`text-sm ${colorTheme.text} opacity-80 mb-3`}>
                    {loop.description}
                  </p>
                )}
                
                <div className=\"flex items-center space-x-4 text-sm\">
                  <div className=\"flex items-center space-x-1\">
                    <Calendar size={14} className={colorTheme.text} />
                    <span className={colorTheme.text}>{loop.reset_schedule}</span>
                  </div>
                  <div className=\"flex items-center space-x-1\">
                    <Target size={14} className={colorTheme.text} />
                    <span className={colorTheme.text}>{progress.completed}/{progress.total} tasks</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className=\"space-y-2\">
                <div className=\"flex items-center justify-between text-sm\">
                  <span className={colorTheme.text}>Progress</span>
                  <span className={colorTheme.text}>{progress.percentage}%</span>
                </div>
                <div className=\"w-full bg-white bg-opacity-30 rounded-full h-3\">
                  <div
                    className={`${colorTheme.dark} h-3 rounded-full transition-all duration-500 ease-out`}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            </header>

            {/* Task List */}
            <main className=\"flex-1 overflow-y-auto\">
              {loop.tasks && loop.tasks.length > 0 ? (
                <TaskList 
                  tasks={loop.tasks} 
                  colorTheme={colorTheme}
                  onTaskUpdate={handleTaskUpdate}
                />
              ) : (
                <EmptyTaskState 
                  colorTheme={colorTheme}
                  onCreateTask={() => setShowTaskForm(true)}
                />
              )}
            </main>

            {/* Task Form Modal */}
            <TaskForm
              isOpen={showTaskForm}
              loopId={loop.id}
              colorTheme={colorTheme}
              onClose={() => setShowTaskForm(false)}
              onSuccess={handleTaskUpdate}
            />
          </>
        ) : null}
      </div>
    </div>
  )
}

function EmptyTaskState({ 
  colorTheme, 
  onCreateTask 
}: { 
  colorTheme: any
  onCreateTask: () => void 
}) {
  return (
    <div className=\"flex-1 flex items-center justify-center p-6\">
      <div className=\"text-center max-w-sm\">
        {/* Bee mascot */}
        <div className={`mx-auto h-20 w-20 ${colorTheme.primary} rounded-full flex items-center justify-center mb-6 animate-bounce`}>
          <span className=\"text-3xl\">🐝</span>
        </div>
        
        <h3 className=\"text-xl font-bold text-gray-900 mb-2\">Ready to buzz into action?</h3>
        <p className=\"text-gray-600 mb-6 leading-relaxed\">
          Add your first task to this loop and start building productive habits!
        </p>

        <button
          onClick={onCreateTask}
          className={cn(
            'inline-flex items-center space-x-2 px-6 py-3 rounded-full font-medium text-white transition-all',
            'hover:scale-105 active:scale-95 shadow-lg',
            colorTheme.primary
          )}
        >
          <Plus size={18} />
          <span>Add First Task</span>
        </button>

        {/* Tips */}
        <div className=\"mt-8 space-y-3\">
          <div className=\"bg-yellow-50 rounded-2xl p-4 text-left\">
            <div className=\"flex items-start space-x-3\">
              <div className=\"h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0\">
                <span className=\"text-sm\">💡</span>
              </div>
              <div>
                <h4 className=\"font-semibold text-gray-900 text-sm\">Pro Tip</h4>
                <p className=\"text-gray-600 text-xs mt-1\">Start with 3-5 small, achievable tasks for the best results</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}