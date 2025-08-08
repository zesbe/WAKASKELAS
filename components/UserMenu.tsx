'use client'

import { useState } from 'react'
import { User, LogOut, Settings, Shield, Clock, ChevronDown } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, logout } = useAuth()

  if (!user) return null

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'Never'
    if (typeof window === 'undefined') return 'Loading...'
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'super_admin': return 'bg-red-100 text-red-800'
      case 'admin': return 'bg-purple-100 text-purple-800'
      case 'bendahara': return 'bg-blue-100 text-blue-800'
      case 'guru': return 'bg-green-100 text-green-800'
      case 'viewer': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-xl hover:bg-white/20 transition-colors"
      >
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-white" />
        </div>
        <div className="text-left hidden sm:block">
          <p className="font-medium text-white text-sm">{user.name}</p>
          <p className="text-xs text-white/80">{user.role.displayName}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-white/80 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
            {/* User Info Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
              <div className="flex items-center space-x-3">
                <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">{user.name}</h3>
                  <p className="text-sm opacity-90">{user.email}</p>
                  <div className="flex items-center mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role.name)} bg-white/20 text-white border border-white/30`}>
                      <Shield className="h-3 w-3 mr-1 inline" />
                      {user.role.displayName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <div className="p-3 border-b border-gray-100">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">User ID</p>
                    <p className="font-mono text-gray-900">{user.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Status</p>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-green-700 font-medium">Active</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span suppressHydrationWarning>Last login: {formatLastLogin(user.lastLogin)}</span>
                </div>
              </div>

              <div className="p-2 space-y-1">
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">Profile Settings</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                  <Settings className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">Preferences</span>
                </button>
                
                <button className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left">
                  <Shield className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-700">Security</span>
                </button>
              </div>

              {/* Permissions Overview */}
              <div className="p-3 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Permissions</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {user.permissions.slice(0, 6).map((permission, index) => (
                    <div key={index} className="bg-gray-50 px-2 py-1 rounded text-gray-600">
                      {permission.name.split(' ')[0]} {permission.resource}
                    </div>
                  ))}
                  {user.permissions.length > 6 && (
                    <div className="bg-gray-50 px-2 py-1 rounded text-gray-600">
                      +{user.permissions.length - 6} more
                    </div>
                  )}
                </div>
              </div>

              {/* Logout */}
              <div className="p-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    logout()
                    setIsOpen(false)
                  }}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-red-50 transition-colors text-left text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
