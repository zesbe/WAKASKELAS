import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Pesan dan kontak tidak boleh kosong'
      }, { status: 400 })
    }

    if (!whatsappService.isReady()) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp belum terhubung'
      }, { status: 400 })
    }

    let success = 0
    let failed = 0

    // Send messages one by one with delay
    for (const msg of messages) {
      try {
        await whatsappService.sendMessage(msg.jid, msg.message)
        success++
        console.log(`Reminder sent to ${msg.wali.namaWali} (${msg.wali.namaAnak})`)
        
        // Delay 2 seconds between messages to avoid spam detection
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Failed to send reminder to ${msg.jid}:`, error)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      result: { success, failed },
      message: `Reminder berhasil dikirim ke ${success} dari ${messages.length} wali murid`
    })

  } catch (error) {
    console.error('Error sending reminder:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengirim reminder'
    }, { status: 500 })
  }
}
