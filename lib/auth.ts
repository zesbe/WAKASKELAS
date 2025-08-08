// Advanced Authentication and Authorization System

export interface User {
  id: string
  username: string
  email: string
  name: string
  role: UserRole
  permissions: Permission[]
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface UserRole {
  id: string
  name: string
  displayName: string
  description: string
  level: number // Higher level = more permissions
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains'
  value: any
}

export interface AuthSession {
  id: string
  userId: string
  token: string
  refreshToken: string
  expiresAt: string
  deviceInfo: {
    userAgent: string
    ip: string
    device: string
  }
  isActive: boolean
  createdAt: string
}

// Predefined roles and permissions
export const PERMISSIONS = {
  // Dashboard permissions
  DASHBOARD_VIEW: { id: 'dashboard.view', name: 'View Dashboard', resource: 'dashboard', action: 'read' },
  
  // Analytics permissions
  ANALYTICS_VIEW: { id: 'analytics.view', name: 'View Analytics', resource: 'analytics', action: 'read' },
  ANALYTICS_EXPORT: { id: 'analytics.export', name: 'Export Analytics', resource: 'analytics', action: 'export' },
  
  // Student data permissions
  STUDENTS_VIEW: { id: 'students.view', name: 'View Students', resource: 'students', action: 'read' },
  STUDENTS_CREATE: { id: 'students.create', name: 'Create Students', resource: 'students', action: 'create' },
  STUDENTS_UPDATE: { id: 'students.update', name: 'Update Students', resource: 'students', action: 'update' },
  STUDENTS_DELETE: { id: 'students.delete', name: 'Delete Students', resource: 'students', action: 'delete' },
  
  // Financial permissions
  FINANCE_VIEW: { id: 'finance.view', name: 'View Finance', resource: 'finance', action: 'read' },
  FINANCE_CREATE: { id: 'finance.create', name: 'Create Transactions', resource: 'finance', action: 'create' },
  FINANCE_UPDATE: { id: 'finance.update', name: 'Update Transactions', resource: 'finance', action: 'update' },
  FINANCE_DELETE: { id: 'finance.delete', name: 'Delete Transactions', resource: 'finance', action: 'delete' },
  FINANCE_APPROVE: { id: 'finance.approve', name: 'Approve Transactions', resource: 'finance', action: 'approve' },
  
  // Payment permissions
  PAYMENTS_VIEW: { id: 'payments.view', name: 'View Payments', resource: 'payments', action: 'read' },
  PAYMENTS_CREATE: { id: 'payments.create', name: 'Create Payment Links', resource: 'payments', action: 'create' },
  PAYMENTS_MANAGE: { id: 'payments.manage', name: 'Manage Payments', resource: 'payments', action: 'manage' },
  
  // Communication permissions
  REMINDERS_VIEW: { id: 'reminders.view', name: 'View Reminders', resource: 'reminders', action: 'read' },
  REMINDERS_CREATE: { id: 'reminders.create', name: 'Create Reminders', resource: 'reminders', action: 'create' },
  REMINDERS_SEND: { id: 'reminders.send', name: 'Send Reminders', resource: 'reminders', action: 'send' },
  
  // Settings permissions
  SETTINGS_VIEW: { id: 'settings.view', name: 'View Settings', resource: 'settings', action: 'read' },
  SETTINGS_UPDATE: { id: 'settings.update', name: 'Update Settings', resource: 'settings', action: 'update' },
  
  // User management permissions
  USERS_VIEW: { id: 'users.view', name: 'View Users', resource: 'users', action: 'read' },
  USERS_CREATE: { id: 'users.create', name: 'Create Users', resource: 'users', action: 'create' },
  USERS_UPDATE: { id: 'users.update', name: 'Update Users', resource: 'users', action: 'update' },
  USERS_DELETE: { id: 'users.delete', name: 'Delete Users', resource: 'users', action: 'delete' },
  
  // System permissions
  SYSTEM_ADMIN: { id: 'system.admin', name: 'System Administration', resource: 'system', action: 'admin' },
  AUDIT_VIEW: { id: 'audit.view', name: 'View Audit Logs', resource: 'audit', action: 'read' }
} as const

export const ROLES = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    level: 100,
    permissions: Object.values(PERMISSIONS)
  },
  ADMIN: {
    id: 'admin',
    name: 'admin',
    displayName: 'Administrator',
    description: 'Administrative access to most features',
    level: 80,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.ANALYTICS_EXPORT,
      PERMISSIONS.STUDENTS_VIEW,
      PERMISSIONS.STUDENTS_CREATE,
      PERMISSIONS.STUDENTS_UPDATE,
      PERMISSIONS.STUDENTS_DELETE,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_CREATE,
      PERMISSIONS.FINANCE_UPDATE,
      PERMISSIONS.FINANCE_DELETE,
      PERMISSIONS.FINANCE_APPROVE,
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.PAYMENTS_CREATE,
      PERMISSIONS.PAYMENTS_MANAGE,
      PERMISSIONS.REMINDERS_VIEW,
      PERMISSIONS.REMINDERS_CREATE,
      PERMISSIONS.REMINDERS_SEND,
      PERMISSIONS.SETTINGS_VIEW,
      PERMISSIONS.SETTINGS_UPDATE,
      PERMISSIONS.USERS_VIEW,
      PERMISSIONS.AUDIT_VIEW
    ]
  },
  BENDAHARA: {
    id: 'bendahara',
    name: 'bendahara',
    displayName: 'Bendahara Kelas',
    description: 'Financial management and student data access',
    level: 60,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.ANALYTICS_VIEW,
      PERMISSIONS.STUDENTS_VIEW,
      PERMISSIONS.STUDENTS_UPDATE,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.FINANCE_CREATE,
      PERMISSIONS.FINANCE_UPDATE,
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.PAYMENTS_CREATE,
      PERMISSIONS.REMINDERS_VIEW,
      PERMISSIONS.REMINDERS_CREATE,
      PERMISSIONS.REMINDERS_SEND,
      PERMISSIONS.SETTINGS_VIEW
    ]
  },
  GURU: {
    id: 'guru',
    name: 'guru',
    displayName: 'Guru Kelas',
    description: 'View access to student data and basic financial information',
    level: 40,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STUDENTS_VIEW,
      PERMISSIONS.FINANCE_VIEW,
      PERMISSIONS.PAYMENTS_VIEW,
      PERMISSIONS.REMINDERS_VIEW
    ]
  },
  VIEWER: {
    id: 'viewer',
    name: 'viewer',
    displayName: 'Viewer',
    description: 'Read-only access to basic information',
    level: 20,
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.STUDENTS_VIEW,
      PERMISSIONS.FINANCE_VIEW
    ]
  }
} as const

