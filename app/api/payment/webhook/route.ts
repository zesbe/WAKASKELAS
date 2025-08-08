import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../../lib/database'

// Pakasir webhook payload interface
interface PakasirWebhook {
  amount: number
  order_id: string
  project: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  payment_method: string
  completed_at?: string
  created_at?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PakasirWebhook = await request.json()
    
    // Validate webhook from Pakasir
    const expectedProject = process.env.PAKASIR_SLUG || 'uang-kas-kelas-1-ibnu-sina'
    if (body.project !== expectedProject) {
      return NextResponse.json({ error: 'Invalid project' }, { status: 400 })
    }

    console.log('📨 Pakasir Webhook Received:', body)

    const db = initDb()
    
    // Extract student ID from order_id (format: STUDENT_{id}_{timestamp})
    const orderIdParts = body.order_id.split('_')
    if (orderIdParts.length < 2 || orderIdParts[0] !== 'STUDENT') {
      return NextResponse.json({ error: 'Invalid order_id format' }, { status: 400 })
    }
    
    const studentId = parseInt(orderIdParts[1])
    
    // Get student data
    const student = db.getWaliMurid(studentId)
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Process payment based on status
    if (body.status === 'completed') {
      // Update payment status to completed
      db.updateWaliMuridStatus(studentId, 'lunas')

      // 💰 OTOMATIS TAMBAH KE KAS KELAS
      // Tambahkan entry pemasukan ke kas kelas
      const paymentDate = body.completed_at ? new Date(body.completed_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      const kasEntry = db.addKasEntry(
        paymentDate,
        'masuk',
        `Pembayaran kas dari ${student.namaAnak} (${student.namaWali}) - ${body.payment_method.toUpperCase()}`,
        body.amount,
        'Iuran Siswa'
      )

      console.log(`💰 Kas entry created automatically: ID ${kasEntry.id} - ${body.amount}`)

      // Log payment transaction
      try {
        db.addPaymentLog(
          studentId,
          body.order_id,
          body.amount,
          body.status,
          body.payment_method,
          body.completed_at,
          JSON.stringify(body)
        )
      } catch (logError) {
        console.warn('Failed to log payment, but continuing:', logError)
      }

      // Send confirmation WhatsApp message
      try {
        await sendPaymentConfirmation(student, body)
      } catch (error) {
        console.error('❌ Failed to send WhatsApp confirmation:', error)
      }

      console.log(`✅ Payment completed for ${student.namaAnak} - ${body.amount}`)
      
    } else if (body.status === 'failed' || body.status === 'expired') {
      // Log failed payment
      try {
        db.addPaymentLog(
          studentId,
          body.order_id,
          body.amount,
          body.status,
          body.payment_method || 'unknown',
          undefined,
          JSON.stringify(body)
        )
      } catch (logError) {
        console.warn('Failed to log failed payment:', logError)
      }

      console.log(`❌ Payment ${body.status} for ${student.namaAnak} - ${body.order_id}`)
    }

    return NextResponse.json({ 
      success: true, 
      message: `Payment ${body.status} processed successfully`,
      student: student.namaAnak,
      amount: body.amount
    })

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process webhook' }, 
      { status: 500 }
    )
  }
}

async function sendPaymentConfirmation(student: any, payment: PakasirWebhook) {
  const message = `🎉 *PEMBAYARAN BERHASIL!*

✅ Pembayaran kas kelas untuk *${student.namaAnak}* telah berhasil dikonfirmasi.

💰 *Detail Pembayaran:*
- Jumlah: Rp ${payment.amount.toLocaleString('id-ID')}
- Metode: ${payment.payment_method.toUpperCase()}
- Order ID: ${payment.order_id}
- Waktu: ${new Date(payment.completed_at || '').toLocaleString('id-ID')}

Terima kasih atas pembayaran yang tepat waktu! 🙏

_Sistem Kas Digital Kelas 1 Ibnu Sina_`

  const response = await fetch('/api/whatsapp/send-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: student.noWhatsapp,
      message: message
    })
  })

  if (!response.ok) {
    throw new Error('Failed to send WhatsApp confirmation')
  }
}

// GET method to check webhook status
export async function GET() {
  return NextResponse.json({ 
    message: 'Pakasir Webhook Endpoint Active',
    project: 'uang-kas-kelas-1-ibnu-sina',
    timestamp: new Date().toISOString()
  })
}
