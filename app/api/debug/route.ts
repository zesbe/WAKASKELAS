import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test basic functionality
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      databasePath: process.env.DATABASE_PATH || './data.db',
      tests: {} as any
    }

    // Test 1: Database connection
    try {
      const { initDb } = require('../../../lib/database')
      const db = initDb()
      const stats = db.getStats()
      testResults.tests.database = { 
        status: 'success', 
        stats: stats ? 'Data available' : 'No data',
        statsData: stats
      }
    } catch (error) {
      testResults.tests.database = { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 2: Auth system
    try {
      const { ROLES } = require('../../../lib/auth')
      testResults.tests.auth = { 
        status: 'success', 
        rolesAvailable: Object.keys(ROLES).length 
      }
    } catch (error) {
      testResults.tests.auth = { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 3: Environment variables
    testResults.tests.environment = {
      status: 'success',
      hasEnvFile: !!process.env.PAKASIR_API_KEY,
      envVars: {
        PAKASIR_SLUG: process.env.PAKASIR_SLUG ? 'Set' : 'Not set',
        PAKASIR_API_KEY: process.env.PAKASIR_API_KEY ? 'Set' : 'Not set',
        PAKASIR_BASE_URL: process.env.PAKASIR_BASE_URL ? 'Set' : 'Not set'
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Debug information',
      data: testResults
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Initialize demo data
    const { initDb } = require('../../../lib/database')
    const db = initDb()

    // Add some test data if none exists
    const waliMurid = db.getAllWaliMurid()
    const kasEntries = db.getAllKasEntries()

    let addedData = {
      waliMurid: 0,
      kasEntries: 0
    }

    if (waliMurid.length === 0) {
      // Add demo students
      const demoStudents = [
        {
          namaAnak: 'Ahmad Fauzi',
          namaPanggilan: 'Ahmad',
          namaWali: 'Bapak Fauzi',
          noWhatsapp: '08123456789',
          tagihan: 50000,
          statusBayar: 'lunas' as const,
          bulanTagihan: 'Januari 2024',
          tanggalBayar: '2024-01-15'
        },
        {
          namaAnak: 'Siti Aminah',
          namaPanggilan: 'Siti',
          namaWali: 'Ibu Aminah',
          noWhatsapp: '08123456790',
          tagihan: 50000,
          statusBayar: 'belum' as const,
          bulanTagihan: 'Januari 2024'
        }
      ]

      for (const student of demoStudents) {
        db.addWaliMurid(student)
        addedData.waliMurid++
      }
    }

    if (kasEntries.length === 0) {
      // Add demo transactions
      const demoTransactions = [
        {
          tanggal: '2024-01-15',
          jenis: 'masuk' as const,
          keterangan: 'Iuran bulanan Ahmad',
          jumlah: 50000,
          kategori: 'Iuran'
        },
        {
          tanggal: '2024-01-20',
          jenis: 'keluar' as const,
          keterangan: 'Beli snack untuk acara',
          jumlah: 25000,
          kategori: 'Konsumsi'
        }
      ]

      for (const transaction of demoTransactions) {
        db.addKasEntry(transaction)
        addedData.kasEntries++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data initialized',
      data: addedData
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
