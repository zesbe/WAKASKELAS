import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { namaAnak, namaPanggilan, namaWali, noWhatsapp, tagihan, statusBayar, bulanTagihan } = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID tidak valid'
      }, { status: 400 })
    }

    const success = db.updateWaliMurid(id, namaAnak, namaWali, noWhatsapp, tagihan, statusBayar, bulanTagihan, namaPanggilan)

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Data wali murid berhasil diupdate'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Data wali murid tidak ditemukan'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error updating wali murid:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengupdate data wali murid'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID tidak valid'
      }, { status: 400 })
    }

    const success = db.deleteWaliMurid(id)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Data wali murid berhasil dihapus'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Data wali murid tidak ditemukan'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting wali murid:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal menghapus data wali murid'
    }, { status: 500 })
  }
}
