'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Loop, Task } from '@/types'
import { loopColors, cn } from '@/lib/utils'

// Demo data for development
const demoLoops: Loop[] = [
  {
    id: '1',
    title: 'Morning Routine',
    description: 'Start each day with energy and focus',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'demo',
    color_theme: 'yellow',
    is_active: true,
  },
  {
    id: '2',
    title: 'Fitness Goals',
    description: 'Build healthy habits for a stronger body',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: 'demo',
    color_theme: 'green',
    is_active: true,
  }
]

const demoTasks: Task[] = [
  {
    id: '1',
    title: 'Drink water',
    description: 'Start with a glass of water',
    completed: false,
    loop_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    priority: 'high'
  },
  {
    id: '2',
    title: '10-minute meditation',
    description: 'Clear your mind for the day ahead',
    completed: true,
    loop_id: '1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    priority: 'medium'
  },
  {
    id: '3',
    title: '20 push-ups',
    description: 'Quick upper body exercise',
    completed: false,
    loop_id: '2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    priority: 'high'
  }
]

export function Dashboard() {
  const [loops, setLoops] = useState<Loop[]>(demoLoops)
  const [tasks, setTasks] = useState<Task[]>(demoTasks)
  const [showCreateLoop, setShowCreateLoop] = useState(false)
  const [newLoopTitle, setNewLoopTitle] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateLoop = async () => {
    if (!newLoopTitle.trim()) return

    setLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newLoop: Loop = {
      id: Date.now().toString(),
      title: newLoopTitle,
      description: 'New loop description',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'demo',
      color_theme: 'blue',
      is_active: true,
    }

    setLoops(prev => [newLoop, ...prev])
    setNewLoopTitle('')
    setShowCreateLoop(false)
    setLoading(false)
  }

  const handleToggleTask = async (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, completed: !task.completed, updated_at: new Date().toISOString() }
          : task
      )
    )
  }

  const getTasksForLoop = (loopId: string) => {
    return tasks.filter(task => task.loop_id === loopId)
  }

  const getLoopProgress = (loopId: string) => {
    const loopTasks = getTasksForLoop(loopId)
    const completed = loopTasks.filter(task => task.completed).length
    return loopTasks.length > 0 ? Math.round((completed / loopTasks.length) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-yellow-400 rounded-full flex items-center justify-center">
              <span className="text-2xl">🐝</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">DoLoop</h1>
              <p className="text-gray-600">Your productive habits dashboard</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateLoop(!showCreateLoop)}
            className="bg-yellow-400 hover:bg-yellow-500 text-black"
          >
            + Create Loop
          </Button>
        </div>

        {/* Create Loop Form */}
        {showCreateLoop && (
          <div className="bg-white rounded-xl p-6 mb-6 shadow-lg border">
            <h3 className="text-lg font-semibold mb-4">Create New Loop</h3>
            <div className="flex gap-3">
              <Input
                placeholder="Loop title (e.g., 'Evening Routine')"
                value={newLoopTitle}
                onChange={(e) => setNewLoopTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateLoop()}
                className="flex-1"
              />
              <Button 
                onClick={handleCreateLoop} 
                disabled={!newLoopTitle.trim() || loading}
                className="bg-yellow-400 hover:bg-yellow-500 text-black"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateLoop(false)
                  setNewLoopTitle('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Loops Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loops.map(loop => {
            const loopTasks = getTasksForLoop(loop.id)
            const progress = getLoopProgress(loop.id)
            const colors = loopColors[loop.color_theme]

            return (
              <div 
                key={loop.id} 
                className={cn(
                  'rounded-xl p-6 border-2 shadow-lg transition-all hover:shadow-xl',
                  colors.bg,
                  colors.border
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className={cn('text-xl font-bold', colors.text)}>
                      {loop.title}
                    </h3>
                    <p className="text-gray-600 text-sm mt-1">
                      {loop.description}
                    </p>
                  </div>
                  <div className={cn('text-2xl font-bold', colors.text)}>
                    {progress}%
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-white rounded-full h-2 mb-4">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {/* Tasks */}
                <div className="space-y-2">
                  {loopTasks.map(task => (
                    <div 
                      key={task.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-white/50 hover:bg-white/70 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={cn(
                          'w-5 h-5 rounded border-2 flex items-center justify-center transition-colors',
                          task.completed 
                            ? 'bg-yellow-400 border-yellow-400' 
                            : 'border-gray-300 hover:border-yellow-400'
                        )}
                      >
                        {task.completed && <span className="text-black text-sm">✓</span>}
                      </button>
                      <span className={cn(
                        'flex-1 text-sm',
                        task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      )}>
                        {task.title}
                      </span>
                    </div>
                  ))}
                  
                  {loopTasks.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-4">
                      No tasks yet. Click to add some!
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {loops.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🐝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Ready to create your first loop?
            </h3>
            <p className="text-gray-600 mb-6">
              Start building productive habits that stick!
            </p>
            <Button 
              onClick={() => setShowCreateLoop(true)}
              size="lg"
              className="bg-yellow-400 hover:bg-yellow-500 text-black"
            >
              Create Your First Loop
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}