class AuthManager {
  private currentUser: User | null = null
  private currentSession: AuthSession | null = null

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    const userData = localStorage.getItem('kas-auth-user')
    const sessionData = localStorage.getItem('kas-auth-session')

    if (userData && sessionData) {
      try {
        this.currentUser = JSON.parse(userData)
        this.currentSession = JSON.parse(sessionData)
        
        // Check if session is still valid
        if (this.currentSession && new Date(this.currentSession.expiresAt) < new Date()) {
          this.logout()
        }
      } catch (error) {
        console.error('Error loading auth data:', error)
        this.logout()
      }
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    if (this.currentUser && this.currentSession) {
      localStorage.setItem('kas-auth-user', JSON.stringify(this.currentUser))
      localStorage.setItem('kas-auth-session', JSON.stringify(this.currentSession))
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<{ success: boolean; error?: string; user?: User }> {
    try {
      // Call login API instead of direct database access
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const result = await response.json()

      if (!result.success) {
        return result
      }

      const dbUser = result.user

      // Create session for user
      const session: AuthSession = {
        id: Date.now().toString(),
        userId: dbUser.id,
        token: 'token-' + Date.now(),
        refreshToken: 'refresh-' + Date.now(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        deviceInfo: {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server',
          ip: '127.0.0.1',
          device: 'Web Browser'
        },
        isActive: true,
        createdAt: new Date().toISOString()
      }

      this.currentUser = dbUser
      this.currentSession = session
      this.saveToStorage()

      return { success: true, user: this.currentUser }
    } catch (error) {
      return { success: false, error: 'Login failed' }
    }
  }

  logout() {
    this.currentUser = null
    this.currentSession = null
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('kas-auth-user')
      localStorage.removeItem('kas-auth-session')
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser
  }

  getCurrentSession(): AuthSession | null {
    return this.currentSession
  }

  isAuthenticated(): boolean {
    return !!(this.currentUser && this.currentSession && 
              new Date(this.currentSession.expiresAt) > new Date())
  }

  // Authorization methods
  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) return false
    
    return this.currentUser.permissions.some(p => 
      p.id === permission.id ||
      (p.resource === permission.resource && p.action === permission.action)
    )
  }

  hasRole(roleName: string): boolean {
    if (!this.currentUser) return false
    return this.currentUser.role.name === roleName
  }

  hasMinimumRole(minimumLevel: number): boolean {
    if (!this.currentUser) return false
    return this.currentUser.role.level >= minimumLevel
  }

  canAccess(resource: string, action: string): boolean {
    if (!this.currentUser) return false
    
    return this.currentUser.permissions.some(p => 
      p.resource === resource && p.action === action
    )
  }

  // Route protection
  canAccessRoute(route: string): boolean {
    if (!this.isAuthenticated()) return false

    const routePermissions: { [key: string]: Permission } = {
      '/analytics': PERMISSIONS.ANALYTICS_VIEW,
      '/smart-reminders': PERMISSIONS.REMINDERS_VIEW,
      '/payment-center': PERMISSIONS.PAYMENTS_VIEW,
      '/wali-murid': PERMISSIONS.STUDENTS_VIEW,
      '/kas-kelas': PERMISSIONS.FINANCE_VIEW,
      '/pengeluaran': PERMISSIONS.FINANCE_VIEW,
      '/laporan-keuangan': PERMISSIONS.FINANCE_VIEW,
      '/reminder-tagihan': PERMISSIONS.REMINDERS_VIEW,
      '/users': PERMISSIONS.USERS_VIEW,
      '/settings': PERMISSIONS.SETTINGS_VIEW,
      '/webhook-config': PERMISSIONS.SETTINGS_VIEW,
      '/settings/device': PERMISSIONS.SETTINGS_VIEW
    }

    const requiredPermission = routePermissions[route]
    if (!requiredPermission) return true // Public route

    return this.hasPermission(requiredPermission)
  }

  // Security utilities
  generateCSRFToken(): string {
    return 'csrf-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now()
  }

  validateCSRFToken(token: string): boolean {
    // In real implementation, validate against stored token
    return token.startsWith('csrf-')
  }

  // Audit logging
  logAction(action: string, resource: string, details?: any) {
    if (!this.currentUser) return

    const auditLog = {
      id: Date.now().toString(),
      userId: this.currentUser.id,
      username: this.currentUser.username,
      action,
      resource,
      details,
      ip: '127.0.0.1', // Would get real IP in backend
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
      timestamp: new Date().toISOString()
    }

    // In real implementation, send to backend
    console.log('Audit Log:', auditLog)
    
    // Store in localStorage for demo
    if (typeof window !== 'undefined') {
      const logs = JSON.parse(localStorage.getItem('kas-audit-logs') || '[]')
      logs.push(auditLog)
      // Keep only last 100 logs
      if (logs.length > 100) logs.splice(0, logs.length - 100)
      localStorage.setItem('kas-audit-logs', JSON.stringify(logs))
    }
  }

  getAuditLogs(): any[] {
    if (typeof window === 'undefined') return []
    return JSON.parse(localStorage.getItem('kas-audit-logs') || '[]')
  }
}

// Singleton instance
export const authManager = new AuthManager()

// Utility functions
export const isAuthenticated = () => authManager.isAuthenticated()
export const getCurrentUser = () => authManager.getCurrentUser()
export const hasPermission = (permission: Permission) => authManager.hasPermission(permission)
export const hasRole = (roleName: string) => authManager.hasRole(roleName)
export const canAccess = (resource: string, action: string) => authManager.canAccess(resource, action)
export const canAccessRoute = (route: string) => authManager.canAccessRoute(route)
export const logAuditAction = (action: string, resource: string, details?: any) => 
  authManager.logAction(action, resource, details)
