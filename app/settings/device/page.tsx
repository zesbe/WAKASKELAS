'use client'

import { useState, useEffect } from 'react'
import { Smartphone, Wifi, WifiOff, Settings, Monitor } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, FloatingNav } from '../../../components/Navigation'

export default function DeviceSettingsPage() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<string>('close')
  const [isConnected, setIsConnected] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [qrGenerated, setQrGenerated] = useState(false)

  useEffect(() => {
    // Auto-restore session on page load
    const autoRestoreSession = async () => {
      try {
        const response = await fetch('/api/whatsapp/restore-session', { method: 'POST' })
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            console.log('Session auto-restored successfully')
          }
        }
      } catch (error) {
        console.log('Auto-restore failed, normal for first time users')
      }
    }

    // Simple status polling
    const connectSocket = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const res = await fetch('/api/whatsapp/status', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()
          setQrCode(data.qrCode || null)
          setConnectionState(data.connectionState || 'close')
          setIsConnected(data.isConnected || false)
        } else {
          console.log('Status API returned error:', res.status)
          setIsConnected(false)
          setConnectionState('close')
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Status check timed out')
        } else {
          console.log('Status check failed:', error.message)
        }
        setIsConnected(false)
        setConnectionState('close')
      }
    }

    // Try auto-restore first, then start polling
    autoRestoreSession()

    // Initial status check
    connectSocket()

    // Status polling with longer interval to reduce server load
    const interval = setInterval(connectSocket, 10000) // Increased to 10 seconds

    return () => clearInterval(interval)
  }, [])

  const handleConnect = async () => {
    if (isGeneratingQR) return

    try {
      setIsGeneratingQR(true)
      console.log('Starting WhatsApp connection...')

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

      const response = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('Connect response:', data)

      if (data.success) {
        console.log('Setting QR code:', data.qrCode ? 'SUCCESS' : 'NO QR CODE')
        setQrCode(data.qrCode)
        setQrGenerated(true)
      } else {
        console.error('Connection failed:', data.error)
        if (data.rateLimited) {
          alert('⚠️ WhatsApp Rate Limit Detected!\n\nTerlalu banyak generate QR code. WhatsApp telah memblokir sementara.\n\nSolusi:\n1. Tunggu 2-4 jam\n2. Gunakan WhatsApp Web di browser biasa\n3. Atau restart modem untuk IP baru')
        } else {
          alert('Gagal membuat QR code: ' + data.error)
        }
      }
    } catch (error) {
      console.error('Error connecting:', error)
      alert('Terjadi kesalahan saat membuat koneksi')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleRestoreSession = async () => {
    try {
      setIsGeneratingQR(true)
      const response = await fetch('/api/whatsapp/restore-session', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        setIsConnected(true)
        alert('✅ Session berhasil direstore!')
      } else {
        alert('❌ ' + data.error)
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      alert('Terjadi kesalahan saat restore session')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleResetBan = async () => {
    if (!confirm('Reset rate limiter? Ini akan clear semua data session.')) return
    
    try {
      const response = await fetch('/api/whatsapp/reset-ban', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        alert('✅ Rate limiter berhasil direset!')
      } else {
        alert('❌ ' + data.error)
      }
    } catch (error) {
      console.error('Error resetting ban:', error)
      alert('Terjadi kesalahan saat reset')
    }
  }

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/whatsapp/logout', { method: 'POST' })
      if (response.ok) {
        setQrCode(null)
        setIsConnected(false)
        setConnectionState('close')
        setQrGenerated(false)
      }
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Pengaturan Device' }]} />
            <h1 className="text-xl sm:text-3xl font-bold gradient-text">Pengaturan Device WhatsApp</h1>
            <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">WhatsApp Connection Setup</p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Connection Status */}
        <div className="card mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-whatsapp-100 p-3 rounded-lg">
                <Monitor className="h-6 w-6 text-whatsapp-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Status Koneksi</h2>
                <p className="text-sm text-gray-600">WhatsApp Business Gateway</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-2 text-whatsapp-600">
                  <Wifi className="h-5 w-5" />
                  <span className="text-sm font-medium">Terhubung</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 text-red-600">
                  <WifiOff className="h-5 w-5" />
                  <span className="text-sm font-medium">Terputus</span>
                </div>
              )}
            </div>
          </div>

          {isConnected && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-800">WhatsApp Business Ready!</p>
                  <p className="text-xs text-green-600">Siap untuk broadcast marketing</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-secondary text-sm"
                >
                  Putuskan Koneksi
                </button>
              </div>
            </div>
          )}
        </div>

        {!isConnected ? (
          /* Device Connection Setup */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* QR Code Section */}
            <div className="card">
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Tautkan Device</h3>
                  <p className="text-sm text-gray-600">Hubungkan WhatsApp Business Anda</p>
                </div>
              </div>

              {qrCode ? (
                <div className="text-center space-y-4">
                  <div className="inline-block p-4 bg-white rounded-lg border-2 border-gray-200">
                    <img src={qrCode} alt="QR Code" className="w-48 h-48 mx-auto" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Scan dengan WhatsApp Business</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>1. Buka WhatsApp Business di ponsel</p>
                      <p>2. Menu ⋮ &gt; Perangkat Tertaut</p>
                      <p>3. Tautkan Perangkat</p>
                      <p>4. Scan QR code di atas</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleConnect}
                    className="btn-secondary text-sm"
                  >
                    Refresh QR Code
                  </button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    {isGeneratingQR ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp-600 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-600">Menyiapkan QR Code...</p>
                      </div>
                    ) : (
                      <Smartphone className="h-12 w-12 text-gray-400" />
                    )}
                  </div>

                  {!isGeneratingQR && (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">📱 Restore Session Otomatis</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Jika sebelumnya sudah pernah login, coba restore session terlebih dahulu
                        </p>
                        <button
                          onClick={handleRestoreSession}
                          disabled={isGeneratingQR}
                          className="btn-primary text-sm"
                        >
                          Restore Session
                        </button>
                      </div>

                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">⚠️ WhatsApp Rate Limit</h4>
                        <p className="text-sm text-red-700 mb-3">
                          Terlalu banyak generate QR code. WhatsApp memblokir IP sementara.
                        </p>
                        <div className="text-xs text-red-600 space-y-1">
                          <p><strong>Solusi:</strong></p>
                          <p>• Tunggu 2-4 jam untuk reset otomatis</p>
                          <p>• Restart modem untuk IP baru</p>
                          <p>• Gunakan koneksi internet lain</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <button 
                          onClick={handleRestoreSession}
                          className="btn-primary w-full"
                          disabled={isGeneratingQR}
                        >
                          {isGeneratingQR ? 'Checking...' : 'Restore Session Lama'}
                        </button>
                        
                        <button
                          onClick={handleConnect}
                          className="btn-secondary w-full"
                          disabled={isGeneratingQR}
                        >
                          Generate QR Code (Rate Limited)
                        </button>
                        
                        <button 
                          onClick={handleResetBan}
                          className="btn-secondary w-full text-xs"
                        >
                          Reset Rate Limiter
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Instructions & Info */}
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Untuk Business Marketing</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-whatsapp-600 rounded-full mt-2"></div>
                    <p>Gunakan WhatsApp Business untuk fitur professional</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-whatsapp-600 rounded-full mt-2"></div>
                    <p>Broadcast ke ratusan customer sekaligus</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-whatsapp-600 rounded-full mt-2"></div>
                    <p>Kelola campaign marketing dengan mudah</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-whatsapp-600 rounded-full mt-2"></div>
                    <p>Analisis performa dan engagement</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Keamanan & Privasi</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p>Koneksi aman end-to-end encryption</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p>Data tidak disimpan di server kami</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <p>Dapat putuskan koneksi kapan saja</p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Alternatif Sementara</h4>
                <p className="text-xs text-blue-700">
                  Gunakan <a href="https://web.whatsapp.com" target="_blank" className="underline font-medium">WhatsApp Web</a> di browser sambil menunggu rate limit teratasi.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Connected State - Show Device Info */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Device Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="text-green-600 font-medium">Connected</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Connection:</span>
                  <span className="text-gray-900">{connectionState}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mode:</span>
                  <span className="text-gray-900">Business Gateway</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <Link href="/broadcast" className="btn-primary w-full text-center">
                  Mulai Broadcast
                </Link>
                <Link href="/campaigns" className="btn-secondary w-full text-center">
                  Kelola Campaign
                </Link>
              </div>
            </div>

            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Tips Marketing</h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Kirim pesan di jam optimal (9-11 AM)</p>
                <p>• Gunakan nama customer untuk personalisasi</p>
                <p>• Sertakan call-to-action yang jelas</p>
                <p>• Monitor response rate di dashboard</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
