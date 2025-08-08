import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '../../../../lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    const db = initDb()
    
    let logs
    
    if (studentId) {
      // Get logs for specific student
      logs = db.getStudentPaymentLogs(parseInt(studentId))
    } else {
      // Get all payment logs with student info
      logs = db.getAllPaymentLogs()
    }
    
    // Limit results
    const limitedLogs = logs.slice(0, limit)
    
    return NextResponse.json({
      success: true,
      data: {
        logs: limitedLogs,
        total: logs.length,
        limit,
        studentId: studentId ? parseInt(studentId) : null
      }
    })

  } catch (error) {
    console.error('❌ Payment logs error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to get payment logs' 
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { student_id, order_id, amount, status, payment_method, completed_at, webhook_data } = await request.json()
    
    if (!student_id || !order_id || !amount || !status) {
      return NextResponse.json(
        { error: 'student_id, order_id, amount, and status are required' },
        { status: 400 }
      )
    }

    const db = initDb()
    
    const log = db.addPaymentLog(
      student_id,
      order_id, 
      amount,
      status,
      payment_method,
      completed_at,
      webhook_data ? JSON.stringify(webhook_data) : undefined
    )
    
    return NextResponse.json({
      success: true,
      data: {
        log,
        message: 'Payment log created successfully'
      }
    })

  } catch (error) {
    console.error('❌ Create payment log error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create payment log' 
      },
      { status: 500 }
    )
  }
}
