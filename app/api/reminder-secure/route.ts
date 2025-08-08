import { NextRequest, NextResponse } from 'next/server'
import { secureWhatsAppService } from '../../../lib/whatsapp-secure'

interface SecureMessage {
  jid: string
  message: string
  wali: {
    id: number
    namaAnak: string
    namaWali: string
    tagihan: number
  }
}

// Security validation for broadcast messages
function validateBroadcastRequest(messages: SecureMessage[]) {
  if (!Array.isArray(messages)) {
    throw new Error('Format pesan broadcast tidak valid')
  }
  
  if (messages.length === 0) {
    throw new Error('Tidak ada pesan untuk dikirim')
  }
  
  if (messages.length > 50) {
    throw new Error('Maksimal 50 pesan per broadcast untuk keamanan')
  }
  
  // Validate each message
  messages.forEach((msg, index) => {
    if (!msg.jid || !msg.message || !msg.wali) {
      throw new Error(`Pesan ke-${index + 1} tidak lengkap`)
    }
    
    if (!msg.jid.includes('@s.whatsapp.net')) {
      throw new Error(`JID ke-${index + 1} tidak valid`)
    }
    
    if (msg.message.length > 4000) {
      throw new Error(`Pesan ke-${index + 1} terlalu panjang`)
    }
    
    // Validate required fields
    if (!msg.wali.namaAnak || !msg.wali.namaWali || !msg.wali.tagihan) {
      throw new Error(`Data wali ke-${index + 1} tidak lengkap`)
    }
  })
  
  return true
}

// Check for duplicate messages within short time frame
const recentBroadcasts = new Map<string, number>()
const BROADCAST_COOLDOWN = 300000 // 5 minutes

function checkBroadcastCooldown(messages: SecureMessage[]) {
  const now = Date.now()
  const broadcastHash = messages.map(m => m.jid).sort().join(',')
  
  const lastBroadcast = recentBroadcasts.get(broadcastHash)
  if (lastBroadcast && (now - lastBroadcast) < BROADCAST_COOLDOWN) {
    const remainingCooldown = BROADCAST_COOLDOWN - (now - lastBroadcast)
    throw new Error(`Broadcast yang sama sudah dikirim. Tunggu ${Math.ceil(remainingCooldown / 60000)} menit.`)
  }
  
  recentBroadcasts.set(broadcastHash, now)
  
  // Clean old entries
  for (const [hash, timestamp] of recentBroadcasts.entries()) {
    if (now - timestamp > BROADCAST_COOLDOWN) {
      recentBroadcasts.delete(hash)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body
    
    // Validate request
    validateBroadcastRequest(messages)
    
    // Check broadcast cooldown
    checkBroadcastCooldown(messages)
    
    // Check if service is ready
    if (!secureWhatsAppService.isReady()) {
      return NextResponse.json({
        success: false,
        error: 'WhatsApp belum terhubung atau dalam mode keamanan',
        requiresConnection: true
      }, { status: 503 })
    }
    
    // Check security metrics
    const securityMetrics = secureWhatsAppService.getSecurityMetrics()
    if (securityMetrics.suspiciousActivity) {
      return NextResponse.json({
        success: false,
        error: 'Broadcast diblokir karena aktivitas mencurigakan',
        securityBlocked: true,
        cooldownTime: 300000
      }, { status: 429 })
    }
    
    console.log(`🔒 Starting secure broadcast to ${messages.length} recipients`)
    
    // Extract JIDs and message content
    const jids = messages.map((msg: SecureMessage) => msg.jid)
    const sampleMessage = messages[0].message
    
    // Use secure broadcast method
    const result = await secureWhatsAppService.secureBroadcast(jids, sampleMessage)
    
    // Enhanced result tracking
    const enhancedResult = {
      success: result.success,
      failed: result.failed,
      total: messages.length,
      successRate: messages.length > 0 ? (result.success / messages.length * 100).toFixed(1) : '0',
      timestamp: new Date().toISOString(),
      securityProtected: true,
      batchProcessed: true
    }
    
    if (result.success > 0) {
      return NextResponse.json({
        success: true,
        message: `Broadcast aman berhasil dikirim ke ${result.success} dari ${messages.length} penerima`,
        result: enhancedResult
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Gagal mengirim broadcast aman',
        result: enhancedResult
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error in secure broadcast:', error)
    
    let statusCode = 500
    let errorMessage = 'Terjadi kesalahan dalam broadcast aman'
    
    if (error instanceof Error) {
      if (error.message.includes('tidak valid') || error.message.includes('tidak lengkap')) {
        statusCode = 400
      } else if (error.message.includes('Tunggu') || error.message.includes('sudah dikirim')) {
        statusCode = 429
      } else if (error.message.includes('belum terhubung')) {
        statusCode = 503
      }
      errorMessage = error.message
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      securityProtected: true
    }, { status: statusCode })
  }
}
