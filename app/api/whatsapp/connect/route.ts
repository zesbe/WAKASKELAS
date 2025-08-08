import { NextResponse } from 'next/server'
import { whatsappService } from '../../../../lib/whatsapp'
import { rateLimiter } from '../../../../lib/rateLimiter'

export async function POST() {
  try {
    // Check rate limit first
    const clientId = 'default' // Could use IP address here

    if (!rateLimiter.checkQRGenerationLimit(clientId)) {
      const remainingTime = rateLimiter.getQRRemainingTime(clientId)
      const remainingMinutes = Math.ceil(remainingTime / (1000 * 60))

      return NextResponse.json({
        success: false,
        error: `Rate limit exceeded. Tunggu ${remainingMinutes} menit sebelum generate QR lagi.`,
        rateLimited: true,
        remainingTime
      }, { status: 429 })
    }

    console.log('Starting fresh WhatsApp connection with rate limiting...')

    // Clear auth and start fresh connection
    await whatsappService.clearAuthAndReconnect()

    // Wait for QR code generation with timeout
    let qrCode = whatsappService.getQR()
    let attempts = 0
    const maxAttempts = 10 // 10 seconds max

    while (!qrCode && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      qrCode = whatsappService.getQR()
      attempts++
      console.log(`Waiting for QR... attempt ${attempts}`)
    }

    const connectionState = whatsappService.getConnectionState()

    console.log('Final result:', { qrCode: qrCode ? 'GENERATED' : 'NOT_GENERATED', connectionState })

    return NextResponse.json({
      success: true,
      qrCode: qrCode || null,
      connectionState,
      message: qrCode ? 'QR Code siap untuk discan' : 'Sedang menyiapkan koneksi...'
    })
  } catch (error) {
    console.error('Error connecting to WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal memulai koneksi WhatsApp'
    }, { status: 500 })
  }
}
