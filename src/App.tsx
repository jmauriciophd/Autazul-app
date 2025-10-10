import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './utils/AuthContext'
import { AuthScreen } from './components/AuthScreen'
import { ParentDashboard } from './components/ParentDashboard'
import { ProfessionalDashboard } from './components/ProfessionalDashboard'
import { ProfessionalAcceptInvite } from './components/ProfessionalAcceptInvite'
import { Toaster } from './components/ui/sonner'

function AppContent() {
  const { user, loading } = useAuth()
  const [inviteToken, setInviteToken] = useState<string | null>(null)

  useEffect(() => {
    // Check if URL has invite token
    const path = window.location.pathname
    const match = path.match(/\/professional\/accept\/([a-f0-9]+)/)
    if (match && match[1]) {
      setInviteToken(match[1])
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // If there's an invite token and no user, show invite acceptance
  if (inviteToken && !user) {
    return <ProfessionalAcceptInvite token={inviteToken} />
  }

  // If not authenticated, show auth screen
  if (!user) {
    return <AuthScreen />
  }

  // If authenticated, show appropriate dashboard
  if (user.role === 'parent') {
    return <ParentDashboard />
  } else if (user.role === 'professional') {
    return <ProfessionalDashboard />
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Tipo de usuário desconhecido</p>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  )
}
