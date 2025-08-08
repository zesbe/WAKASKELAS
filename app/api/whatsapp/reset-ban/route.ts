import { NextResponse } from 'next/server'
import { rateLimiter } from '@/lib/rateLimiter'

export async function POST() {
  try {
    // Reset rate limiter
    rateLimiter.reset()
    
    // Clear auth files if they exist
    const fs = require('fs')
    const authDir = './auth_info_baileys'
    
    if (fs.existsSync(authDir)) {
      fs.rmSync(authDir, { recursive: true, force: true })
      console.log('Cleared auth state for reset')
    }

    return NextResponse.json({
      success: true,
      message: 'Rate limiter dan auth state telah direset. Silakan coba lagi dalam beberapa menit.'
    })
  } catch (error) {
    console.error('Error resetting ban status:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal reset ban status'
    }, { status: 500 })
  }
}
