'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, Database } from '@/lib/supabase'
import { CreateLoopForm } from './CreateLoopForm'

type Loop = Database['public']['Tables']['loops']['Row']
type Task = Database['public']['Tables']['tasks']['Row']

export function Dashboard() {
  const { user, signOut } = useAuth()
  const [loops, setLoops] = useState<(Loop & { task_count: number; completed_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)

  useEffect(() => {
    if (user) {
      fetchLoops()
    }
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLoops = async () => {
    if (!user) return

    try {
      // Fetch loops with task counts
      const { data: loopsData, error: loopsError } = await supabase
        .from('loops')
        .select(`
          *,
          tasks(id, status)
        `)
        .eq('owner', user.id)
        .order('created_at', { ascending: false })

      if (loopsError) throw loopsError

      // Transform data to include counts
      const loopsWithCounts = loopsData?.map(loop => {
        const tasks = loop.tasks as Task[]
        const task_count = tasks.length
        const completed_count = tasks.filter(task => task.status === 'completed').length
        
        return {
          ...loop,
          task_count,
          completed_count,
          tasks: undefined // Remove tasks array to clean up type
        }
      }) || []

      setLoops(loopsWithCounts)
    } catch (error) {
      console.error('Error fetching loops:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoopCreated = () => {
    fetchLoops()
    setShowCreateForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (showCreateForm) {
    return <CreateLoopForm onLoopCreated={handleLoopCreated} onCancel={() => setShowCreateForm(false)} />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-lg">
                🐝
              </div>
              <h1 className="text-xl font-bold text-gray-900">DoLoop</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Hello, {user?.email}
              </span>
              <button
                onClick={signOut}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Loops</h2>
            <p className="text-gray-600 mt-1">
              {loops.length === 0 
                ? 'Create your first loop to get started' 
                : `You have ${loops.length} active ${loops.length === 1 ? 'loop' : 'loops'}`
              }
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Loop</span>
          </button>
        </div>

        {loops.length === 0 ? (
          /* Empty state */
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl">
              🔄
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No loops yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Loops are recurring checklists that help you build consistent routines. 
              Create your first loop to get started!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Create Your First Loop
            </button>
          </div>
        ) : (
          /* Loops grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loops.map((loop) => {
              const progress = loop.task_count > 0 ? (loop.completed_count / loop.task_count) * 100 : 0
              
              return (
                <div
                  key={loop.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: loop.color }}
                    ></div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">
                      {loop.reset_rule}
                    </span>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 truncate">
                    {loop.name}
                  </h3>
                  
                  {loop.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {loop.description}
                    </p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Progress</span>
                      <span className="text-gray-900 font-medium">
                        {loop.completed_count} / {loop.task_count}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}