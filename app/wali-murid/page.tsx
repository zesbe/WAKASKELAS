'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, Phone, CheckCircle, XCircle, Clock, Download } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'

interface WaliMurid {
  id: number
  namaAnak: string
  namaPanggilan?: string
  namaWali: string
  noWhatsapp: string
  tagihan: number
  statusBayar: 'belum' | 'lunas'
  tanggalBayar?: string
  bulanTagihan: string
  createdAt: string
}

export default function WaliMuridPage() {
  const [waliMurid, setWaliMurid] = useState<WaliMurid[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWali, setEditingWali] = useState<WaliMurid | null>(null)
  const [formData, setFormData] = useState({
    namaAnak: '',
    namaPanggilan: '',
    namaWali: '',
    noWhatsapp: '',
    tagihan: '',
    statusBayar: 'belum' as 'belum' | 'lunas',
    bulanTagihan: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
  })

  useEffect(() => {
    loadWaliMurid()
  }, [])

  const loadWaliMurid = async () => {
    try {
      const response = await fetch('/api/wali-murid')
      const data = await response.json()
      if (data.success) {
        setWaliMurid(data.waliMurid)
      }
    } catch (error) {
      console.error('Error loading wali murid:', error)
    }
  }

  const getTotalTagihan = () => {
    return waliMurid.reduce((total, wali) => total + wali.tagihan, 0)
  }

  const getTotalLunas = () => {
    return waliMurid.filter(wali => wali.statusBayar === 'lunas').reduce((total, wali) => total + wali.tagihan, 0)
  }

  const getTotalBelumBayar = () => {
    return waliMurid.filter(wali => wali.statusBayar === 'belum').reduce((total, wali) => total + wali.tagihan, 0)
  }

  const getJumlahBelumBayar = () => {
    return waliMurid.filter(wali => wali.statusBayar === 'belum').length
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingWali ? `/api/wali-murid/${editingWali.id}` : '/api/wali-murid'
      const method = editingWali ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          tagihan: parseInt(formData.tagihan),
          statusBayar: editingWali ? formData.statusBayar : 'belum', // Auto set to 'belum' for new entries
          noWhatsapp: formData.noWhatsapp.startsWith('0')
            ? '62' + formData.noWhatsapp.substring(1)
            : formData.noWhatsapp
        })
      })

      const data = await response.json()
      if (data.success) {
        loadWaliMurid()
        setIsModalOpen(false)
        setEditingWali(null)
        setFormData({
          namaAnak: '',
          namaPanggilan: '',
          namaWali: '',
          noWhatsapp: '',
          tagihan: '',
          statusBayar: 'belum',
          bulanTagihan: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
        })
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      console.error('Error saving wali murid:', error)
      alert('Terjadi kesalahan saat menyimpan data')
    }
  }

  const handleEdit = (wali: WaliMurid) => {
    setEditingWali(wali)
    setFormData({
      namaAnak: wali.namaAnak,
      namaPanggilan: wali.namaPanggilan || '',
      namaWali: wali.namaWali,
      noWhatsapp: wali.noWhatsapp,
      tagihan: wali.tagihan.toString(),
      statusBayar: wali.statusBayar,
      bulanTagihan: wali.bulanTagihan
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus data wali murid ini?')) return

    try {
      const response = await fetch(`/api/wali-murid/${id}`, { method: 'DELETE' })
      if (response.ok) {
        loadWaliMurid()
      }
    } catch (error) {
      console.error('Error deleting wali murid:', error)
    }
  }

  const handleUpdateStatus = async (id: number, newStatus: 'belum' | 'lunas') => {
    try {
      const response = await fetch(`/api/wali-murid/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        loadWaliMurid()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatWhatsApp = (phone: string) => {
    if (phone.startsWith('62')) {
      return '0' + phone.substring(2)
    }
    return phone
  }

  const exportStudentData = async (format: 'csv' | 'excel') => {
    if (format === 'csv') {
      const csvContent = [
        // Header
        ['DATA SISWA KELAS 1 IBNU SINA'],
        [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
        [''],
        ['RINGKASAN'],
        ['Total Siswa', waliMurid.length.toString()],
        ['Sudah Bayar', waliMurid.filter(w => w.statusBayar === 'lunas').length.toString()],
        ['Belum Bayar', getJumlahBelumBayar().toString()],
        ['Total Terkumpul', formatCurrency(getTotalLunas())],
        ['Total Tunggakan', formatCurrency(getTotalBelumBayar())],
        [''],
        ['DETAIL SISWA'],
        ['Nama Siswa', 'Nama Wali/Ortu', 'WhatsApp', 'Bulan Tagihan', 'Jumlah Tagihan', 'Status Bayar', 'Tanggal Bayar'],
        ...waliMurid.map(wali => [
          wali.namaAnak,
          wali.namaWali,
          formatWhatsApp(wali.noWhatsapp),
          wali.bulanTagihan,
          wali.tagihan.toString(),
          wali.statusBayar === 'lunas' ? 'Sudah Bayar' : 'Belum Bayar',
          wali.tanggalBayar ? new Date(wali.tanggalBayar).toLocaleDateString('id-ID') : '-'
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data-siswa-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else if (format === 'excel') {
      try {
        const XLSX = await import('xlsx')
        const wb = XLSX.utils.book_new()

        // Summary Sheet
        const summaryData = [
          ['DATA SISWA KELAS 1 IBNU SINA'],
          [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
          [''],
          ['RINGKASAN DATA'],
          ['Metric', 'Nilai'],
          ['Total Siswa', waliMurid.length],
          ['Sudah Bayar', waliMurid.filter(w => w.statusBayar === 'lunas').length],
          ['Belum Bayar', getJumlahBelumBayar()],
          ['Total Terkumpul', getTotalLunas()],
          ['Total Tunggakan', getTotalBelumBayar()],
          ['Progress Pembayaran', `${((waliMurid.filter(w => w.statusBayar === 'lunas').length / Math.max(waliMurid.length, 1)) * 100).toFixed(1)}%`]
        ]
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        summarySheet['!cols'] = [{ width: 25 }, { width: 20 }]

        // Students Sheet
        const studentsData = [
          ['Nama Siswa', 'Nama Wali/Ortu', 'WhatsApp', 'Bulan Tagihan', 'Jumlah Tagihan', 'Status Bayar', 'Tanggal Bayar'],
          ...waliMurid.map(wali => [
            wali.namaAnak,
            wali.namaWali,
            formatWhatsApp(wali.noWhatsapp),
            wali.bulanTagihan,
            wali.tagihan,
            wali.statusBayar === 'lunas' ? 'Sudah Bayar' : 'Belum Bayar',
            wali.tanggalBayar ? new Date(wali.tanggalBayar).toLocaleDateString('id-ID') : '-'
          ])
        ]
        const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData)
        studentsSheet['!cols'] = [
          { width: 20 }, { width: 20 }, { width: 15 },
          { width: 15 }, { width: 15 }, { width: 12 }, { width: 12 }
        ]

        // Paid Students Sheet
        const paidStudents = waliMurid.filter(w => w.statusBayar === 'lunas')
        const paidData = [
          ['SISWA YANG SUDAH BAYAR'],
          ['Nama Siswa', 'Nama Wali/Ortu', 'Jumlah Bayar', 'Tanggal Bayar'],
          ...paidStudents.map(wali => [
            wali.namaAnak,
            wali.namaWali,
            wali.tagihan,
            wali.tanggalBayar ? new Date(wali.tanggalBayar).toLocaleDateString('id-ID') : '-'
          ])
        ]
        const paidSheet = XLSX.utils.aoa_to_sheet(paidData)
        paidSheet['!cols'] = [{ width: 20 }, { width: 20 }, { width: 15 }, { width: 12 }]

        // Unpaid Students Sheet
        const unpaidStudents = waliMurid.filter(w => w.statusBayar === 'belum')
        const unpaidData = [
          ['SISWA YANG BELUM BAYAR'],
          ['Nama Siswa', 'Nama Wali/Ortu', 'WhatsApp', 'Jumlah Tagihan'],
          ...unpaidStudents.map(wali => [
            wali.namaAnak,
            wali.namaWali,
            formatWhatsApp(wali.noWhatsapp),
            wali.tagihan
          ])
        ]
        const unpaidSheet = XLSX.utils.aoa_to_sheet(unpaidData)
        unpaidSheet['!cols'] = [{ width: 20 }, { width: 20 }, { width: 15 }, { width: 15 }]

        XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan')
        XLSX.utils.book_append_sheet(wb, studentsSheet, 'Semua Data')
        XLSX.utils.book_append_sheet(wb, paidSheet, 'Sudah Bayar')
        XLSX.utils.book_append_sheet(wb, unpaidSheet, 'Belum Bayar')

        const fileName = `data-siswa-${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
      } catch (error) {
        console.error('Error exporting Excel:', error)
        alert('Gagal export Excel. Silakan coba lagi.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Data Siswa' }]} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">Data Siswa Kelas 1 Ibnu Sina</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">Kelola Data & Status Pembayaran</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportStudentData('excel')}
                  className="btn-primary flex items-center space-x-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => exportStudentData('csv')}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-primary-400 to-primary-600">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Total Siswa</p>
                <p className="text-3xl font-bold text-primary-600">{waliMurid.length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-success-400 to-success-600">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Sudah Bayar</p>
                <p className="text-3xl font-bold text-success-600">{waliMurid.filter(w => w.statusBayar === 'lunas').length}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-error-400 to-error-600">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Belum Bayar</p>
                <p className="text-3xl font-bold text-error-600">{getJumlahBelumBayar()}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-warning-400 to-warning-600">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Tunggakan</p>
                <p className="text-xl font-bold text-warning-600">{formatCurrency(getTotalBelumBayar())}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-primary w-full text-lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Tambah Siswa
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link href="/reminder-tagihan" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-whatsapp-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                <Phone className="h-6 w-6 text-whatsapp-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Reminder Tagihan</h3>
              <p className="text-sm text-gray-600">Kirim pesan ke {getJumlahBelumBayar()} orang tua yang belum bayar</p>
            </div>
          </Link>

          <div className="card">
            <div className="text-center space-y-3">
              <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Total Terkumpul</h3>
              <p className="text-lg font-bold text-green-600">{formatCurrency(getTotalLunas())}</p>
            </div>
          </div>

          <div className="card">
            <div className="text-center space-y-3">
              <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Progress</h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(waliMurid.filter(w => w.statusBayar === 'lunas').length / Math.max(waliMurid.length, 1)) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {waliMurid.filter(w => w.statusBayar === 'lunas').length} dari {waliMurid.length} sudah bayar
              </p>
            </div>
          </div>
        </div>

        {/* Wali Murid Table */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Daftar Siswa & Orang Tua</h2>
          </div>

          {waliMurid.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada data siswa</p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary mt-4"
              >
                Tambah Data Siswa Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Siswa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wali/Ortu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      WhatsApp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tagihan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {waliMurid.map((wali) => (
                    <tr key={wali.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{wali.namaAnak}</div>
                        {wali.namaPanggilan && (
                          <div className="text-xs text-blue-600">Panggilan: {wali.namaPanggilan}</div>
                        )}
                        <div className="text-sm text-gray-500">{wali.bulanTagihan}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {wali.namaWali}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <a 
                          href={`https://wa.me/${wali.noWhatsapp}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-whatsapp-600 hover:text-whatsapp-800"
                        >
                          {formatWhatsApp(wali.noWhatsapp)}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(wali.tagihan)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleUpdateStatus(wali.id, wali.statusBayar === 'lunas' ? 'belum' : 'lunas')}
                          className={`px-3 py-1 text-xs font-medium rounded-full ${
                            wali.statusBayar === 'lunas' 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {wali.statusBayar === 'lunas' ? 'Lunas' : 'Belum Bayar'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => handleEdit(wali)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(wali.id)}
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
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold gradient-text">
                    {editingWali ? 'Edit Data Siswa' : 'Tambah Data Siswa Baru'}
                  </h3>
                  {!editingWali && (
                    <p className="text-sm text-gray-600 mt-2">
                      Status pembayaran otomatis diset "Belum Bayar" untuk data baru
                    </p>
                  )}
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Siswa
                    </label>
                    <input
                      type="text"
                      value={formData.namaAnak}
                      onChange={(e) => setFormData({...formData, namaAnak: e.target.value})}
                      placeholder="Nama lengkap siswa"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Panggilan <span className="text-gray-400">(opsional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.namaPanggilan}
                      onChange={(e) => setFormData({...formData, namaPanggilan: e.target.value})}
                      placeholder="Nama panggilan untuk Order ID"
                      className="input-field"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Wali/Orang Tua
                    </label>
                    <input
                      type="text"
                      value={formData.namaWali}
                      onChange={(e) => setFormData({...formData, namaWali: e.target.value})}
                      placeholder="Nama ayah/ibu"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nomor WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formData.noWhatsapp}
                      onChange={(e) => setFormData({...formData, noWhatsapp: e.target.value})}
                      placeholder="08123456789"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bulan Tagihan
                    </label>
                    <input
                      type="text"
                      value={formData.bulanTagihan}
                      onChange={(e) => setFormData({...formData, bulanTagihan: e.target.value})}
                      placeholder="Januari 2024"
                      className="input-field"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jumlah Tagihan (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.tagihan}
                      onChange={(e) => setFormData({...formData, tagihan: e.target.value})}
                      placeholder="50000"
                      className="input-field"
                      required
                      min="0"
                    />
                  </div>

                  {editingWali && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status Pembayaran
                      </label>
                      <select
                        value={formData.statusBayar}
                        onChange={(e) => setFormData({...formData, statusBayar: e.target.value as 'belum' | 'lunas'})}
                        className="input-field"
                      >
                        <option value="belum">Belum Bayar</option>
                        <option value="lunas">Sudah Lunas</option>
                      </select>
                    </div>
                  )}

                  <div className="flex space-x-3 pt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false)
                        setEditingWali(null)
                        setFormData({
                          namaAnak: '',
                          namaPanggilan: '',
                          namaWali: '',
                          noWhatsapp: '',
                          tagihan: '',
                          statusBayar: 'belum',
                          bulanTagihan: new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long' })
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
                      {editingWali ? 'Update' : 'Simpan'}
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
