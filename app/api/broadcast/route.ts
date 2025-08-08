import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '../../../lib/whatsapp'
import { initDb } from '../../../lib/database'

export async function POST(request: NextRequest) {
  try {
    const { campaignName, message, contacts } = await request.json()

    if (!message || !contacts || contacts.length === 0) {
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

    // Create campaign in database
    const db = initDb()
    const campaign = db.createCampaign(campaignName, message)
    
    // Update target count
    db.updateCampaignStatus(campaign.id, 'sending', 0)

    // Send broadcast
    const result = await whatsappService.broadcastMessage(contacts, message)

    // Log each message
    contacts.forEach((jid: string, index: number) => {
      const status = index < result.success ? 'sent' : 'failed'
      db.addMessageLog(campaign.id, jid, message, status)
    })

    // Update campaign final status
    const finalStatus = result.failed === 0 ? 'completed' : 'completed'
    db.updateCampaignStatus(campaign.id, finalStatus, result.success)

    return NextResponse.json({
      success: true,
      result,
      campaignId: campaign.id,
      message: `Broadcast berhasil dikirim ke ${result.success} dari ${contacts.length} kontak`
    })

  } catch (error) {
    console.error('Error sending broadcast:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengirim broadcast'
    }, { status: 500 })
  }
}
