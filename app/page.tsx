'use client'

import { useState, useEffect, useRef } from 'react'
import { CreditCard, Users, MessageSquare, BarChart3, TrendingUp, TrendingDown, QrCode, Zap, CheckCircle, Wifi, WifiOff, Settings, Menu, Clock } from 'lucide-react'
import Link from 'next/link'
import { FloatingNav, SideNav } from '../components/Navigation'

interface Stats {
  totalStudents: number
  paidStudents: number
  unpaidStudents: number
  paymentRate: number
  totalRevenue: number
  totalPayments: number
}

export default function HomePage() {
  const [connectionState, setConnectionState] = useState<string>('close')
  const [isConnected, setIsConnected] = useState(false)
  const [isSideNavOpen, setIsSideNavOpen] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('/api/payment/webhook')
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const isMountedRef = useRef(true)

  // Helper function for safe state updates
  const safeSetState = (setterFn: () => void) => {
    if (isMountedRef.current) {
      try {
        setterFn()
      } catch (error) {
        console.log('State update error (component may be unmounted):', error)
      }
    }
  }

  // Helper function for retrying failed requests
  const retryRequest = async (requestFn: () => Promise<any>, maxRetries = 2, delay = 1000) => {
    let lastError: any

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await requestFn()
      } catch (error: any) {
        lastError = error
        if (i < maxRetries && error.name !== 'AbortError') {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        }
      }
    }

    throw lastError
  }

  useEffect(() => {
    let isMounted = true

    // Set webhook URL on client side to avoid hydration mismatch
    setWebhookUrl(`${window.location.origin}/api/payment/webhook`)

    const loadStatsIfMounted = async () => {
      if (isMounted) await loadStats()
    }

    const checkStatusIfMounted = async () => {
      if (isMounted) await checkWhatsAppStatus()
    }

    loadStatsIfMounted()
    checkStatusIfMounted()

    // Refresh data every 60 seconds to reduce load
    const interval = setInterval(() => {
      if (isMounted && !isLoadingStats && !isCheckingStatus) {
        loadStatsIfMounted()
        checkStatusIfMounted()
      }
    }, 60000)

    return () => {
      isMounted = false
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [])

  const loadStats = async () => {
    if (isLoadingStats) return // Prevent concurrent requests

    setIsLoadingStats(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

      const response = await fetch('/api/stats', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.stats && isMountedRef.current) {
          setStats(data.stats)
        }
      } else {
        console.log('Stats API returned error:', response.status)
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Stats request was cancelled (timeout)')
        // Still need to reset loading state even on abort if mounted
        if (isMountedRef.current) {
          setIsLoadingStats(false)
        }
        return
      }
      console.log('Error loading stats:', error.message)
      // Set default stats if error - only if stats is null and component is mounted
      if (!stats && isMountedRef.current) {
        setStats({
          totalStudents: 0,
          paidStudents: 0,
          unpaidStudents: 0,
          paymentRate: 0,
          totalRevenue: 0,
          totalPayments: 0
        })
      }
      if (isMountedRef.current) {
        setIsLoadingStats(false)
      }
    }
  }

  const checkWhatsAppStatus = async () => {
    if (isCheckingStatus) return // Prevent concurrent requests

    setIsCheckingStatus(true)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 6000) // 6 second timeout

      const res = await fetch('/api/whatsapp/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        cache: 'no-cache' // Prevent caching issues
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        const data = await res.json()
        if (isMountedRef.current) {
          setConnectionState(data.connectionState || 'close')
          setIsConnected(data.isConnected || false)
        }
      } else {
        console.log('WhatsApp status API returned error:', res.status)
        if (isMountedRef.current) {
          setIsConnected(false)
          setConnectionState('close')
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('WhatsApp status request was cancelled (timeout)')
        // Reset loading state even on abort if mounted
        if (isMountedRef.current) {
          setIsCheckingStatus(false)
        }
        return
      } else {
        console.log('WhatsApp status check failed:', error.message)
      }
      if (isMountedRef.current) {
        setIsConnected(false)
        setConnectionState('close')
        setIsCheckingStatus(false)
      }
    }
  }

  const handleLogout = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/whatsapp/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        setIsConnected(false)
        setConnectionState('close')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Logout request was cancelled')
        return
      }
      console.error('Error logging out:', error.message)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-purple-500 to-blue-600 p-3 rounded-2xl shadow-button">
                <CreditCard className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold gradient-text">Kas Digital Kelas 1 Ibnu Sina</h1>
                <p className="text-xs sm:text-sm lg:text-base text-secondary-600 font-medium">Payment System</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isConnected ? (
                <div className="status-success flex items-center space-x-2">
                  <Wifi className="h-4 w-4" />
                  <span className="text-sm font-semibold">WhatsApp Active</span>
                </div>
              ) : (
                <div className="status-error flex items-center space-x-2">
                  <WifiOff className="h-4 w-4" />
                  <span className="text-sm font-semibold">WhatsApp Offline</span>
                </div>
              )}
              <button
                onClick={() => setIsSideNavOpen(true)}
                className="bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 hover:scale-105"
              >
                <Menu className="h-5 w-5 text-secondary-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="mb-8">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-20 h-20 rounded-3xl mx-auto flex items-center justify-center mb-6 floating-element">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold gradient-text mb-4">
              Sistem Pembayaran Kas Otomatis
            </h2>
            <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-secondary-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Platform digital dengan integrasi Pakasir QRIS untuk pembayaran kas kelas yang mudah, cepat, dan otomatis
            </p>
          </div>
          
          {/* Payment Stats */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-secondary-600 font-medium">Total Siswa</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-secondary-600 font-medium">Sudah Bayar</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.paidStudents}</p>
                    <p className="text-xs sm:text-sm text-green-600 font-medium">{stats.paymentRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-red-50 to-pink-50 border border-red-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-secondary-600 font-medium">Belum Bayar</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-600">{stats.unpaidStudents}</p>
                  </div>
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200">
                <div className="flex items-center space-x-4">
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-secondary-600 font-medium">Total Kas</p>
                    <p className="text-sm sm:text-base lg:text-xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Featured Payment Center */}
        <div className="mb-12">
          <Link href="/payment-center">
            <div className="card group hover:shadow-2xl transition-all duration-500 cursor-pointer bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-200">
              <div className="flex items-center space-x-6 p-6">
                <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <CreditCard className="h-10 w-10 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300 mb-2">
                    Payment Center ����
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-4">
                    Generate payment links otomatis, kirim ke WhatsApp, dan tracking pembayaran real-time dengan Pakasir QRIS
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center text-green-600 bg-green-100 px-3 py-1 rounded-full">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      QRIS Payment
                    </span>
                    <span className="flex items-center text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                      <Zap className="h-4 w-4 mr-1" />
                      Auto WhatsApp
                    </span>
                    <span className="flex items-center text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                      <QrCode className="h-4 w-4 mr-1" />
                      Real-time Tracking
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="btn-primary group-hover:bg-purple-600">
                    Buka Payment Center
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Link href="/wali-murid" className="card-feature text-center group">
            <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 icon-container">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
              Data Siswa
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 mb-6 leading-relaxed">
              Kelola database 20 siswa dengan tracking tagihan dan status pembayaran yang lengkap
            </p>
            <div className="btn-primary">Kelola Data</div>
          </Link>

          <Link href="/kas-kelas" className="card-feature text-center group">
            <div className="bg-gradient-to-br from-green-100 to-green-200 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 icon-container">
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 group-hover:text-green-600 transition-colors duration-300">
              Kelola Kas Kelas
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 mb-6 leading-relaxed">
              Catat pemasukan dan pengeluaran kas dengan sistem tracking yang akurat dan real-time
            </p>
            <div className="btn-success">Kelola Kas</div>
          </Link>

          <Link href="/laporan-keuangan" className="card-feature text-center group">
            <div className="bg-gradient-to-br from-indigo-100 to-indigo-200 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 icon-container">
              <TrendingUp className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 group-hover:text-indigo-600 transition-colors duration-300">
              Laporan Keuangan
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 mb-6 leading-relaxed">
              Analisis mendalam dengan grafik dan chart untuk memantau kesehatan keuangan kas kelas
            </p>
            <div className="btn-primary">Lihat Laporan</div>
          </Link>

          <Link href="/pengeluaran" className="card-feature text-center group">
            <div className="bg-gradient-to-br from-red-100 to-red-200 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 icon-container">
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 group-hover:text-red-600 transition-colors duration-300">
              Pengeluaran
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 mb-6 leading-relaxed">
              Tracking pengeluaran dengan kategori yang detail dan analisis tren spending
            </p>
            <div className="btn-secondary">Track Pengeluaran</div>
          </Link>

          <Link href="/reminder-tagihan" className="card-feature text-center group">
            <div className="bg-gradient-to-br from-whatsapp-100 to-whatsapp-200 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 icon-container">
              <MessageSquare className="h-8 w-8 text-whatsapp-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 group-hover:text-whatsapp-600 transition-colors duration-300">
              Reminder Tagihan
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 mb-6 leading-relaxed">
              Broadcast reminder otomatis via WhatsApp dengan template pesan yang personal dan profesional
            </p>
            <div className="btn-whatsapp">Kirim Reminder</div>
          </Link>

          {!isConnected && (
            <Link href="/settings/secure-device" className="card-feature text-center group border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50">
              <div className="bg-gradient-to-br from-purple-100 to-purple-200 w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 icon-container">
                <Settings className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-secondary-900 mb-3 group-hover:text-purple-600 transition-colors duration-300">
                🛡️ Secure WhatsApp
              </h3>
              <p className="text-sm sm:text-base text-secondary-600 mb-6 leading-relaxed">
                Setup WhatsApp dengan keamanan berlapis anti-banned dan spam protection
              </p>
              <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors">Secure Setup</div>
            </Link>
          )}
        </div>

        {/* Webhook Integration Info */}
        <div className="card mb-8 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 w-12 h-12 rounded-xl flex items-center justify-center">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Webhook Integration Ready! 🚀</h3>
              <p className="text-gray-600">Sistem pembayaran otomatis sudah siap digunakan</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">🔗 Webhook URL:</h4>
              <div className="p-3 bg-white rounded-lg border border-yellow-200 font-mono text-sm break-all">
                {webhookUrl}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">⚡ Fitur Otomatis:</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>✅ Update status siswa otomatis</li>
                <li>✅ Tambah ke kas kelas otomatis</li>
                <li>✅ Kirim WhatsApp konfirmasi</li>
                <li>✅ Log semua transaksi</li>
              </ul>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-yellow-200">
            <Link href="/webhook-config" className="btn-warning inline-flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Setup Webhook di Pakasir</span>
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-secondary-900 text-center mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/payment-center" className="btn-primary text-center bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <CreditCard className="h-5 w-5 mr-2" />
              Generate Payment
            </Link>
            <Link href="/wali-murid" className="btn-secondary text-center">
              <Users className="h-5 w-5 mr-2" />
              Kelola Data Siswa
            </Link>
            <Link href="/kas-kelas" className="btn-success text-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Tambah Transaksi
            </Link>
            <Link href="/reminder-tagihan" className="btn-whatsapp text-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Kirim Reminder
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-secondary-50/50 to-primary-50/50 backdrop-blur-sm border-t border-white/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center space-y-4">
            <div className="bg-gradient-to-br from-purple-500 to-blue-600 w-12 h-12 rounded-2xl mx-auto flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold gradient-text">
              Kas Digital Kelas 1 Ibnu Sina
            </h3>
            <p className="text-sm sm:text-base text-secondary-600 max-w-md mx-auto leading-relaxed">
              Platform pembayaran kas kelas modern dengan integrasi Pakasir QRIS dan WhatsApp notifications
            </p>
            <div className="flex justify-center space-x-2 text-xs text-secondary-500">
              <span>���� QRIS Payment</span>
              <span>•</span>
              <span>📱 Mobile-First</span>
              <span>•</span>
              <span>🚀 Auto Notifications</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Side Navigation */}
      <SideNav isOpen={isSideNavOpen} onClose={() => setIsSideNavOpen(false)} />

      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
