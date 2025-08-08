'use client'

import { useState, useEffect } from 'react'
import { Minus, Edit, Trash2, DollarSign, Calendar, Plus, Filter, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'

interface KasEntry {
  id: number
  tanggal: string
  jenis: 'masuk' | 'keluar'
  keterangan: string
  jumlah: number
  kategori?: string
  createdAt: string
}

export default function PengeluaranPage() {
  const [pengeluaran, setPengeluaran] = useState<KasEntry[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')

  const expenseCategories = [
    'Alat Tulis',
    'Kebersihan Kelas',
    'Dekorasi Kelas',
    'Kegiatan Belajar',
    'Konsumsi',
    'Fotocopy',
    'Hadiah/Reward',
    'Lain-lain'
  ]

  useEffect(() => {
    loadPengeluaran()
  }, [])

  const loadPengeluaran = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('/api/kas-kelas', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Filter only expenses
          const expenses = data.entries.filter((entry: KasEntry) => entry.jenis === 'keluar')
          setPengeluaran(expenses)
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, this is normal
        return
      }
      console.error('Error loading pengeluaran:', error.message)
      setPengeluaran([])
    }
  }

  const getFilteredPengeluaran = () => {
    let filtered = pengeluaran

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => 
        (entry.kategori || 'Pengeluaran Umum') === selectedCategory
      )
    }

    if (selectedMonth !== 'all') {
      filtered = filtered.filter(entry => {
        const entryMonth = new Date(entry.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
        return entryMonth === selectedMonth
      })
    }

    return filtered
  }

  const getTotalPengeluaran = () => {
    return getFilteredPengeluaran().reduce((total, entry) => total + entry.jumlah, 0)
  }

  const getMonthlyPengeluaran = () => {
    const monthlyMap = new Map<string, number>()
    
    pengeluaran.forEach(entry => {
      const month = new Date(entry.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + entry.jumlah)
    })

    return Array.from(monthlyMap.entries()).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
  }

  const getCategoryBreakdown = () => {
    const categoryMap = new Map<string, { total: number, count: number }>()
    
    getFilteredPengeluaran().forEach(entry => {
      const kategori = entry.kategori || 'Pengeluaran Umum'
      if (!categoryMap.has(kategori)) {
        categoryMap.set(kategori, { total: 0, count: 0 })
      }
      const catData = categoryMap.get(kategori)!
      catData.total += entry.jumlah
      catData.count += 1
    })

    const total = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0)
    
    return Array.from(categoryMap.entries())
      .map(([kategori, data]) => ({
        kategori,
        total: data.total,
        count: data.count,
        percentage: total > 0 ? (data.total / total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
  }

  const getAvailableMonths = () => {
    const months = new Set<string>()
    pengeluaran.forEach(entry => {
      const month = new Date(entry.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
      months.add(month)
    })
    return Array.from(months).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const filteredPengeluaran = getFilteredPengeluaran()
  const categoryBreakdown = getCategoryBreakdown()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[
              { label: 'Kelola Kas Kelas', href: '/kas-kelas' },
              { label: 'Pengeluaran' }
            ]} />
            <h1 className="text-xl sm:text-3xl font-bold gradient-text">Pengeluaran Kas Kelas 1 Ibnu Sina</h1>
            <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">Track & Monitor Expenses</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-error-400 to-error-600">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-error-600">{formatCurrency(getTotalPengeluaran())}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-warning-400 to-warning-600">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Transaksi</p>
                <p className="text-2xl font-bold text-secondary-900">{filteredPengeluaran.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-primary-400 to-primary-600">
                <Filter className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Kategori Aktif</p>
                <p className="text-2xl font-bold text-primary-600">{categoryBreakdown.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <Link href="/kas-kelas" className="btn-primary w-full text-lg">
              <Plus className="h-5 w-5 mr-2" />
              Tambah Pengeluaran
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-secondary-900 mb-4">Filter Pengeluaran</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="all">Semua Kategori</option>
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bulan
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="input-field"
              >
                <option value="all">Semua Bulan</option>
                {getAvailableMonths().map((month) => (
                  <option key={month} value={month}>{month}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-secondary-900 mb-6">Breakdown per Kategori</h3>
          
          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-secondary-900">{category.kategori}</span>
                  <span className="text-sm text-error-600">{formatCurrency(category.total)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-error-500 h-2 rounded-full" 
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-xs text-secondary-600 w-12">{category.percentage.toFixed(1)}%</span>
                </div>
                <div className="text-xs text-secondary-500">{category.count} transaksi</div>
              </div>
            ))}
            
            {categoryBreakdown.length === 0 && (
              <div className="text-center py-8 text-secondary-500">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada pengeluaran dengan filter yang dipilih</p>
              </div>
            )}
          </div>
        </div>

        {/* Expenses Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-secondary-900">Daftar Pengeluaran</h2>
            <div className="text-sm text-secondary-600">
              Menampilkan {filteredPengeluaran.length} dari {pengeluaran.length} pengeluaran
            </div>
          </div>

          {filteredPengeluaran.length === 0 ? (
            <div className="text-center py-12">
              <TrendingDown className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">
                {pengeluaran.length === 0 ? 'Belum ada pengeluaran' : 'Tidak ada pengeluaran sesuai filter'}
              </p>
              <Link href="/kas-kelas" className="btn-primary">
                Tambah Pengeluaran Pertama
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kategori
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Keterangan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPengeluaran.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.tanggal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          {entry.kategori || 'Pengeluaran Umum'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.keterangan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className="text-red-600">
                          -{formatCurrency(entry.jumlah)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link href="/kas-kelas" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-success-400 to-success-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Tambah Pengeluaran</h3>
              <p className="text-sm text-gray-600">Catat pengeluaran baru dengan kategori</p>
            </div>
          </Link>

          <Link href="/laporan-keuangan" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Laporan Keuangan</h3>
              <p className="text-sm text-gray-600">Lihat analisis lengkap keuangan kas</p>
            </div>
          </Link>

          <div className="card">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-error-400 to-error-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Rata-rata Bulanan</h3>
              <p className="text-lg font-bold text-error-600">
                {formatCurrency(getMonthlyPengeluaran().length > 0 
                  ? getMonthlyPengeluaran().reduce((sum, [_, amount]) => sum + amount, 0) / getMonthlyPengeluaran().length 
                  : 0
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
