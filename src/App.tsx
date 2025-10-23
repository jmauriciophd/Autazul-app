import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './utils/AuthContext'
import { AuthScreen } from './components/AuthScreen'
import { ParentDashboard } from './components/ParentDashboard'
import { ProfessionalDashboard } from './components/ProfessionalDashboard'
import { ProfessionalAcceptInvite } from './components/ProfessionalAcceptInvite'
import { CoParentAcceptInvite } from './components/CoParentAcceptInvite'
import { AdminPanel } from './components/AdminPanel'
import { Toaster } from './components/ui/sonner'

function AppContent() {
  const { user, loading } = useAuth()
  const [professionalInviteToken, setProfessionalInviteToken] = useState<string | null>(null)
  const [coParentInviteToken, setCoParentInviteToken] = useState<string | null>(null)
  const [showAdminPanel, setShowAdminPanel] = useState(false)

  useEffect(() => {
    // Check if URL has invite token (supports both pathname and hash routing)
    const path = window.location.pathname
    const hash = window.location.hash
    
    console.log('Checking for invite token - pathname:', path, 'hash:', hash)
    
    // Check for professional invite
    let match = path.match(/\/professional\/accept\/([a-f0-9]+)/)
    if (!match && hash) {
      match = hash.match(/\/professional\/accept\/([a-f0-9]+)/)
    }
    if (match && match[1]) {
      console.log('Found professional invite token:', match[1])
      setProfessionalInviteToken(match[1])
      return
    }

    // Check for co-parent invite
    match = path.match(/\/coparent\/accept\/([a-f0-9]+)/)
    if (!match && hash) {
      match = hash.match(/\/coparent\/accept\/([a-f0-9]+)/)
    }
    if (match && match[1]) {
      console.log('Found co-parent invite token:', match[1])
      setCoParentInviteToken(match[1])
      return
    }

    // Check for admin panel
    if (path.includes('/admin') || hash.includes('/admin')) {
      console.log('Admin panel requested')
      setShowAdminPanel(true)
      return
    }
    
    console.log('No special route found in URL')
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

  // If there's a professional invite token and no user, show invite acceptance
  if (professionalInviteToken && !user) {
    return <ProfessionalAcceptInvite token={professionalInviteToken} />
  }

  // If there's a co-parent invite token and no user, show invite acceptance
  if (coParentInviteToken && !user) {
    return <CoParentAcceptInvite token={coParentInviteToken} />
  }

  // If admin panel is requested and user is authenticated, check if admin
  if (showAdminPanel && user) {
    // Admin check is done by server via environment variables
    if (user.isAdmin) {
      return <AdminPanel />
    }
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