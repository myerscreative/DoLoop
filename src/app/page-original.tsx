'use client'

import { useAuth } from '@/contexts/AuthContext'
import { LoadingScreen } from '@/components/LoadingSpinner'
import AuthForm from '@/components/AuthForm'
import Dashboard from '@/components/Dashboard'

export default function Home() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return <AuthForm />
  }

  return <Dashboard />
}
