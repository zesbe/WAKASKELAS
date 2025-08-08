import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID campaign tidak valid'
      }, { status: 400 })
    }

    const success = db.deleteCampaign(id)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Campaign berhasil dihapus'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Campaign tidak ditemukan'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting campaign:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal menghapus campaign'
    }, { status: 500 })
  }
}
