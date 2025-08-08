import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { contacts } = await request.json()

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json({
        success: false,
        error: 'Format kontak tidak valid'
      }, { status: 400 })
    }

    let imported = 0

    for (const contact of contacts) {
      try {
        if (contact.name && contact.phone) {
          // Clean phone number and create WhatsApp JID
          const cleanPhone = contact.phone.replace(/\D/g, '')
          if (cleanPhone.length >= 10) {
            const jid = cleanPhone + '@s.whatsapp.net'
            db.addContact(jid, contact.name, contact.phone)
            imported++
          }
        }
      } catch (error) {
        console.error('Error importing contact:', contact, error)
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      total: contacts.length,
      message: `Berhasil import ${imported} dari ${contacts.length} kontak`
    })

  } catch (error) {
    console.error('Error importing contacts:', error)
    return NextResponse.json({
      success: false,
      error: 'Gagal import kontak'
    }, { status: 500 })
  }
}
