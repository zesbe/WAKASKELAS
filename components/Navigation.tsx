'use client'

import { useState, memo, useMemo, useCallback } from 'react'
import { ArrowLeft, Home, Navigation, X, BarChart3, Users, MessageSquare, Settings, ChevronRight, TrendingUp, TrendingDown, CreditCard, Brain } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from './AuthProvider'
import UserMenu from './UserMenu'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
}

const BreadcrumbNav = memo(function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-secondary-600 mb-4">
      <Link href="/" className="hover:text-primary-600 transition-colors flex items-center space-x-1">
        <Home className="h-4 w-4" />
        <span>Dashboard</span>
      </Link>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center space-x-2">
          <ChevronRight className="h-4 w-4 text-secondary-400" />
          {item.href ? (
            <Link href={item.href} className="hover:text-primary-600 transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-secondary-900 font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
})

interface BackButtonProps {
  href?: string
  label?: string
  onClick?: () => void
}

const BackButton = memo(function BackButton({ href = "/", label = "Kembali ke Dashboard", onClick }: BackButtonProps) {
  const handleClick = useCallback(() => {
    if (onClick) {
      onClick()
    } else if (typeof window !== 'undefined') {
      window.history.back()
    }
  }, [onClick])

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center space-x-3 text-secondary-600 hover:text-secondary-900 transition-all duration-200 group">
        <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-card border border-white/50 group-hover:shadow-card-hover group-hover:scale-105 transition-all duration-200">
          <ArrowLeft className="h-5 w-5" />
        </div>
        <span className="font-medium group-hover:text-primary-600 transition-colors duration-200">{label}</span>
      </Link>
    )
  }

  return (
    <button onClick={handleClick} className="inline-flex items-center space-x-3 text-secondary-600 hover:text-secondary-900 transition-all duration-200 group">
      <div className="bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-card border border-white/50 group-hover:shadow-card-hover group-hover:scale-105 transition-all duration-200">
        <ArrowLeft className="h-5 w-5" />
      </div>
      <span className="font-medium group-hover:text-primary-600 transition-colors duration-200">{label}</span>
    </button>
  )
})

const FloatingNav = memo(function FloatingNav() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = useMemo(() => [
    { href: '/', icon: Home, label: 'Dashboard', color: 'bg-blue-500' },
    { href: '/analytics', icon: BarChart3, label: 'Analytics', color: 'bg-gradient-to-r from-purple-500 to-pink-600' },
    { href: '/smart-reminders', icon: Brain, label: 'Smart Reminders', color: 'bg-gradient-to-r from-indigo-500 to-purple-600' },
    { href: '/payment-center', icon: CreditCard, label: 'Payment Center', color: 'bg-gradient-to-r from-blue-500 to-purple-600' },
    { href: '/kas-kelas', icon: BarChart3, label: 'Kas Kelas', color: 'bg-green-500' },
    { href: '/pengeluaran', icon: TrendingDown, label: 'Pengeluaran', color: 'bg-red-500' },
    { href: '/laporan-keuangan', icon: TrendingUp, label: 'Laporan Keuangan', color: 'bg-indigo-500' },
    { href: '/wali-murid', icon: Users, label: 'Data Siswa', color: 'bg-purple-500' },
    { href: '/reminder-tagihan', icon: MessageSquare, label: 'Reminder', color: 'bg-emerald-500' },
    { href: '/users', icon: Users, label: 'User Management', color: 'bg-cyan-500' },
    { href: '/webhook-config', icon: Settings, label: 'Webhook', color: 'bg-yellow-500' },
    { href: '/settings/device', icon: Settings, label: 'WhatsApp', color: 'bg-orange-500' },
  ], [])

  const toggleMenu = useCallback(() => {
    setIsOpen(!isOpen)
  }, [isOpen])

  const handleItemClick = useCallback(() => {
    setIsOpen(false)
  }, [])

  const handleBackdropClick = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <div className="floating-nav-container">
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-3" style={{ zIndex: 999998 }}>
          {navItems.map((item, index) => (
            <div key={item.href} className="flex items-center justify-end group" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="bg-white px-3 py-2 rounded-lg shadow-lg mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-sm font-medium text-gray-800 whitespace-nowrap">{item.label}</span>
              </div>
              <Link
                href={item.href}
                onClick={handleItemClick}
                className={`${item.color} text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110`}
              >
                <item.icon className="h-5 w-5" />
              </Link>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20"
          style={{ zIndex: 999997 }}
          onClick={handleBackdropClick}
        />
      )}

      <button
        onClick={toggleMenu}
        className={`floating-nav-button ${isOpen ? 'rotate-45' : ''}`}
        style={{
          position: 'fixed',
          bottom: '4rem',
          right: '1.5rem',
          zIndex: 999999,
          backgroundColor: isOpen ? '#ef4444' : undefined
        }}
      >
        {isOpen ? (
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        ) : (
          <Navigation className="h-5 w-5 sm:h-6 sm:w-6" />
        )}
      </button>
    </div>
  )
})

