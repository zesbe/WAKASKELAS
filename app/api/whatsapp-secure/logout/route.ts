import { NextResponse } from 'next/server'
import { secureWhatsAppService } from '../../../../lib/whatsapp-secure'

export async function POST() {
  try {
    console.log('🔒 Initiating secure logout...')
    
    await secureWhatsAppService.logout()
    
    return NextResponse.json({
      success: true,
      message: 'Logout aman berhasil dilakukan',
      timestamp: new Date().toISOString(),
      securityCleared: true
    })
  } catch (error) {
    console.error('Error in secure logout:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal melakukan logout aman',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
