'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Users, TrendingUp, Clock, CheckCircle, XCircle, Loader2, RefreshCw, QrCode, MessageSquare, BarChart3, Download, Settings } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'
import PaymentLinkGenerator from '../../components/PaymentLinkGenerator'

interface Student {
  id: number
  namaAnak: string
  namaWali: string
  noWhatsapp: string
  tagihan: number
  statusBayar: 'belum' | 'lunas'
  tanggalBayar?: string
  bulanTagihan: string
  payment_order_id?: string
  payment_amount?: number
  payment_method?: string
}

interface PaymentStats {
  totalStudents: number
  paidStudents: number
  unpaidStudents: number
  paymentRate: number
  totalRevenue: number
  totalPayments: number
}

interface PaymentLog {
  id: number
  student_id: number
  order_id: string
  amount: number
  status: string
  payment_method: string
  completed_at: string
  namaAnak: string
  namaWali: string
}

export default function PaymentCenterPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'generator' | 'logs'>('overview')

  useEffect(() => {
    let isMounted = true

    const loadDataIfMounted = async () => {
      if (isMounted) await loadData()
    }

    loadDataIfMounted()

    // Auto refresh every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) loadDataIfMounted()
    }, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const loadData = async () => {
    try {
      setIsRefreshing(true)
      
      const [studentsRes, statsRes, logsRes] = await Promise.all([
        fetch('/api/wali-murid'),
        fetch('/api/stats'),
        fetch('/api/payment/logs')
      ])

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json()
        setStudents(studentsData.waliMurid || [])
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setPaymentLogs(logsData.logs || [])
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, this is normal
        return
      }
      console.error('Error loading data:', error.message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
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
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportPaymentData = async (format: 'csv' | 'excel') => {
    if (format === 'csv') {
      const csvContent = [
        ['LAPORAN PEMBAYARAN KELAS 1 IBNU SINA'],
        [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
        [''],
        ['RINGKASAN PEMBAYARAN'],
        ['Total Siswa', stats?.totalStudents.toString() || '0'],
        ['Sudah Bayar', stats?.paidStudents.toString() || '0'],
        ['Belum Bayar', stats?.unpaidStudents.toString() || '0'],
        ['Progress', `${stats?.paymentRate.toFixed(1) || '0'}%`],
        ['Total Revenue', formatCurrency(stats?.totalRevenue || 0)],
        [''],
        ['TRANSACTION LOGS'],
        ['Siswa', 'Orang Tua', 'Amount', 'Payment Method', 'Order ID', 'Tanggal'],
        ...paymentLogs.map(log => [
          log.namaAnak || '-',
          log.namaWali || '-',
          log.amount.toString(),
          log.payment_method || 'QRIS',
          log.order_id,
          formatDate(log.completed_at)
        ])
      ].map(row => row.join(',')).join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payment-report-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } else if (format === 'excel') {
      try {
        const XLSX = await import('xlsx')
        const wb = XLSX.utils.book_new()

        // Summary Sheet
        const summaryData = [
          ['LAPORAN PEMBAYARAN KELAS 1 IBNU SINA'],
          [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
          [''],
          ['RINGKASAN PEMBAYARAN'],
          ['Metric', 'Nilai'],
          ['Total Siswa', stats?.totalStudents || 0],
          ['Sudah Bayar', stats?.paidStudents || 0],
          ['Belum Bayar', stats?.unpaidStudents || 0],
          ['Progress Pembayaran', `${stats?.paymentRate.toFixed(1) || '0'}%`],
          ['Total Revenue', stats?.totalRevenue || 0],
          ['Total Transactions', stats?.totalPayments || 0]
        ]
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
        summarySheet['!cols'] = [{ width: 25 }, { width: 20 }]

        // Transaction Logs Sheet
        const transactionData = [
          ['Nama Siswa', 'Nama Orang Tua', 'Amount', 'Payment Method', 'Order ID', 'Status', 'Tanggal Completed'],
          ...paymentLogs.map(log => [
            log.namaAnak || '-',
            log.namaWali || '-',
            log.amount,
            log.payment_method || 'QRIS',
            log.order_id,
            log.status,
            formatDate(log.completed_at)
          ])
        ]
        const transactionSheet = XLSX.utils.aoa_to_sheet(transactionData)
        transactionSheet['!cols'] = [
          { width: 20 }, { width: 20 }, { width: 15 },
          { width: 15 }, { width: 25 }, { width: 12 }, { width: 20 }
        ]

        // Students Status Sheet
        const studentsData = [
          ['Status Pembayaran Siswa'],
          ['Nama Siswa', 'Nama Orang Tua', 'Status', 'Jumlah Tagihan', 'Tanggal Bayar'],
          ...students.map(student => [
            student.namaAnak,
            student.namaWali,
            student.statusBayar === 'lunas' ? 'Sudah Bayar' : 'Belum Bayar',
            student.tagihan,
            student.tanggalBayar ? new Date(student.tanggalBayar).toLocaleDateString('id-ID') : '-'
          ])
        ]
        const studentsSheet = XLSX.utils.aoa_to_sheet(studentsData)
        studentsSheet['!cols'] = [
          { width: 20 }, { width: 20 }, { width: 12 }, { width: 15 }, { width: 12 }
        ]

        XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan')
        XLSX.utils.book_append_sheet(wb, transactionSheet, 'Transaction Logs')
        XLSX.utils.book_append_sheet(wb, studentsSheet, 'Status Siswa')

        const fileName = `payment-report-${new Date().toISOString().split('T')[0]}.xlsx`
        XLSX.writeFile(wb, fileName)
      } catch (error) {
        console.error('Error exporting Excel:', error)
        alert('Gagal export Excel. Silakan coba lagi.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading Payment Center...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Payment Center' }]} />
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">Payment Center</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">
                  QRIS Payment & Auto WhatsApp
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => exportPaymentData('excel')}
                  className="btn-primary flex items-center space-x-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => exportPaymentData('csv')}
                  className="btn-secondary flex items-center space-x-2 text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={loadData}
                  disabled={isRefreshing}
                  className="btn-secondary"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-secondary-600 font-medium">Total Siswa</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-secondary-600 font-medium">Sudah Bayar</p>
                  <p className="text-3xl font-bold text-green-600">{stats.paidStudents}</p>
                  <p className="text-sm text-green-600">{stats.paymentRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-red-400 to-red-600 p-3 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-secondary-600 font-medium">Belum Bayar</p>
                  <p className="text-3xl font-bold text-red-600">{stats.unpaidStudents}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-secondary-600 font-medium">Total Kas</p>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2 inline" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('generator')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'generator'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <CreditCard className="h-4 w-4 mr-2 inline" />
                Generate Payment
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'logs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-4 w-4 mr-2 inline" />
                Transaction Logs
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Payment Progress */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Progress Pembayaran</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Completion Rate</span>
                  <span className="font-semibold">{stats?.paymentRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-green-500 h-4 rounded-full transition-all duration-1000"
                    style={{ width: `${stats?.paymentRate || 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{stats?.paidStudents} Lunas</span>
                  <span>{stats?.unpaidStudents} Pending</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="/wali-murid" className="card hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-center space-y-3">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Kelola Data Siswa</h3>
                  <p className="text-sm text-gray-600">Update data siswa dan status pembayaran</p>
                </div>
              </Link>

              <button
                onClick={() => setActiveTab('generator')}
                className="card hover:shadow-md transition-shadow cursor-pointer text-left"
              >
                <div className="text-center space-y-3">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                    <QrCode className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Generate Payment</h3>
                  <p className="text-sm text-gray-600">Buat link pembayaran otomatis</p>
                </div>
              </button>

              <Link href="/reminder-tagihan" className="card hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-center space-y-3">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                    <MessageSquare className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Send Reminders</h3>
                  <p className="text-sm text-gray-600">Kirim reminder ke orang tua</p>
                </div>
              </Link>

              <Link href="/webhook-config" className="card hover:shadow-md transition-shadow cursor-pointer border-2 border-dashed border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50">
                <div className="text-center space-y-3">
                  <div className="bg-yellow-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto">
                    <Settings className="h-6 w-6 text-yellow-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">Webhook Config</h3>
                  <p className="text-sm text-gray-600">Setup integrasi Pakasir webhook</p>
                </div>
              </Link>
            </div>

            {/* Recent Payments */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pembayaran Terbaru</h3>
              {paymentLogs.length > 0 ? (
                <div className="space-y-3">
                  {paymentLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium text-gray-900">{log.namaAnak}</p>
                          <p className="text-sm text-gray-600">{log.namaWali}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-600">{formatCurrency(log.amount)}</p>
                        <p className="text-xs text-gray-500">{formatDate(log.completed_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">Belum ada pembayaran</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'generator' && (
          <PaymentLinkGenerator students={students} onRefresh={loadData} />
        )}

        {activeTab === 'logs' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Transaction Logs ({paymentLogs.length})
            </h3>
            {paymentLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paymentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{log.namaAnak}</p>
                            <p className="text-sm text-gray-500">{log.namaWali}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-medium text-green-600">
                            {formatCurrency(log.amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {log.payment_method?.toUpperCase() || 'QRIS'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.completed_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                          {log.order_id}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Belum ada transaction logs</p>
            )}
          </div>
        )}
      </main>

      <FloatingNav />
    </div>
  )
}
