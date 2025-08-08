import { NextResponse } from 'next/server'
import { secureWhatsAppService } from '../../../../lib/whatsapp-secure'

export async function GET() {
  try {
    const qrCode = secureWhatsAppService.getQR()
    const connectionState = secureWhatsAppService.getConnectionState()
    const isConnected = secureWhatsAppService.isReady()
    const securityMetrics = secureWhatsAppService.getSecurityMetrics()
    
    // Don't expose sensitive security details
    const safeSecurityMetrics = {
      isSecure: !securityMetrics.suspiciousActivity,
      messagesThisHour: securityMetrics.messagesThisHour,
      connectionStability: securityMetrics.failedAttempts < 3 ? 'stable' : 'unstable'
    }
    
    return NextResponse.json({
      success: true,
      qrCode,
      connectionState,
      isConnected,
      securityStatus: safeSecurityMetrics,
      timestamp: new Date().toISOString(),
      protectionLevel: 'enhanced'
    })
  } catch (error) {
    console.error('Error getting secure status:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mendapatkan status koneksi aman'
    }, { status: 500 })
  }
}
