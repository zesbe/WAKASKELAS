'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign, Calendar, Filter, Users, PieChart } from 'lucide-react'
import Link from 'next/link'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'
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

interface MonthlyData {
  month: string
  masuk: number
  keluar: number
  saldo: number
}

interface CategoryData {
  kategori: string
  total: number
  count: number
  percentage: number
}

export default function LaporanKeuanganPage() {
  const [kasEntries, setKasEntries] = useState<KasEntry[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([])
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('6month')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    let isMounted = true

    const loadDataIfMounted = async () => {
      if (isMounted) await loadFinancialData()
    }

    loadDataIfMounted()

    return () => {
      isMounted = false
    }
  }, [selectedPeriod, selectedYear])

  const loadFinancialData = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)
      
      const response = await fetch('/api/laporan-keuangan', {
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
          setKasEntries(data.data?.entries || [])
          processFinancialData(data.data?.entries || [])
        }
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Request was cancelled, this is normal - don't set empty data
        return
      }
      console.error('Error loading financial data:', error.message)
      // Fallback with empty data
      setKasEntries([])
      setMonthlyData([])
      setIncomeCategories([])
      setExpenseCategories([])
    }
  }

  const processFinancialData = (entries: KasEntry[]) => {
    // Process monthly data
    const monthlyMap = new Map<string, { masuk: number, keluar: number }>()
    
    entries.forEach(entry => {
      const month = new Date(entry.tanggal).toLocaleDateString('id-ID', { year: 'numeric', month: 'short' })
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { masuk: 0, keluar: 0 })
      }
      
      const monthData = monthlyMap.get(month)!
      if (entry.jenis === 'masuk') {
        monthData.masuk += entry.jumlah
      } else {
        monthData.keluar += entry.jumlah
      }
    })

    let runningBalance = 0
    const monthlyArray: MonthlyData[] = Array.from(monthlyMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([month, data]) => {
        runningBalance += data.masuk - data.keluar
        return {
          month,
          masuk: data.masuk,
          keluar: data.keluar,
          saldo: runningBalance
        }
      })
    
    setMonthlyData(monthlyArray.slice(-6)) // Last 6 months

    // Process income categories
    const incomeMap = new Map<string, { total: number, count: number }>()
    const expenseMap = new Map<string, { total: number, count: number }>()
    
    entries.forEach(entry => {
      const kategori = entry.kategori || (entry.jenis === 'masuk' ? 'Iuran Umum' : 'Pengeluaran Umum')
      const targetMap = entry.jenis === 'masuk' ? incomeMap : expenseMap
      
      if (!targetMap.has(kategori)) {
        targetMap.set(kategori, { total: 0, count: 0 })
      }
      
      const categoryData = targetMap.get(kategori)!
      categoryData.total += entry.jumlah
      categoryData.count += 1
    })

    // Convert to arrays with percentages
    const totalIncome = Array.from(incomeMap.values()).reduce((sum, cat) => sum + cat.total, 0)
    const totalExpense = Array.from(expenseMap.values()).reduce((sum, cat) => sum + cat.total, 0)

    const incomeArray: CategoryData[] = Array.from(incomeMap.entries())
      .map(([kategori, data]) => ({
        kategori,
        total: data.total,
        count: data.count,
        percentage: totalIncome > 0 ? (data.total / totalIncome) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)

    const expenseArray: CategoryData[] = Array.from(expenseMap.entries())
      .map(([kategori, data]) => ({
        kategori,
        total: data.total,
        count: data.count,
        percentage: totalExpense > 0 ? (data.total / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total)

    setIncomeCategories(incomeArray)
    setExpenseCategories(expenseArray)
  }

  const getTotalIncome = () => {
    return kasEntries.filter(entry => entry.jenis === 'masuk').reduce((total, entry) => total + entry.jumlah, 0)
  }

  const getTotalExpense = () => {
    return kasEntries.filter(entry => entry.jenis === 'keluar').reduce((total, entry) => total + entry.jumlah, 0)
  }

  const getCurrentBalance = () => {
    return getTotalIncome() - getTotalExpense()
  }

  const getAverageMonthlyIncome = () => {
    if (monthlyData.length === 0) return 0
    return monthlyData.reduce((sum, month) => sum + month.masuk, 0) / monthlyData.length
  }

  const getAverageMonthlyExpense = () => {
    if (monthlyData.length === 0) return 0
    return monthlyData.reduce((sum, month) => sum + month.keluar, 0) / monthlyData.length
  }

  const getExportData = () => {
    return {
      kasEntries,
      monthlyData,
      incomeCategories,
      expenseCategories,
      summary: {
        totalIncome: getTotalIncome(),
        totalExpense: getTotalExpense(),
        currentBalance: getCurrentBalance(),
        totalTransactions: kasEntries.length
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-success-600'
    if (balance < 0) return 'text-error-600'
    return 'text-secondary-600'
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 40) return 'bg-error-500'
    if (percentage >= 25) return 'bg-warning-500'
    return 'bg-success-500'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Laporan Keuangan' }]} />
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">Laporan Keuangan Kelas 1 Ibnu Sina</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">Financial Reports & Analysis</p>
              </div>
              <AdvancedExport
                data={getExportData()}
                title="Laporan Keuangan Kelas 1 Ibnu Sina"
              />
            </div>
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
                <p className="text-secondary-600 font-medium">Saldo Saat Ini</p>
                <p className={`text-2xl font-bold ${getBalanceColor(getCurrentBalance())}`}>
                  {formatCurrency(getCurrentBalance())}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-primary-400 to-primary-600">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Total Pemasukan</p>
                <p className="text-2xl font-bold text-success-600">{formatCurrency(getTotalIncome())}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-error-400 to-error-600">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-error-600">{formatCurrency(getTotalExpense())}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="icon-container bg-gradient-to-br from-warning-400 to-warning-600">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-secondary-600 font-medium">Transaksi</p>
                <p className="text-2xl font-bold text-secondary-900">{kasEntries.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="card mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold gradient-text">Tren Bulanan (6 Bulan Terakhir)</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-success-500 rounded"></div>
                <span className="text-sm text-secondary-600">Pemasukan</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-error-500 rounded"></div>
                <span className="text-sm text-secondary-600">Pengeluaran</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            {monthlyData.map((month, index) => {
              const maxAmount = Math.max(...monthlyData.map(m => Math.max(m.masuk, m.keluar)))
              return (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{month.month}</span>
                    <span className={getBalanceColor(month.saldo)}>
                      Saldo: {formatCurrency(month.saldo)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-success-600 w-16">Masuk</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-success-500 h-2 rounded-full" 
                          style={{ width: `${maxAmount > 0 ? (month.masuk / maxAmount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-success-600 w-20 text-right">
                        {formatCurrency(month.masuk)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-error-600 w-16">Keluar</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-error-500 h-2 rounded-full" 
                          style={{ width: `${maxAmount > 0 ? (month.keluar / maxAmount) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-error-600 w-20 text-right">
                        {formatCurrency(month.keluar)}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Category Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Income Categories */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-900">Kategori Pemasukan</h3>
              <div className="icon-container bg-gradient-to-br from-success-400 to-success-600">
                <PieChart className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              {incomeCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">{category.kategori}</span>
                    <span className="text-sm text-success-600">{formatCurrency(category.total)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-success-500 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-secondary-600 w-12">{category.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-secondary-500">{category.count} transaksi</div>
                </div>
              ))}
              
              {incomeCategories.length === 0 && (
                <div className="text-center py-4 text-secondary-500">
                  <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Belum ada data pemasukan</p>
                </div>
              )}
            </div>
          </div>

          {/* Expense Categories */}
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-secondary-900">Kategori Pengeluaran</h3>
              <div className="icon-container bg-gradient-to-br from-error-400 to-error-600">
                <PieChart className="h-5 w-5 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              {expenseCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-secondary-900">{category.kategori}</span>
                    <span className="text-sm text-error-600">{formatCurrency(category.total)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getPercentageColor(category.percentage)}`}
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-secondary-600 w-12">{category.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-secondary-500">{category.count} transaksi</div>
                </div>
              ))}
              
              {expenseCategories.length === 0 && (
                <div className="text-center py-4 text-secondary-500">
                  <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Belum ada data pengeluaran</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Financial Health Indicators */}
        <div className="card mb-8">
          <h3 className="text-lg font-bold text-secondary-900 mb-6">Indikator Kesehatan Keuangan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary-600 mb-2">
                {formatCurrency(getAverageMonthlyIncome())}
              </div>
              <div className="text-sm text-secondary-600">Rata-rata Pemasukan Bulanan</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-error-600 mb-2">
                {formatCurrency(getAverageMonthlyExpense())}
              </div>
              <div className="text-sm text-secondary-600">Rata-rata Pengeluaran Bulanan</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold mb-2 ${
                getAverageMonthlyIncome() > getAverageMonthlyExpense() ? 'text-success-600' : 'text-warning-600'
              }`}>
                {getAverageMonthlyIncome() > getAverageMonthlyExpense() ? 'SEHAT' : 'PERLU PERHATIAN'}
              </div>
              <div className="text-sm text-secondary-600">Status Keuangan</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/kas-kelas" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-success-400 to-success-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Kelola Kas Kelas</h3>
              <p className="text-sm text-gray-600">Tambah transaksi pemasukan atau pengeluaran</p>
            </div>
          </Link>

          <Link href="/wali-murid" className="card hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-primary-400 to-primary-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Data Wali Murid</h3>
              <p className="text-sm text-gray-600">Lihat status pembayaran dan tagihan</p>
            </div>
          </Link>

          <div className="card">
            <div className="text-center space-y-3">
              <div className="bg-gradient-to-br from-warning-400 to-warning-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">Periode Laporan</h3>
              <p className="text-sm text-gray-600">Menampilkan data 6 bulan terakhir</p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
