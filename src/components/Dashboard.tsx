'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Loop, Task } from '@/lib/supabase'
import { loopDb } from '@/lib/db'
import { calculateProgress, loopColors, LoopColorTheme } from '@/lib/utils'
import { Plus, LogOut, CheckCircle2, Circle, RotateCcw } from 'lucide-react'
import LoadingSpinner from '@/components/LoadingSpinner'
import LoopForm from '@/components/dashboard/LoopForm'
import LoopDetail from '@/components/dashboard/LoopDetail'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [loops, setLoops] = useState<Loop[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateLoop, setShowCreateLoop] = useState(false)
  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchLoops()
    }
  }, [user])

  const fetchLoops = async () => {
    if (!user) return

    try {
      const { data: loopsData, error } = await loopDb.getAll()

      if (error) {
        console.error('Error fetching loops:', error)
        return
      }

      setLoops(loopsData || [])
    } catch (error) {
      console.error('Error fetching loops:', error)
    } finally {
      setLoading(false)
    }
  }

  const getLoopProgress = (loop: any) => {
    if (!loop.tasks || loop.tasks.length === 0) return 0
    const completedTasks = loop.tasks.filter((task: Task) => task.is_completed).length
    return calculateProgress(completedTasks, loop.tasks.length)
  }

  if (loading) {
    return (
      <div className=\"min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center\">
        <LoadingSpinner size=\"lg\" />
      </div>
    )
  }

  return (
    <div className=\"min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50\">
      {/* Header */}
      <header className=\"bg-white shadow-sm border-b border-yellow-100\">
        <div className=\"max-w-lg mx-auto px-4 py-4 flex items-center justify-between\">
          {/* Logo */}
          <div className=\"flex items-center space-x-3\">
            <div className=\"h-10 w-10 bg-yellow-400 rounded-full flex items-center justify-center\">
              <span className=\"text-lg\">🐝</span>
            </div>
            <div>
              <h1 className=\"text-xl font-bold text-gray-900\">DoLoop</h1>
              <p className=\"text-xs text-gray-500\">Welcome back, {user?.email?.split('@')[0]}!</p>
            </div>
          </div>

          {/* Actions */}
          <div className=\"flex items-center space-x-2\">
            <button
              onClick={() => setShowCreateLoop(true)}
              className=\"p-2 rounded-full bg-yellow-400 text-white hover:bg-yellow-500 transition-colors\"
              title=\"Create Loop\"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={signOut}
              className=\"p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors\"
              title=\"Sign Out\"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className=\"max-w-lg mx-auto px-4 py-6\">
        {loops.length === 0 ? (
          <EmptyState onCreateLoop={() => setShowCreateLoop(true)} />
        ) : (
          <LoopsList loops={loops} onUpdateLoop={fetchLoops} onSelectLoop={setSelectedLoopId} />
        )}
      </main>

      {/* Loop Creation Form */}
      <LoopForm
        isOpen={showCreateLoop}
        onClose={() => setShowCreateLoop(false)}
        onSuccess={fetchLoops}
      />

      {/* Loop Detail View */}
      <LoopDetail
        loopId={selectedLoopId || ''}
        isOpen={!!selectedLoopId}
        onClose={() => setSelectedLoopId(null)}
        onLoopUpdate={fetchLoops}
      />
    </div>
  )
}

