import { NextResponse } from 'next/server'
import { initDb } from '../../../lib/database'

export async function GET(request: Request) {
  try {
    const db = initDb()

    // Get all kas entries with optional category
    const entries = db.getAllKasEntries()

    // Calculate summary statistics
    const totalIncome = entries
      .filter(entry => entry.jenis === 'masuk')
      .reduce((sum, entry) => sum + entry.jumlah, 0)

    const totalExpense = entries
      .filter(entry => entry.jenis === 'keluar')
      .reduce((sum, entry) => sum + entry.jumlah, 0)

    const currentBalance = totalIncome - totalExpense

    // Get monthly statistics (simplified calculation)
    const monthlyStats = entries.reduce((acc: any[], entry) => {
      const monthKey = new Date(entry.tanggal).toISOString().substring(0, 7) // YYYY-MM
      let monthData = acc.find(m => m.month === monthKey)

      if (!monthData) {
        monthData = { month: monthKey, income: 0, expense: 0, transaction_count: 0 }
        acc.push(monthData)
      }

      if (entry.jenis === 'masuk') {
        monthData.income += entry.jumlah
      } else {
        monthData.expense += entry.jumlah
      }
      monthData.transaction_count += 1

      return acc
    }, []).sort((a, b) => a.month.localeCompare(b.month))

    // Get category breakdown
    const categoryStats = entries.reduce((acc: any[], entry) => {
      const kategori = entry.kategori || (entry.jenis === 'masuk' ? 'Iuran Umum' : 'Pengeluaran Umum')
      const key = `${entry.jenis}-${kategori}`

      let catData = acc.find(c => c.jenis === entry.jenis && c.kategori === kategori)
      if (!catData) {
        catData = { jenis: entry.jenis, kategori, total: 0, count: 0 }
        acc.push(catData)
      }

      catData.total += entry.jumlah
      catData.count += 1

      return acc
    }, []).sort((a, b) => b.total - a.total)

    // Recent transactions (last 10)
    const recentTransactions = entries.slice(0, 10)

    return NextResponse.json({
      success: true,
      data: {
        entries,
        summary: {
          totalIncome,
          totalExpense,
          currentBalance,
          transactionCount: entries.length
        },
        monthlyStats,
        categoryStats,
        recentTransactions
      }
    })

  } catch (error) {
    console.error('Error fetching financial report:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch financial report',
        data: {
          entries: [],
          summary: {
            totalIncome: 0,
            totalExpense: 0,
            currentBalance: 0,
            transactionCount: 0
          },
          monthlyStats: [],
          categoryStats: [],
          recentTransactions: []
        }
      },
      { status: 500 }
    )
  }
}
