import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../lib/database'

export async function GET() {
  try {
    const db = initDb()
    if (!db) {
      throw new Error('Database not initialized')
    }

    const entries = db.getAllKasEntries()

    return NextResponse.json({
      success: true,
      entries: entries || []
    })
  } catch (error) {
    console.error('Error getting kas entries:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil data kas',
      entries: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = initDb()
    if (!db) {
      throw new Error('Database not initialized')
    }

    const body = await request.json()
    const { tanggal, jenis, keterangan, jumlah, kategori } = body

    if (!tanggal || !jenis || !keterangan || !jumlah) {
      return NextResponse.json({
        success: false,
        error: 'Semua field harus diisi'
      }, { status: 400 })
    }

    if (!['masuk', 'keluar'].includes(jenis)) {
      return NextResponse.json({
        success: false,
        error: 'Jenis transaksi tidak valid'
      }, { status: 400 })
    }

    const entry = db.addKasEntry(tanggal, jenis, keterangan, parseInt(jumlah), kategori)

    return NextResponse.json({
      success: true,
      entry,
      message: 'Data kas berhasil ditambahkan'
    })
  } catch (error) {
    console.error('Error adding kas entry:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menambahkan data kas'
    }, { status: 500 })
  }
}
