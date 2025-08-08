import { NextResponse } from 'next/server'
import { whatsappService } from '../../../../lib/whatsapp'

export async function GET() {
  try {
    const qrCode = whatsappService.getQR()
    const connectionState = whatsappService.getConnectionState()
    const isConnected = whatsappService.isReady()

    return NextResponse.json({
      qrCode,
      connectionState,
      isConnected,
      success: true
    })
  } catch (error) {
    console.error('Error getting WhatsApp status:', error)
    return NextResponse.json({
      qrCode: null,
      connectionState: 'close',
      isConnected: false,
      success: false,
      error: 'Failed to get status'
    }, { status: 500 })
  }
}
