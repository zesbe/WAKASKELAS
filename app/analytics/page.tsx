'use client'

import { useState, useEffect, useMemo } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Users, Calendar, PieChart, LineChart, Download, RefreshCw, Filter } from 'lucide-react'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'
import AnalyticsChart from '../../components/AnalyticsChart'
import InsightCard from '../../components/InsightCard'
import AdvancedExport from '../../components/AdvancedExport'

interface KasEntry {
  id: number
  tanggal: string
  jenis: 'masuk' | 'keluar'
  keterangan: string
  jumlah: number
  kategori?: string
  createdAt: string
}

interface WaliMurid {
  id: number
  namaAnak: string
  namaWali: string
  tagihan: number
  statusBayar: 'belum' | 'lunas'
  bulanTagihan: string
  tanggalBayar?: string
}

interface AnalyticsData {
  totalIncome: number
  totalExpense: number
  currentBalance: number
  totalTransactions: number
  monthlyTrend: Array<{ month: string; income: number; expense: number; balance: number }>
  categoryBreakdown: Array<{ kategori: string; total: number; count: number; percentage: number }>
  paymentRate: number
  avgTransactionSize: number
  insights: Array<{ type: 'positive' | 'negative' | 'neutral'; title: string; value: string; description: string }>
}

export default function AnalyticsPage() {
  const [kasEntries, setKasEntries] = useState<KasEntry[]>([])
  const [waliMurid, setWaliMurid] = useState<WaliMurid[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    end: new Date().toISOString().split('T')[0] // Today
  })
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'cashflow' | 'categories' | 'students'>('overview')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [kasResponse, waliResponse] = await Promise.all([
        fetch('/api/kas-kelas'),
        fetch('/api/wali-murid')
      ])

      const kasData = await kasResponse.json()
      const waliData = await waliResponse.json()

      if (kasData.success && Array.isArray(kasData.kasEntries)) {
        setKasEntries(kasData.kasEntries)
      } else {
        setKasEntries([])
      }

      if (waliData.success && Array.isArray(waliData.waliMurid)) {
        setWaliMurid(waliData.waliMurid)
      } else {
        setWaliMurid([])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper functions for analytics calculations
  const generateMonthlyTrend = (entries: KasEntry[]) => {
    const monthlyData: { [key: string]: { income: number; expense: number } } = {}

    entries.forEach(entry => {
      const date = new Date(entry.tanggal)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 }
      }

      if (entry.jenis === 'masuk') {
        monthlyData[monthKey].income += entry.jumlah
      } else {
        monthlyData[monthKey].expense += entry.jumlah
      }
    })

    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('id-ID', { year: 'numeric', month: 'short' }),
        income: data.income,
        expense: data.expense,
        balance: data.income - data.expense
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  const generateCategoryBreakdown = (entries: KasEntry[]) => {
    const categoryData: { [key: string]: { total: number; count: number } } = {}
    const totalAmount = entries.reduce((sum, entry) => sum + entry.jumlah, 0)

    entries.forEach(entry => {
      const category = entry.kategori || 'Lainnya'
      if (!categoryData[category]) {
        categoryData[category] = { total: 0, count: 0 }
      }
      categoryData[category].total += entry.jumlah
      categoryData[category].count += 1
    })

    return Object.entries(categoryData)
      .map(([kategori, data]) => ({
        kategori,
        total: data.total,
        count: data.count,
        percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)
  }

  const generateInsights = (data: any) => {
    const insights = []

    // Cash flow health
    if (data.currentBalance > 0) {
      insights.push({
        type: 'positive' as const,
        title: 'Kas Sehat',
        value: formatCurrency(data.currentBalance),
        description: `Saldo positif menunjukkan pengelolaan kas yang baik`
      })
    } else {
      insights.push({
        type: 'negative' as const,
        title: 'Defisit Kas',
        value: formatCurrency(Math.abs(data.currentBalance)),
        description: `Perlu pengawasan ekstra untuk mengembalikan saldo positif`
      })
    }

    // Payment rate analysis
    if (data.paymentRate >= 80) {
      insights.push({
        type: 'positive' as const,
        title: 'Tingkat Pembayaran Excellent',
        value: `${data.paymentRate.toFixed(1)}%`,
        description: `${data.paidStudents} dari ${data.totalStudents} siswa sudah membayar`
      })
    } else if (data.paymentRate >= 60) {
      insights.push({
        type: 'neutral' as const,
        title: 'Tingkat Pembayaran Baik',
        value: `${data.paymentRate.toFixed(1)}%`,
        description: `Masih ada ${data.totalStudents - data.paidStudents} siswa yang belum membayar`
      })
    } else {
      insights.push({
        type: 'negative' as const,
        title: 'Tingkat Pembayaran Rendah',
        value: `${data.paymentRate.toFixed(1)}%`,
        description: `Perlu tindakan follow-up untuk ${data.totalStudents - data.paidStudents} siswa`
      })
    }

    // Monthly trend analysis
    if (data.monthlyTrend.length >= 2) {
      const latestMonth = data.monthlyTrend[data.monthlyTrend.length - 1]
      const previousMonth = data.monthlyTrend[data.monthlyTrend.length - 2]
      const growthRate = previousMonth.balance !== 0 ?
        ((latestMonth.balance - previousMonth.balance) / Math.abs(previousMonth.balance)) * 100 : 0

      if (growthRate > 10) {
        insights.push({
          type: 'positive' as const,
          title: 'Pertumbuhan Positif',
          value: `+${growthRate.toFixed(1)}%`,
          description: `Tren keuangan menunjukkan peningkatan yang baik`
        })
      } else if (growthRate < -10) {
        insights.push({
          type: 'negative' as const,
          title: 'Penurunan Signifikan',
          value: `${growthRate.toFixed(1)}%`,
          description: `Perlu evaluasi strategi pengelolaan kas`
        })
      }
    }

    return insights
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  // Advanced Analytics Calculations
  const analyticsData: AnalyticsData = useMemo(() => {
    // Safety checks to prevent undefined errors
    const safeKasEntries = kasEntries || []
    const safeWaliMurid = waliMurid || []

    const filteredEntries = safeKasEntries.filter(entry => {
      const entryDate = new Date(entry.tanggal)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      return entryDate >= startDate && entryDate <= endDate
    })

    const totalIncome = filteredEntries
      .filter(entry => entry.jenis === 'masuk')
      .reduce((sum, entry) => sum + entry.jumlah, 0)

    const totalExpense = filteredEntries
      .filter(entry => entry.jenis === 'keluar')
      .reduce((sum, entry) => sum + entry.jumlah, 0)

    const currentBalance = totalIncome - totalExpense

    // Monthly trend analysis
    const monthlyTrend = generateMonthlyTrend(filteredEntries)
    
    // Category breakdown
    const categoryBreakdown = generateCategoryBreakdown(filteredEntries)
    
    // Student payment analysis
    const paidStudents = safeWaliMurid.filter(w => w.statusBayar === 'lunas').length
    const paymentRate = safeWaliMurid.length > 0 ? (paidStudents / safeWaliMurid.length) * 100 : 0
    
    // Average transaction size
    const avgTransactionSize = filteredEntries.length > 0 ? 
      (totalIncome + totalExpense) / filteredEntries.length : 0

    // AI-powered insights
    const insights = generateInsights({
      totalIncome,
      totalExpense,
      currentBalance,
      monthlyTrend,
      paymentRate,
      avgTransactionSize,
      totalStudents: safeWaliMurid.length,
      paidStudents
    })

    return {
      totalIncome,
      totalExpense,
      currentBalance,
      totalTransactions: filteredEntries.length,
      monthlyTrend,
      categoryBreakdown,
      paymentRate,
      avgTransactionSize,
      insights
    }
  }, [kasEntries, waliMurid, dateRange])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Advanced Analytics' }]} />
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">📊 Advanced Analytics</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">
                  Data & Insights
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={loadData}
                  className="btn-secondary"
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Filter */}
        <div className="card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-gray-500" />
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Dari:</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Sampai:</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="input-field text-sm"
                />
              </div>
            </div>
            
            <AdvancedExport
              data={{
                kasEntries: kasEntries.filter(entry => {
                  const entryDate = new Date(entry.tanggal)
                  const startDate = new Date(dateRange.start)
                  const endDate = new Date(dateRange.end)
                  return entryDate >= startDate && entryDate <= endDate
                }),
                monthlyData: analyticsData.monthlyTrend.map(item => ({
                  month: item.month,
                  masuk: item.income,
                  keluar: item.expense,
                  saldo: item.balance
                })),
                incomeCategories: analyticsData.categoryBreakdown.filter(c => c.total > 0),
                expenseCategories: analyticsData.categoryBreakdown.filter(c => c.total > 0),
                summary: {
                  totalIncome: analyticsData.totalIncome,
                  totalExpense: analyticsData.totalExpense,
                  currentBalance: analyticsData.currentBalance,
                  totalTransactions: analyticsData.totalTransactions
                }
              }}
              title="Analytics Report"
            />
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(analyticsData.totalIncome)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(analyticsData.totalExpense)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Saldo Saat Ini</p>
                <p className={`text-2xl font-bold ${analyticsData.currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(analyticsData.currentBalance)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tingkat Pembayaran</p>
                <p className="text-2xl font-bold text-purple-600">{analyticsData.paymentRate.toFixed(1)}%</p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="card mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'cashflow', label: 'Cash Flow', icon: LineChart },
              { key: 'categories', label: 'Categories', icon: PieChart },
              { key: 'students', label: 'Students', icon: Users }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedMetric(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  selectedMetric === tab.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content based on selected metric */}
        {selectedMetric === 'overview' && (
          <div className="space-y-8">
            {/* AI Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analyticsData.insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </div>
            
            {/* Monthly Trend Chart */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Trend Bulanan</h3>
              <AnalyticsChart
                data={analyticsData.monthlyTrend}
                type="line"
                xKey="month"
                yKeys={['income', 'expense', 'balance']}
                colors={['#10b981', '#ef4444', '#3b82f6']}
                labels={['Pemasukan', 'Pengeluaran', 'Saldo']}
              />
            </div>
          </div>
        )}

        {selectedMetric === 'cashflow' && (
          <div className="space-y-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Analisis Cash Flow</h3>
              <AnalyticsChart
                data={analyticsData.monthlyTrend}
                type="bar"
                xKey="month"
                yKeys={['income', 'expense']}
                colors={['#10b981', '#ef4444']}
                labels={['Pemasukan', 'Pengeluaran']}
              />
            </div>
          </div>
        )}

        {selectedMetric === 'categories' && (
          <div className="space-y-8">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Breakdown Kategori</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <AnalyticsChart
                    data={analyticsData.categoryBreakdown}
                    type="pie"
                    xKey="kategori"
                    yKeys={['total']}
                    colors={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
                  />
                </div>
                <div className="space-y-4">
                  {analyticsData.categoryBreakdown.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{category.kategori}</p>
                        <p className="text-sm text-gray-600">{category.percentage.toFixed(1)}% dari total</p>
                      </div>
                      <p className="font-semibold text-blue-600">{formatCurrency(category.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMetric === 'students' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Status Pembayaran Siswa</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Siswa</span>
                    <span className="font-semibold">{waliMurid.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600">Sudah Bayar</span>
                    <span className="font-semibold text-green-600">
                      {waliMurid.filter(w => w.statusBayar === 'lunas').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600">Belum Bayar</span>
                    <span className="font-semibold text-red-600">
                      {waliMurid.filter(w => w.statusBayar === 'belum').length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${analyticsData.paymentRate}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Total Tagihan</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Tagihan</span>
                    <span className="font-semibold">
                      {formatCurrency(waliMurid.reduce((sum, w) => sum + w.tagihan, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-600">Sudah Terbayar</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(waliMurid.filter(w => w.statusBayar === 'lunas').reduce((sum, w) => sum + w.tagihan, 0))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-red-600">Outstanding</span>
                    <span className="font-semibold text-red-600">
                      {formatCurrency(waliMurid.filter(w => w.statusBayar === 'belum').reduce((sum, w) => sum + w.tagihan, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <FloatingNav />
    </div>
  )
}
