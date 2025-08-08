'use client'

import { useState, useEffect } from 'react'
import { Plus, Minus, Eye, Edit, Trash2, DollarSign, Calendar, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'

interface KasEntry {
  id: number
  tanggal: string
  jenis: 'masuk' | 'keluar'
  keterangan: string
  jumlah: number
  kategori?: string
  saldo: number
  createdAt: string
}

export default function KasKelasPage() {
  const [kasEntries, setKasEntries] = useState<KasEntry[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KasEntry | null>(null)
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jenis: 'masuk' as 'masuk' | 'keluar',
    keterangan: '',
    jumlah: '',
    kategori: ''
  })

  // Predefined categories for income and expenses
  const incomeCategories = [
    'Iuran Bulanan',
    'Iuran Khusus',
    'Donasi',
    'Hasil Kegiatan',
    'Lain-lain'
  ]

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
    loadKasEntries()
  }, [])

  const loadKasEntries = async () => {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        setKasEntries(data.entries || [])
      } else {
        console.error('API returned error:', data.error)
        setKasEntries([])
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request timed out')
      } else {
        console.error('Error loading kas entries:', error.message)
      }
      setKasEntries([])
    }
  }

  const getTotalSaldo = () => {
    return kasEntries.reduce((total, entry) => {
      return entry.jenis === 'masuk' ? total + entry.jumlah : total - entry.jumlah
    }, 0)
  }

  const getTotalMasuk = () => {
    return kasEntries.filter(entry => entry.jenis === 'masuk').reduce((total, entry) => total + entry.jumlah, 0)
  }

  const getTotalKeluar = () => {
    return kasEntries.filter(entry => entry.jenis === 'keluar').reduce((total, entry) => total + entry.jumlah, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingEntry ? `/api/kas-kelas/${editingEntry.id}` : '/api/kas-kelas'
      const method = editingEntry ? 'PUT' : 'POST'

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          jumlah: parseInt(formData.jumlah)
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        await loadKasEntries()
        setIsModalOpen(false)
        setEditingEntry(null)
        setFormData({
          tanggal: new Date().toISOString().split('T')[0],
          jenis: 'masuk',
          keterangan: '',
          jumlah: '',
          kategori: ''
        })
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error saving kas entry:', error)
      alert('Terjadi kesalahan saat menyimpan data')
    }
  }

  const handleEdit = (entry: KasEntry) => {
    setEditingEntry(entry)
    setFormData({
      tanggal: entry.tanggal,
      jenis: entry.jenis,
      keterangan: entry.keterangan,
      jumlah: entry.jumlah.toString(),
      kategori: entry.kategori || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data kas ini?')) return

    try {
      const response = await fetch(`/api/kas-kelas/${id}`, { method: 'DELETE' })
      if (response.ok) {
        loadKasEntries()
      }
    } catch (error) {
      console.error('Error deleting kas entry:', error)
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Kelola Kas Kelas' }]} />
            <h1 className="text-xl sm:text-3xl font-bold gradient-text">Kelola Kas Kelas 1 Ibnu Sina</h1>
            <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">Manage Income & Expenses</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-success-400 to-success-600">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Saldo Kas</p>
                <p className="text-2xl font-bold gradient-text">{formatCurrency(getTotalSaldo())}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-primary-400 to-primary-600">
                <Plus className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Total Masuk</p>
                <p className="text-2xl font-bold text-primary-600">{formatCurrency(getTotalMasuk())}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-error-400 to-error-600">
                <Minus className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Total Keluar</p>
                <p className="text-2xl font-bold text-error-600">{formatCurrency(getTotalKeluar())}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary w-full text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Transaksi
            </button>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Link href="/pengeluaran" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-error-400 to-error-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <Minus className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Detail Pengeluaran</h3>
              <p className="text-sm text-gray-600">Monitoring pengeluaran per kategori dan analisis</p>
            </div>
          </Link>

          <Link href="/laporan-keuangan" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-indigo-400 to-indigo-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Laporan Keuangan</h3>
              <p className="text-sm text-gray-600">Lihat analisis lengkap dan tren keuangan kas kelas</p>
            </div>
          </Link>

          <Link href="/wali-murid" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-primary-400 to-primary-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Data Wali Murid</h3>
              <p className="text-sm text-gray-600">Kelola tagihan dan status pembayaran wali murid</p>
            </div>
          </Link>

          <div className="card">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-success-400 to-success-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Saldo Terkini</h3>
              <p className="text-xl font-bold text-success-600">{formatCurrency(getTotalSaldo())}</p>
            </div>
          </div>
        </div>

        {/* Kas Entries Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold gradient-text">Riwayat Transaksi Kas</h2>
              <p className="text-secondary-600 mt-1">History lengkap pemasukan dan pengeluaran kas kelas</p>
            </div>
          </div>

          {kasEntries.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada transaksi kas</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary mt-4"
              >
                Tambah Transaksi Pertama
              </button>
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
                      Jenis
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {kasEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(entry.tanggal)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          entry.jenis === 'masuk'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {entry.kategori || (entry.jenis === 'masuk' ? 'Iuran Umum' : 'Pengeluaran Umum')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {entry.keterangan}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={entry.jenis === 'masuk' ? 'text-green-600' : 'text-red-600'}>
                          {entry.jenis === 'masuk' ? '+' : '-'}{formatCurrency(entry.jumlah)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="p-6 max-h-full overflow-y-auto">
                <div className="text-center mb-6">
                  <div className="bg-gradient-to-br from-primary-500 to-accent-500 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4">
                    <DollarSign className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold gradient-text">
                    {editingEntry ? 'Edit Transaksi' : 'Tambah Transaksi Kas'}
                  </h3>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={formData.tanggal}
                      onChange={(e) => setFormData({...formData, tanggal: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jenis Transaksi
                    </label>
                    <select
                      value={formData.jenis}
                      onChange={(e) => setFormData({...formData, jenis: e.target.value as 'masuk' | 'keluar', kategori: ''})}
                      className="input-field"
                    >
                      <option value="masuk">Pemasukan</option>
                      <option value="keluar">Pengeluaran</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={formData.kategori}
                      onChange={(e) => setFormData({...formData, kategori: e.target.value})}
                      className="input-field"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {(formData.jenis === 'masuk' ? incomeCategories : expenseCategories).map((category) => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Keterangan
                    </label>
                    <input
                      type="text"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
                      placeholder="Contoh: Iuran bulanan, Pembelian alat tulis"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.jumlah}
                      onChange={(e) => setFormData({...formData, jumlah: e.target.value})}
                      placeholder="50000"
                      className="input-field"
                      required
                      min="0"
                    />
                  </div>

                  <div className="flex space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false)
                        setEditingEntry(null)
                        setFormData({
                          tanggal: new Date().toISOString().split('T')[0],
                          jenis: 'masuk',
                          keterangan: '',
                          jumlah: '',
                          kategori: ''
                        })
                      }}
                      className="btn-secondary flex-1"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                      style={{
                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        color: 'white',
                        fontWeight: '600',
                        padding: '12px 24px',
                        borderRadius: '16px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '44px'
                      }}
                    >
                      {editingEntry ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