function EmptyState({ onCreateLoop }: { onCreateLoop: () => void }) {
  return (
    <div className=\"text-center py-12\">
      {/* Bee mascot */}
      <div className=\"mx-auto h-24 w-24 bg-yellow-400 rounded-full flex items-center justify-center mb-6 animate-bounce\">
        <span className=\"text-4xl\">🐝</span>
      </div>
      
      <h2 className=\"text-2xl font-bold text-gray-900 mb-2\">Ready to start looping?</h2>
      <p className=\"text-gray-600 mb-8 leading-relaxed\">
        Create your first loop to organize recurring tasks<br />
        and build productive habits that stick!
      </p>

      <button
        onClick={onCreateLoop}
        className=\"inline-flex items-center space-x-2 bg-yellow-400 text-white px-6 py-3 rounded-full font-medium hover:bg-yellow-500 transition-colors shadow-lg\"
      >
        <Plus size={20} />
        <span>Create Your First Loop</span>
      </button>

      {/* Feature highlights */}
      <div className=\"mt-12 grid grid-cols-1 gap-4 text-left\">
        <div className=\"bg-white rounded-2xl p-4 shadow-sm\">
          <div className=\"flex items-start space-x-3\">
            <div className=\"h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0\">
              <RotateCcw size={16} className=\"text-blue-600\" />
            </div>
            <div>
              <h3 className=\"font-semibold text-gray-900 text-sm\">Recurring Tasks</h3>
              <p className=\"text-gray-600 text-xs mt-1\">Set daily, weekly, or monthly reset cycles</p>
            </div>
          </div>
        </div>

        <div className=\"bg-white rounded-2xl p-4 shadow-sm\">
          <div className=\"flex items-start space-x-3\">
            <div className=\"h-8 w-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0\">
              <CheckCircle2 size={16} className=\"text-green-600\" />
            </div>
            <div>
              <h3 className=\"font-semibold text-gray-900 text-sm\">Progress Tracking</h3>
              <p className=\"text-gray-600 text-xs mt-1\">Visual progress bars and completion stats</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoopsList({ loops, onUpdateLoop, onSelectLoop }: { loops: Loop[], onUpdateLoop: () => void, onSelectLoop: (id: string) => void }) {
  return (
    <div className=\"space-y-4\">
      <div className=\"flex items-center justify-between\">
        <h2 className=\"text-lg font-semibold text-gray-900\">Your Loops</h2>
        <span className=\"text-sm text-gray-500\">{loops.length} active</span>
      </div>

      {loops.map((loop: any) => (
        <LoopCard key={loop.id} loop={loop} onUpdate={onUpdateLoop} onSelect={onSelectLoop} />
      ))}
    </div>
  )
}

function LoopCard({ loop, onUpdate, onSelect }: { loop: any, onUpdate: () => void, onSelect: (id: string) => void }) {
  const progress = getLoopProgress(loop)
  const colorTheme = loopColors[loop.color as LoopColorTheme] || loopColors['bee-yellow']
  const taskCount = loop.tasks?.length || 0
  const completedCount = loop.tasks?.filter((task: Task) => task.is_completed).length || 0

  return (
    <div className=\"bg-white rounded-2xl shadow-sm overflow-hidden\">
      {/* Loop Header */}
      <div className={`p-4 ${colorTheme.light}`}>
        <div className=\"flex items-center justify-between mb-2\">
          <h3 className={`font-semibold ${colorTheme.text}`}>{loop.name}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${colorTheme.primary} text-white`}>
            {loop.reset_schedule}
          </span>
        </div>
        
        {loop.description && (
          <p className={`text-sm ${colorTheme.text} opacity-80 mb-3`}>{loop.description}</p>
        )}

        {/* Progress Bar */}
        <div className=\"space-y-2\">
          <div className=\"flex items-center justify-between text-xs\">
            <span className={colorTheme.text}>Progress</span>
            <span className={colorTheme.text}>{completedCount}/{taskCount} tasks</span>
          </div>
          <div className=\"w-full bg-white bg-opacity-50 rounded-full h-2\">
            <div
              className={`${colorTheme.dark} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks Preview */}
      <div className=\"p-4\">
        {taskCount === 0 ? (
          <p className=\"text-gray-500 text-sm text-center py-4\">
            No tasks yet. Add some tasks to get started!
          </p>
        ) : (
          <div className=\"space-y-2\">
            {loop.tasks.slice(0, 3).map((task: Task) => (
              <div key={task.id} className=\"flex items-center space-x-3\">
                {task.is_completed ? (
                  <CheckCircle2 size={16} className=\"text-green-500 flex-shrink-0\" />
                ) : (
                  <Circle size={16} className=\"text-gray-300 flex-shrink-0\" />
                )}
                <span className={`text-sm ${task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'} flex-1`}>
                  {task.name}
                </span>
              </div>
            ))}
            
            {taskCount > 3 && (
              <p className=\"text-xs text-gray-500 text-center pt-2\">
                +{taskCount - 3} more tasks
              </p>
            )}
          </div>
        )}
        
        <button 
          onClick={() => onSelect(loop.id)}
          className=\"w-full mt-4 py-2 px-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors\"
        >
          View Details
        </button>
      </div>
    </div>
  )
}

function getLoopProgress(loop: any) {
  if (!loop.tasks || loop.tasks.length === 0) return 0
  const completedTasks = loop.tasks.filter((task: Task) => task.is_completed).length
  return calculateProgress(completedTasks, loop.tasks.length)
}