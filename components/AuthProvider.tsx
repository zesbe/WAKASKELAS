'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { authManager, User, AuthSession, isAuthenticated, getCurrentUser, canAccessRoute } from '../lib/auth'

interface AuthContextType {
  user: User | null
  session: AuthSession | null
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  hasPermission: (permission: any) => boolean
  canAccess: (resource: string, action: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Mark as client-side and initialize auth state
    const initAuth = () => {
      setIsClient(true)
      setUser(getCurrentUser())
      setSession(authManager.getCurrentSession())
      setIsLoading(false)
    }

    initAuth()
  }, [])

  useEffect(() => {
    // Only do route checks on client-side
    if (!isClient) return

    // Check authentication on route change
    if (!isAuthenticated() && pathname !== '/login') {
      router.push('/login')
    } else if (isAuthenticated() && !canAccessRoute(pathname)) {
      router.push('/') // Redirect to dashboard if no permission
    }
  }, [isClient, pathname, router])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    try {
      const result = await authManager.login(username, password)
      
      if (result.success && result.user) {
        setUser(result.user)
        setSession(authManager.getCurrentSession())
        router.push('/')
      }
      
      return result
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authManager.logout()
    setUser(null)
    setSession(null)
    router.push('/login')
  }

  const hasPermission = (permission: any) => {
    return authManager.hasPermission(permission)
  }

  const canAccess = (resource: string, action: string) => {
    return authManager.canAccess(resource, action)
  }

  const value = {
    user,
    session,
    isLoading,
    login,
    logout,
    hasPermission,
    canAccess
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
