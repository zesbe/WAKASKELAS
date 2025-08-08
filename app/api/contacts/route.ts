import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'
import { whatsappService } from '@/lib/whatsapp'

export async function GET() {
  try {
    const contacts = db.getAllContacts()
    
    return NextResponse.json({
      success: true,
      contacts
    })
  } catch (error) {
    console.error('Error getting contacts:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal mengambil daftar kontak'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, phone, jid } = await request.json()

    if (!name || (!phone && !jid)) {
      return NextResponse.json({
        success: false,
        error: 'Nama dan nomor telepon harus diisi'
      }, { status: 400 })
    }

    // Format phone number to WhatsApp JID
    const whatsappJid = jid || (phone.replace(/\D/g, '') + '@s.whatsapp.net')
    
    const contact = db.addContact(whatsappJid, name, phone)
    
    return NextResponse.json({
      success: true,
      contact,
      message: 'Kontak berhasil ditambahkan'
    })
  } catch (error) {
    console.error('Error adding contact:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal menambahkan kontak'
    }, { status: 500 })
  }
}
