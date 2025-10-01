'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

type AuthMode = 'sign-in' | 'sign-up'

export default function AuthForm() {
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (mode === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) throw error
        setMessage({
          type: 'success',
          text: 'Check your email for a verification link!'
        })
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className=\"min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 px-4\">
      <div className=\"max-w-md w-full space-y-8\">
        {/* DoLoop Logo & Bee Mascot */}
        <div className=\"text-center\">
          <div className=\"mx-auto h-16 w-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4\">
            <span className=\"text-2xl\">🐝</span>
          </div>
          <h2 className=\"text-3xl font-bold text-gray-900 mb-2\">
            DoLoop
          </h2>
          <p className=\"text-gray-600\">
            Create productive loops, build lasting habits
          </p>
        </div>

        {/* Auth Form */}
        <div className=\"bg-white rounded-2xl shadow-lg p-8\">
          <div className=\"mb-6\">
            <div className=\"flex rounded-lg bg-gray-100 p-1\">
              <button
                type=\"button\"
                onClick={() => setMode('sign-in')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                  mode === 'sign-in'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Sign In
              </button>
              <button
                type=\"button\"
                onClick={() => setMode('sign-up')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors',
                  mode === 'sign-up'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                )}
              >
                Sign Up
              </button>
            </div>
          </div>

          <form onSubmit={handleAuth} className=\"space-y-4\">
            <div>
              <label htmlFor=\"email\" className=\"block text-sm font-medium text-gray-700 mb-1\">
                Email
              </label>
              <input
                id=\"email\"
                type=\"email\"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className=\"w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent\"
                placeholder=\"your@email.com\"
              />
            </div>

            <div>
              <label htmlFor=\"password\" className=\"block text-sm font-medium text-gray-700 mb-1\">
                Password
              </label>
              <input
                id=\"password\"
                type=\"password\"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className=\"w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent\"
                placeholder=\"••••••••\"
                minLength={6}
              />
            </div>

            {message && (
              <div className={cn(
                'p-3 rounded-lg text-sm',
                message.type === 'error' 
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              )}>
                {message.text}
              </div>
            )}

            <button
              type=\"submit\"
              disabled={loading}
              className={cn(
                'w-full py-3 px-4 rounded-lg font-medium text-white transition-colors',
                'bg-yellow-400 hover:bg-yellow-500 active:bg-yellow-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? 'Loading...' : mode === 'sign-in' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          {/* Social Auth - Future enhancement */}
          <div className=\"mt-6 pt-6 border-t border-gray-200\">
            <p className=\"text-center text-sm text-gray-500\">
              More sign-in options coming soon! 🚀
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className=\"text-center\">
          <p className=\"text-sm text-gray-500\">
            Join thousands creating productive loops every day
          </p>
        </div>
      </div>
    </div>
  )
}