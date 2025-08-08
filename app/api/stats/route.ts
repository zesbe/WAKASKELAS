import { NextResponse } from 'next/server'
import { initDb } from '../../../lib/database'

export async function GET() {
  try {
    const db = initDb()
    const stats = db.getStats()

    return NextResponse.json({
      success: true,
      stats: stats || {
        totalStudents: 0,
        paidStudents: 0,
        unpaidStudents: 0,
        paymentRate: 0,
        totalRevenue: 0,
        totalPayments: 0
      }
    })
  } catch (error) {
    console.error('Error getting stats:', error)
    // Return default stats instead of error
    return NextResponse.json({
      success: true,
      stats: {
        totalStudents: 0,
        paidStudents: 0,
        unpaidStudents: 0,
        paymentRate: 0,
        totalRevenue: 0,
        totalPayments: 0
      }
    })
  }
}