interface SideNavProps {
  isOpen: boolean
  onClose: () => void
}

const SideNav = memo(function SideNav({ isOpen, onClose }: SideNavProps) {
  const navItems = useMemo(() => [
    { href: '/', icon: Home, label: 'Dashboard', color: 'text-primary-600', bg: 'bg-primary-50' },
    { href: '/analytics', icon: BarChart3, label: 'Advanced Analytics', color: 'text-purple-600', bg: 'bg-purple-50' },
    { href: '/smart-reminders', icon: Brain, label: 'Smart Reminders', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { href: '/payment-center', icon: CreditCard, label: 'Payment Center', color: 'text-blue-600', bg: 'bg-blue-50' },
    { href: '/kas-kelas', icon: BarChart3, label: 'Kelola Kas Kelas', color: 'text-success-600', bg: 'bg-success-50' },
    { href: '/pengeluaran', icon: TrendingDown, label: 'Pengeluaran', color: 'text-red-600', bg: 'bg-red-50' },
    { href: '/laporan-keuangan', icon: TrendingUp, label: 'Laporan Keuangan', color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { href: '/wali-murid', icon: Users, label: 'Data Siswa', color: 'text-primary-600', bg: 'bg-primary-50' },
    { href: '/reminder-tagihan', icon: MessageSquare, label: 'Reminder Tagihan', color: 'text-whatsapp-600', bg: 'bg-whatsapp-50' },
    { href: '/users', icon: Users, label: 'User Management', color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { href: '/webhook-config', icon: Settings, label: 'Webhook Config', color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { href: '/settings/device', icon: Settings, label: 'WhatsApp Setup', color: 'text-warning-600', bg: 'bg-warning-50' },
  ], [])

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <div className={`fixed top-0 left-0 h-full w-80 bg-white/95 backdrop-blur-glass shadow-glass border-r border-white/50 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-primary-500 to-accent-500 p-2 rounded-xl">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-secondary-900">Kas Kelas</h2>
                <p className="text-sm text-secondary-600">Ibnu Sina</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center space-x-3 p-4 rounded-2xl hover:bg-gradient-to-r hover:from-primary-50 hover:to-accent-50 transition-all duration-200 group"
              >
                <div className={`p-2 rounded-xl ${item.bg} group-hover:scale-110 transition-transform duration-200`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors duration-200">
                  {item.label}
                </span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-6 left-6 right-6">
            <div className="mb-4">
              <UserMenu />
            </div>
            <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 rounded-2xl">
              <h3 className="font-semibold text-secondary-900 text-sm mb-1">Kelas 1 Ibnu Sina</h3>
              <p className="text-xs text-secondary-600">Sistem Kas Digital Modern</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
})

export { BreadcrumbNav, BackButton, FloatingNav, SideNav }
