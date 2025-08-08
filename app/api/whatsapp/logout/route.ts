import { NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function POST() {
  try {
    await whatsappService.logout()
    
    return NextResponse.json({
      success: true,
      message: 'WhatsApp berhasil diputuskan'
    })
  } catch (error) {
    console.error('Error logging out from WhatsApp:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal memutuskan koneksi WhatsApp'
    }, { status: 500 })
  }
}
