import { NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function POST() {
  try {
    console.log('Attempting to restore existing WhatsApp session...')
    
    // Check if auth files exist
    const fs = require('fs')
    const authDir = './auth_info_baileys'
    
    if (!fs.existsSync(authDir)) {
      return NextResponse.json({
        success: false,
        error: 'Tidak ada session tersimpan. Harus generate QR code baru setelah ban terangkat.'
      }, { status: 404 })
    }

    // Try to initialize with existing session (no QR needed)
    await whatsappService.initializeWhatsApp()
    
    // Check if connected
    const isConnected = whatsappService.isReady()
    const connectionState = whatsappService.getConnectionState()

    if (isConnected) {
      return NextResponse.json({
        success: true,
        message: 'Session berhasil direstore!',
        isConnected: true,
        connectionState
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Session expired atau tidak valid. Perlu QR code baru.',
        isConnected: false,
        connectionState
      })
    }
  } catch (error) {
    console.error('Error restoring session:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal restore session WhatsApp'
    }, { status: 500 })
  }
}
