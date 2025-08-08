import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../lib/database'

export async function GET() {
  try {
    const db = initDb()
    const waliMurid = db.getAllWaliMurid()
    
    return NextResponse.json({
      success: true,
      waliMurid
    })
  } catch (error) {
    console.error('Error getting wali murid:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil data wali murid'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { namaAnak, namaPanggilan, namaWali, noWhatsapp, tagihan, statusBayar, bulanTagihan } = await request.json()

    if (!namaAnak || !namaWali || !noWhatsapp || !tagihan || !bulanTagihan) {
      return NextResponse.json({
        success: false,
        error: 'Semua field harus diisi'
      }, { status: 400 })
    }

    const db = initDb()
    const wali = db.addWaliMurid(namaAnak, namaWali, noWhatsapp, tagihan, statusBayar, bulanTagihan, namaPanggilan)

    return NextResponse.json({
      success: true,
      wali,
      message: 'Data wali murid berhasil ditambahkan'
    })
  } catch (error) {
    console.error('Error adding wali murid:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal menambahkan data wali murid'
    }, { status: 500 })
  }
}
