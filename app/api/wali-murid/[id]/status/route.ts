import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { status } = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID tidak valid'
      }, { status: 400 })
    }

    if (!status || !['belum', 'lunas'].includes(status)) {
      return NextResponse.json({
        success: false,
        error: 'Status harus belum atau lunas'
      }, { status: 400 })
    }

    const success = db.updateWaliMuridStatus(id, status)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: `Status pembayaran berhasil diubah menjadi ${status}`
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Data wali murid tidak ditemukan'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error updating status:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengupdate status pembayaran'
    }, { status: 500 })
  }
}
