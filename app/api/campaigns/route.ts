import { NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function GET() {
  try {
    const campaigns = db.getAllCampaigns()
    
    return NextResponse.json({
      success: true,
      campaigns
    })
  } catch (error) {
    console.error('Error getting campaigns:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil daftar campaign'
    }, { status: 500 })
  }
}
