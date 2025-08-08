import { NextResponse } from 'next/server'
import { secureWhatsAppService } from '../../../../lib/whatsapp-secure'

export async function POST() {
  try {
    console.log('🔄 Attempting to restore permanent session...')
    
    const success = await secureWhatsAppService.restorePermanentSession()
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Session permanen berhasil direstore - tidak perlu scan QR lagi!',
        sessionType: 'permanent',
        autoRefresh: true,
        nextRefresh: '8 hours',
        expirationPolicy: 'never'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Tidak ada session tersimpan - perlu scan QR sekali saja',
        requiresQR: true,
        sessionType: 'new'
      })
    }
  } catch (error) {
    console.error('Error restoring permanent session:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal restore session permanen',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
