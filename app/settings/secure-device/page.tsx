'use client'

import { useState, useEffect } from 'react'
import { Shield, Smartphone, Wifi, WifiOff, Settings, Monitor, AlertTriangle, CheckCircle, Lock, Unlock } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, FloatingNav } from '../../../components/Navigation'
import SecurityMonitor from '../../../components/SecurityMonitor'

export default function SecureDeviceSettingsPage() {
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<string>('close')
  const [isConnected, setIsConnected] = useState(false)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [securityStatus, setSecurityStatus] = useState<any>(null)
  const [lastSecurityAlert, setLastSecurityAlert] = useState<string>('')

  useEffect(() => {
    // Auto-restore permanent session first
    autoRestorePermanentSession()

    // Check status on load
    checkSecureStatus()

    // Polling for status updates
    const interval = setInterval(checkSecureStatus, 15000) // Every 15 seconds

    return () => clearInterval(interval)
  }, [])

  const autoRestorePermanentSession = async () => {
    try {
      console.log('🔄 Attempting auto-restore of permanent session...')
      const response = await fetch('/api/whatsapp-secure/restore-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      if (data.success) {
        console.log('✅ Permanent session auto-restored!')
        // No need to show alert - it's automatic
      } else {
        console.log('No existing session - user will need to scan QR once')
      }
    } catch (error) {
      console.log('Auto-restore failed, normal for first-time users')
    }
  }

  const checkSecureStatus = async () => {
    try {
      const res = await fetch('/api/whatsapp-secure/status')
      if (res.ok) {
        const data = await res.json()
        setQrCode(data.qrCode || null)
        setConnectionState(data.connectionState || 'close')
        setIsConnected(data.isConnected || false)
        setSecurityStatus(data.securityStatus)
      } else {
        console.log('Secure status API returned error:', res.status)
        setIsConnected(false)
        setConnectionState('close')
      }
    } catch (error) {
      console.log('Secure status check failed:', error)
      setIsConnected(false)
      setConnectionState('close')
    }
  }

  const handleSecureConnect = async () => {
    if (isGeneratingQR) return

    try {
      setIsGeneratingQR(true)
      console.log('Starting secure WhatsApp connection...')

      const response = await fetch('/api/whatsapp-secure/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      console.log('Secure connect response:', data)

      if (data.success) {
        console.log('Secure QR code received:', data.qrCode ? 'SUCCESS' : 'NO QR CODE')
        setQrCode(data.qrCode)
        if (data.message) {
          alert(`✅ ${data.message}`)
        }
      } else {
        console.error('Secure connection failed:', data.error)
        if (data.rateLimited) {
          alert(`⚠️ Rate Limit Terdeteksi!\n\n${data.error}\n\nWaktu tunggu: ${Math.ceil(data.remainingCooldown / 1000)} detik`)
        } else if (data.securityBlocked) {
          alert(`🛡️ Koneksi Diblokir Keamanan!\n\n${data.error}`)
        } else {
          alert(`❌ ${data.error}`)
        }
      }
    } catch (error) {
      console.error('Error in secure connect:', error)
      alert('Terjadi kesalahan saat membuat koneksi aman')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const handleSecureLogout = async () => {
    if (!confirm('Yakin ingin logout dari WhatsApp dengan aman?')) return
    
    try {
      const response = await fetch('/api/whatsapp-secure/logout', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const data = await response.json()
      if (data.success) {
        setQrCode(null)
        setIsConnected(false)
        setConnectionState('close')
        alert('✅ Logout aman berhasil dilakukan')
      } else {
        alert(`❌ ${data.error}`)
      }
    } catch (error) {
      console.error('Error in secure logout:', error)
      alert('Terjadi kesalahan saat logout aman')
    }
  }

  const getConnectionStatusIcon = () => {
    if (isConnected) {
      return <CheckCircle className="h-6 w-6 text-green-500" />
    } else if (connectionState === 'connecting') {
      return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
    } else {
      return <AlertTriangle className="h-6 w-6 text-red-500" />
    }
  }

  const getConnectionStatusText = () => {
    if (isConnected) return 'Connected & Secured'
    if (connectionState === 'connecting') return 'Establishing Secure Connection...'
    return 'Disconnected'
  }

  const getConnectionStatusColor = () => {
    if (isConnected) return 'text-green-600'
    if (connectionState === 'connecting') return 'text-blue-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Secure WhatsApp Setup' }]} />
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">🛡️ Secure WhatsApp Setup</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">
                  Enhanced Security WhatsApp Connection
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Monitor */}
        <div className="mb-8">
          <SecurityMonitor />
        </div>

        {/* Connection Status */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Monitor className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Secure Connection Status</h2>
                <p className="text-sm text-gray-600">Enhanced WhatsApp Security Gateway</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1">
                {getConnectionStatusIcon()}
                <span className={`font-semibold ${getConnectionStatusColor()}`}>
                  {getConnectionStatusText()}
                </span>
              </div>
              <p className="text-xs text-gray-500">State: {connectionState}</p>
            </div>
          </div>

          {/* Security Features Info */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Lock className="h-5 w-5 mr-2 text-purple-600" />
              Enhanced Security Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Rate limiting protection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Anti-spam detection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Session security validation</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>User agent rotation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Intelligent reconnection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Message queue security</span>
                </div>
              </div>
            </div>
          </div>

          {!isConnected && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🔐 Koneksi Permanen & Aman</h3>
                <p className="text-blue-800 text-sm mb-3">
                  <strong>Scan QR CUMA SEKALI!</strong> Session akan berjalan permanen dengan auto-refresh tiap 8 jam.
                  Sistem keamanan berlapis melindungi dari banned dan spam detection.
                </p>
                <button
                  onClick={handleSecureConnect}
                  disabled={isGeneratingQR}
                  className="btn-primary bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                >
                  {isGeneratingQR ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Membuat Koneksi Aman...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Start Secure Connection
                    </>
                  )}
                </button>
              </div>

              {qrCode && (
                <div className="bg-white border-2 border-purple-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Smartphone className="h-5 w-5 mr-2 text-purple-600" />
                    🎉 Scan QR Sekali Saja - Setup Permanen!
                  </h3>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                      <img src={qrCode} alt="Secure QR Code" className="w-64 h-64" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">
                        1. Buka WhatsApp di ponsel Anda
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        2. Tap menu ⋮ → Linked Devices
                      </p>
                      <p className="text-sm text-gray-600 mb-4">
                        3. Scan QR code di atas
                      </p>
                      <div className="bg-purple-50 border border-purple-200 rounded p-3">
                        <p className="text-xs text-purple-800">
                          🎉 <strong>Setup Sekali Saja!</strong> Setelah scan QR ini, Anda tidak perlu scan lagi.
                          Session akan berjalan permanen dengan auto-refresh otomatis tiap 8 jam.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {isConnected && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-900">WhatsApp Terhubung Aman!</h3>
                </div>
                <p className="text-green-800 text-sm mb-3">
                  Koneksi WhatsApp Anda sekarang dilindungi dengan sistem keamanan berlapis.
                </p>
                
                {securityStatus && (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">Status Keamanan:</span>
                      <span className={`ml-2 font-medium ${securityStatus.isSecure ? 'text-green-600' : 'text-yellow-600'}`}>
                        {securityStatus.isSecure ? 'Aman' : 'Peringatan'}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-700">Stabilitas:</span>
                      <span className={`ml-2 font-medium ${securityStatus.connectionStability === 'stable' ? 'text-green-600' : 'text-yellow-600'}`}>
                        {securityStatus.connectionStability === 'stable' ? 'Stabil' : 'Tidak Stabil'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Link href="/reminder-tagihan" className="btn-primary flex-1 text-center">
                  <span>Test Secure Messaging</span>
                </Link>
                <button
                  onClick={handleSecureLogout}
                  className="btn-secondary flex items-center"
                >
                  <Unlock className="h-4 w-4 mr-2" />
                  Secure Logout
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Information */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
              Informasi Keamanan
            </h3>
            <div className="flex space-x-4">
              <Link
                href="/security-info"
                className="text-purple-600 hover:text-purple-800 text-sm font-medium underline"
              >
                Penjelasan Detail →
              </Link>
              <Link
                href="/security-comparison"
                className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
              >
                Vs Service Komersial →
              </Link>
            </div>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="font-semibold text-yellow-900 mb-2">🚨 Mengapa Perlu Keamanan Ekstra?</h4>
              <ul className="space-y-1 text-yellow-800">
                <li>• WhatsApp dapat mendeteksi aktivitas bot dan memblokir akun</li>
                <li>• Rate limiting melindungi dari spam detection</li>
                <li>• User agent rotation menghindari fingerprinting</li>
                <li>• Session management mencegah konflik multi-device</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded p-3">
              <h4 className="font-semibold text-blue-900 mb-2">🛡️ Fitur Keamanan yang Diaktifkan:</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• <strong>Rate Limiting:</strong> Maksimal 5 pesan/menit, 50 pesan/jam</li>
                <li>• <strong>Message Interval:</strong> Minimum 12 detik antar pesan</li>
                <li>• <strong>Batch Processing:</strong> Broadcast dibagi dalam batch kecil</li>
                <li>• <strong>Duplicate Protection:</strong> Mencegah pesan duplikat</li>
                <li>• <strong>Session Security:</strong> Auto-logout setelah 24 jam</li>
                <li>• <strong>Idle Protection:</strong> Disconnect setelah 30 menit idle</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded p-3">
              <h4 className="font-semibold text-green-900 mb-2">✅ Tips Penggunaan Aman:</h4>
              <ul className="space-y-1 text-green-800">
                <li>• Gunakan pesan yang natural dan tidak terkesan spam</li>
                <li>• Jangan kirim broadcast berlebihan dalam waktu singkat</li>
                <li>• Logout secara berkala untuk refresh session</li>
                <li>• Monitor security alerts yang muncul</li>
                <li>• Hindari menggunakan multiple device secara bersamaan</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
