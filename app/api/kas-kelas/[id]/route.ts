import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const { tanggal, jenis, keterangan, jumlah, kategori } = await request.json()

    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID tidak valid'
      }, { status: 400 })
    }

    const success = db.updateKasEntry(id, tanggal, jenis, keterangan, jumlah, kategori)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Data kas berhasil diupdate'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Data kas tidak ditemukan'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error updating kas entry:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengupdate data kas'
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

    const success = db.deleteKasEntry(id)
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Data kas berhasil dihapus'
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Data kas tidak ditemukan'
      }, { status: 404 })
    }
  } catch (error) {
    console.error('Error deleting kas entry:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal menghapus data kas'
    }, { status: 500 })
  }
}
