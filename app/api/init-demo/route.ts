import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Initialize demo data and users
    const results = {
      users: 0,
      students: 0,
      transactions: 0,
      errors: [] as string[]
    }

    // 1. Create demo users
    try {
      const bcrypt = require('bcryptjs')
      const { initDb } = require('../../../lib/database')
      const { ROLES } = require('../../../lib/auth')
      const db = initDb()

      const existingUsers = db.getAllUsers()
      
      if (existingUsers.length === 0) {
        const defaultPassword = 'password123'
        const passwordHash = await bcrypt.hash(defaultPassword, 12)

        const demoUsers = [
          {
            username: 'admin',
            email: 'admin@kasibnusina.com',
            name: 'Administrator',
            passwordHash,
            role: ROLES.ADMIN,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            username: 'bendahara',
            email: 'bendahara@kasibnusina.com',
            name: 'Bendahara Kelas',
            passwordHash,
            role: ROLES.BENDAHARA,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]

        for (const userData of demoUsers) {
          db.createUser(userData)
          results.users++
        }
      }
    } catch (error) {
      results.errors.push(`User creation error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // 2. Create demo students
    try {
      const { initDb } = require('../../../lib/database')
      const db = initDb()
      
      const existingStudents = db.getAllWaliMurid()
      
      if (existingStudents.length === 0) {
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
          },
          {
            namaAnak: 'Budi Santoso',
            namaPanggilan: 'Budi',
            namaWali: 'Bapak Santoso',
            noWhatsapp: '08123456791',
            tagihan: 50000,
            statusBayar: 'lunas' as const,
            bulanTagihan: 'Januari 2024',
            tanggalBayar: '2024-01-16'
          }
        ]

        for (const student of demoStudents) {
          db.addWaliMurid(student)
          results.students++
        }
      }
    } catch (error) {
      results.errors.push(`Student creation error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    // 3. Create demo transactions
    try {
      const { initDb } = require('../../../lib/database')
      const db = initDb()
      
      const existingTransactions = db.getAllKasEntries()
      
      if (existingTransactions.length === 0) {
        const demoTransactions = [
          {
            tanggal: '2024-01-15',
            jenis: 'masuk' as const,
            keterangan: 'Iuran bulanan Ahmad',
            jumlah: 50000,
            kategori: 'Iuran'
          },
          {
            tanggal: '2024-01-16',
            jenis: 'masuk' as const,
            keterangan: 'Iuran bulanan Budi',
            jumlah: 50000,
            kategori: 'Iuran'
          },
          {
            tanggal: '2024-01-20',
            jenis: 'keluar' as const,
            keterangan: 'Beli snack untuk acara',
            jumlah: 25000,
            kategori: 'Konsumsi'
          },
          {
            tanggal: '2024-01-25',
            jenis: 'keluar' as const,
            keterangan: 'Beli alat tulis',
            jumlah: 15000,
            kategori: 'Alat Tulis'
          }
        ]

        for (const transaction of demoTransactions) {
          db.addKasEntry(transaction)
          results.transactions++
        }
      }
    } catch (error) {
      results.errors.push(`Transaction creation error: ${error instanceof Error ? error.message : 'Unknown'}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Demo data initialized successfully',
      data: results,
      loginInfo: {
        admin: { username: 'admin', password: 'password123' },
        bendahara: { username: 'bendahara', password: 'password123' }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize demo data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
