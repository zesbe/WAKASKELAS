import { NextResponse } from 'next/server'
import { secureWhatsAppService } from '../../../../lib/whatsapp-secure'

let isConnecting = false
let lastConnectionAttempt = 0
const CONNECTION_COOLDOWN = 30000 // 30 seconds cooldown between attempts

export async function POST() {
  try {
    const now = Date.now()
    
    // Rate limiting for connection attempts
    if (now - lastConnectionAttempt < CONNECTION_COOLDOWN) {
      return NextResponse.json({
        success: false,
        error: 'Tunggu 30 detik sebelum mencoba koneksi lagi',
        rateLimited: true,
        remainingCooldown: CONNECTION_COOLDOWN - (now - lastConnectionAttempt)
      }, { status: 429 })
    }

    if (isConnecting) {
      return NextResponse.json({
        success: false,
        error: 'Sedang dalam proses koneksi, harap tunggu...'
      }, { status: 423 })
    }

    // Check security metrics
    const securityMetrics = secureWhatsAppService.getSecurityMetrics()
    if (securityMetrics.suspiciousActivity) {
      return NextResponse.json({
        success: false,
        error: 'Koneksi diblokir karena aktivitas mencurigakan. Tunggu 5 menit.',
        securityBlocked: true
      }, { status: 403 })
    }

    isConnecting = true
    lastConnectionAttempt = now

    console.log('🔒 Starting secure WhatsApp connection...')
    
    const success = await secureWhatsAppService.initializeWhatsApp()
    
    if (success) {
      // Wait a bit for QR generation
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const qrCode = secureWhatsAppService.getQR()
      const connectionState = secureWhatsAppService.getConnectionState()
      
      return NextResponse.json({
        success: true,
        qrCode,
        connectionState,
        securityStatus: 'protected',
        message: 'Koneksi aman diinisialisasi. Scan QR code dalam 2 menit.'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Gagal memulai koneksi aman',
        securityMetrics: {
          failedAttempts: securityMetrics.failedAttempts,
          rateLimitViolations: securityMetrics.rateLimitViolations
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error in secure connect:', error)
    return NextResponse.json({
      success: false,
      error: 'Terjadi kesalahan dalam koneksi aman',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  } finally {
    isConnecting = false
  }
}
