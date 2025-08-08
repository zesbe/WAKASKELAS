import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp'

export async function POST(request: NextRequest) {
  try {
    const { to, message } = await request.json()

    if (!to || !message) {
      return NextResponse.json(
        { error: 'to and message are required' },
        { status: 400 }
      )
    }

    // Clean phone number format
    const cleanPhone = to.startsWith('62') ? to : `62${to.replace(/^0/, '')}`
    const jid = `${cleanPhone}@s.whatsapp.net`

    // Check if WhatsApp is connected
    if (!whatsappService.isReady()) {
      return NextResponse.json(
        {
          success: false,
          error: 'WhatsApp client not connected',
          details: 'Please connect to WhatsApp first'
        },
        { status: 503 }
      )
    }

    console.log(`📱 Sending WhatsApp to ${cleanPhone}:`, message)

    // Send message using WhatsApp service
    const sendResult = await whatsappService.sendMessage(jid, message)

    if (!sendResult) {
      throw new Error('Failed to send message')
    }

    return NextResponse.json({
      success: true,
      data: {
        to: cleanPhone,
        messageId: `msg_${Date.now()}`,
        status: 'sent',
        sentAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ WhatsApp send error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send WhatsApp message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Send Message API',
    status: 'active',
    timestamp: new Date().toISOString()
  })
}
