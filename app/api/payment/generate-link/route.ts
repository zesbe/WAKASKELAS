import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../../lib/database'

const PAKASIR_CONFIG = {
  slug: process.env.PAKASIR_SLUG || 'uang-kas-kelas-1-ibnu-sina',
  apiKey: process.env.PAKASIR_API_KEY || '',
  redirectUrl: process.env.PAKASIR_REDIRECT_URL || 'https://kasibnusina.vercel.app/',
  baseUrl: process.env.PAKASIR_BASE_URL || 'https://pakasir.zone.id'
}

export async function POST(request: NextRequest) {
  try {
    const { studentId, customAmount } = await request.json()
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const db = initDb()
    
    // Get student data
    const student = db.getWaliMurid(studentId)
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Use custom amount or default tagihan
    const amount = customAmount || student.tagihan
    
    // Generate unique order ID using nama panggilan or fallback to student ID
    const timestamp = Date.now()
    const nameForOrderId = student.namaPanggilan
      ? student.namaPanggilan.replace(/\s+/g, '').toUpperCase()
      : `STUDENT_${studentId}`
    const orderId = `${nameForOrderId}_${timestamp}`
    
    // Generate payment URL
    const paymentUrl = `${PAKASIR_CONFIG.baseUrl}/pay/${PAKASIR_CONFIG.slug}/${amount}?order_id=${orderId}&qris_only=1&redirect=${encodeURIComponent(PAKASIR_CONFIG.redirectUrl)}`
    
    // Save payment request to database
    try {
      db.addPaymentRequest(studentId, orderId, amount, paymentUrl)
    } catch (dbError) {
      console.warn('Failed to save payment request to DB, but continuing:', dbError)
    }
    
    // Generate WhatsApp message with payment link
    const whatsappMessage = generatePaymentMessage(student, amount, paymentUrl, orderId)
    
    console.log(`💳 Payment link generated for ${student.namaAnak}: ${paymentUrl}`)
    
    return NextResponse.json({
      success: true,
      data: {
        studentId,
        studentName: student.namaAnak,
        parentName: student.namaWali,
        amount,
        orderId,
        paymentUrl,
        whatsappMessage,
        qrCodeUrl: `${paymentUrl}&format=qr`, // QR code for easy mobile scanning
        expiresIn: '24 hours'
      }
    })

  } catch (error) {
    console.error('❌ Payment link generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate payment link' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    
    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    const db = initDb()
    
    // Get recent payment requests for student
    const payments = db.getStudentPaymentRequests(parseInt(studentId))
    
    return NextResponse.json({
      success: true,
      data: {
        studentId,
        payments,
        total: payments.length
      }
    })

  } catch (error) {
    console.error('❌ Payment history error:', error)
    return NextResponse.json(
      { error: 'Failed to get payment history' }, 
      { status: 500 }
    )
  }
}

function generatePaymentMessage(student: any, amount: number, paymentUrl: string, orderId: string): string {
  return `🔔 *TAGIHAN KAS KELAS*

Yth. Bapak/Ibu ${student.namaWali}
Orang tua dari *${student.namaAnak}*

💰 *Detail Tagihan:*
- Bulan: ${student.bulanTagihan}
- Jumlah: Rp ${amount.toLocaleString('id-ID')}
- Order ID: ${orderId}

📱 *Cara Pembayaran:*
1. Klik link pembayaran di bawah
2. Scan QR Code QRIS
3. Bayar sesuai nominal
4. Status otomatis terupdate

🔗 *Link Pembayaran:*
${paymentUrl}

⏰ Link berlaku 24 jam
✅ Konfirmasi otomatis via WhatsApp

_Sistem Kas Digital Kelas 1 Ibnu Sina_`
}
