import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@supabase/supabase-js'
import { projectId, publicAnonKey } from './supabase/info'
import { api } from './api'

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
)

export interface User {
  id: string
  email: string
  name: string
  role: 'parent' | 'professional'
  isAdmin?: boolean
  baseRole?: 'parent' | 'professional'
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string, role?: 'parent' | 'professional') => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    try {
      console.log('Checking user session...')
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Error getting session:', sessionError)
        setLoading(false)
        return
      }
      
      if (session) {
        console.log('Session found, fetching user data...')
        api.setToken(session.access_token)
        try {
          const { user: userData } = await api.getUser()
          console.log('User data fetched successfully:', userData)
          
          // Check if user is admin - userData.isAdmin comes from server
          // Server verifies against environment variables
          const isAdmin = userData.isAdmin || false
          
          // Restore active role from session storage (not localStorage for security)
          const activeRole = sessionStorage.getItem('activeRole') as 'parent' | 'professional' | null
          const role = activeRole || userData.role || 'parent'
          
          const userWithProfile = {
            ...userData,
            isAdmin,
            role,
            baseRole: userData.role
          }
          
          setUser(userWithProfile)
        } catch (userError) {
          console.error('Error fetching user data:', userError)
          // If getting user fails, clear the session
          await supabase.auth.signOut()
          api.setToken(null)
        }
      } else {
        console.log('No session found')
      }
    } catch (error) {
      console.error('Error checking user session:', error)
    } finally {
      setLoading(false)
    }
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    if (data.session) {
      api.setToken(data.session.access_token)
      const { user: userData } = await api.getUser()
      
      // Check if user is admin - userData.isAdmin comes from server
      // Server verifies against environment variables
      const isAdmin = userData.isAdmin || false
      
      // Get selected profile from sessionStorage (set during login)
      const selectedProfile = sessionStorage.getItem('selectedProfile') as 'parent' | 'professional' | null
      const activeRole = selectedProfile || userData.role || 'parent'
      
      // Save active role for this session
      const userWithProfile = { 
        ...userData, 
        isAdmin,
        role: activeRole,
        baseRole: userData.role // Keep original role from DB
      }
      
      setUser(userWithProfile)
      sessionStorage.setItem('activeRole', activeRole)
    }
  }

  async function signUp(email: string, password: string, name: string, role: 'parent' | 'professional' = 'parent') {
    await api.signup(email, password, name, role)
    
    // After signup, sign in with a small delay to ensure user is created
    await new Promise(resolve => setTimeout(resolve, 500))
    await signIn(email, password)
  }

  async function signOut() {
    await supabase.auth.signOut()
    api.setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    sessionStorage.removeItem('activeRole')
    sessionStorage.removeItem('selectedProfile')
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}