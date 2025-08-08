import { NextRequest, NextResponse } from 'next/server'
import { secureWhatsAppService } from '../../../../lib/whatsapp-secure'

// Input validation and sanitization
function validateAndSanitizeInput(jid: string, message: string) {
  // Validate JID format
  if (!jid || typeof jid !== 'string') {
    throw new Error('JID tidak valid')
  }
  
  // Basic JID format validation
  if (!jid.includes('@') || (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@g.us'))) {
    throw new Error('Format JID WhatsApp tidak valid')
  }
  
  // Validate message
  if (!message || typeof message !== 'string') {
    throw new Error('Pesan tidak valid')
  }
  
  // Message length validation
  if (message.length > 4000) {
    throw new Error('Pesan terlalu panjang (maksimal 4000 karakter)')
  }
  
  // Sanitize message - remove potential harmful content
  const sanitizedMessage = message
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
    .trim()
  
  if (sanitizedMessage.length === 0) {
    throw new Error('Pesan kosong setelah sanitisasi')
  }
  
  // Check for spam patterns
  const spamPatterns = [
    /(.)\1{10,}/, // Repeated characters
    /https?:\/\/[^\s]{50,}/, // Very long URLs
    /[!@#$%^&*()]{5,}/, // Excessive special characters
  ]
  
  for (const pattern of spamPatterns) {
    if (pattern.test(sanitizedMessage)) {
      throw new Error('Pesan mengandung pola spam yang terdeteksi')
    }
  }
  
  return { jid: jid.trim(), message: sanitizedMessage }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { jid, message } = body
    
    // Validate and sanitize input
    const { jid: validJid, message: validMessage } = validateAndSanitizeInput(jid, message)
    
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
        error: 'Pengiriman pesan diblokir karena aktivitas mencurigakan',
        securityBlocked: true,
        cooldownTime: 300000 // 5 minutes
      }, { status: 429 })
    }
    
    // Log secure message attempt
    console.log(`🔒 Secure message send attempt to: ${validJid.substring(0, 10)}...`)
    
    const success = await secureWhatsAppService.sendSecureMessage(validJid, validMessage)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Pesan berhasil dikirim dengan aman',
        timestamp: new Date().toISOString(),
        securityVerified: true
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Gagal mengirim pesan melalui sistem aman'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Error in secure send message:', error)
    
    // Determine error type
    let statusCode = 500
    let errorMessage = 'Terjadi kesalahan dalam pengiriman pesan aman'
    
    if (error instanceof Error) {
      if (error.message.includes('Rate limit') || error.message.includes('terlampaui')) {
        statusCode = 429
        errorMessage = error.message
      } else if (error.message.includes('tidak valid') || error.message.includes('spam')) {
        statusCode = 400
        errorMessage = error.message
      } else if (error.message.includes('tidak terhubung')) {
        statusCode = 503
        errorMessage = error.message
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      securityProtected: true
    }, { status: statusCode })
  }
}
