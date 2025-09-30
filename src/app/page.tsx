'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function Home() {
  const { user, loading } = useAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <AuthForm 
        mode={authMode} 
        onToggleMode={() => setAuthMode(mode => mode === 'signin' ? 'signup' : 'signin')} 
      />
    )
  }

  return <Dashboard />
}
