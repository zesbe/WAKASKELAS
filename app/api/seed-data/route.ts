import { NextResponse } from 'next/server'
import { db } from '../../../lib/database'

export async function POST() {
  try {
    // Sample income data
    const incomeData = [
      {
        tanggal: '2024-01-15',
        jenis: 'masuk' as const,
        keterangan: 'Iuran bulanan Januari 2024',
        jumlah: 500000,
        kategori: 'Iuran Bulanan'
      },
      {
        tanggal: '2024-01-20',
        jenis: 'masuk' as const,
        keterangan: 'Donasi dari orang tua Ahmad',
        jumlah: 100000,
        kategori: 'Donasi'
      },
      {
        tanggal: '2024-02-15',
        jenis: 'masuk' as const,
        keterangan: 'Iuran bulanan Februari 2024',
        jumlah: 520000,
        kategori: 'Iuran Bulanan'
      }
    ]

    // Sample expense data
    const expenseData = [
      {
        tanggal: '2024-01-18',
        jenis: 'keluar' as const,
        keterangan: 'Pembelian alat tulis: pensil, penggaris, spidol',
        jumlah: 150000,
        kategori: 'Alat Tulis'
      },
      {
        tanggal: '2024-01-22',
        jenis: 'keluar' as const,
        keterangan: 'Pembersihan kelas dan pembelian sabun',
        jumlah: 75000,
        kategori: 'Kebersihan Kelas'
      },
      {
        tanggal: '2024-01-25',
        jenis: 'keluar' as const,
        keterangan: 'Konsumsi untuk acara pembelajaran outdoor',
        jumlah: 200000,
        kategori: 'Konsumsi'
      },
      {
        tanggal: '2024-02-02',
        jenis: 'keluar' as const,
        keterangan: 'Fotocopy materi pembelajaran semester 2',
        jumlah: 80000,
        kategori: 'Fotocopy'
      },
      {
        tanggal: '2024-02-10',
        jenis: 'keluar' as const,
        keterangan: 'Dekorasi kelas untuk bulan bahasa',
        jumlah: 120000,
        kategori: 'Dekorasi Kelas'
      },
      {
        tanggal: '2024-02-18',
        jenis: 'keluar' as const,
        keterangan: 'Hadiah untuk siswa berprestasi',
        jumlah: 250000,
        kategori: 'Hadiah/Reward'
      }
    ]

    // Add all sample data
    const allSampleData = [...incomeData, ...expenseData]
    
    for (const entry of allSampleData) {
      db.addKasEntry(entry.tanggal, entry.jenis, entry.keterangan, entry.jumlah, entry.kategori)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${allSampleData.length} sample transactions`,
      data: {
        income: incomeData.length,
        expenses: expenseData.length,
        total: allSampleData.length
      }
    })

  } catch (error) {
    console.error('Error seeding data:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to seed sample data'
      },
      { status: 500 }
    )
  }
}
