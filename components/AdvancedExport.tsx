'use client'

import { useState, useCallback, memo } from 'react'
import { Download, FileSpreadsheet, FileText, File, CheckCircle, Loader2 } from 'lucide-react'

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

interface ExportData {
  kasEntries: KasEntry[]
  monthlyData: MonthlyData[]
  incomeCategories: CategoryData[]
  expenseCategories: CategoryData[]
  summary: {
    totalIncome: number
    totalExpense: number
    currentBalance: number
    totalTransactions: number
  }
}

interface AdvancedExportProps {
  data: ExportData
  title?: string
}

const AdvancedExport = memo(function AdvancedExport({ data, title = 'Laporan Keuangan' }: AdvancedExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('excel')

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }, [])

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }, [])

  const exportCSV = useCallback(() => {
    const csvContent = [
      ['LAPORAN KEUANGAN KELAS 1 IBNU SINA'],
      [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
      [''],
      
      ['RINGKASAN'],
      ['Total Pemasukan', formatCurrency(data.summary.totalIncome)],
      ['Total Pengeluaran', formatCurrency(data.summary.totalExpense)],
      ['Saldo Saat Ini', formatCurrency(data.summary.currentBalance)],
      ['Total Transaksi', data.summary.totalTransactions.toString()],
      [''],
      
      ['DETAIL TRANSAKSI'],
      ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah'],
      ...data.kasEntries.map(entry => [
        formatDate(entry.tanggal),
        entry.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
        entry.kategori || '-',
        entry.keterangan,
        entry.jumlah.toString()
      ]),
      [''],
      
      ['RINGKASAN BULANAN'],
      ['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo'],
      ...data.monthlyData.map(month => [
        month.month,
        month.masuk.toString(),
        month.keluar.toString(),
        month.saldo.toString()
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }, [data, formatCurrency, formatDate, title])

  const exportExcel = useCallback(async () => {
    try {
      const [XLSX] = await Promise.all([
        import('xlsx')
      ])
      
      const wb = XLSX.utils.book_new()

      const summaryData = [
        ['LAPORAN KEUANGAN KELAS 1 IBNU SINA'],
        [`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
        [''],
        ['RINGKASAN KEUANGAN'],
        ['Metric', 'Nilai'],
        ['Total Pemasukan', data.summary.totalIncome],
        ['Total Pengeluaran', data.summary.totalExpense],
        ['Saldo Saat Ini', data.summary.currentBalance],
        ['Total Transaksi', data.summary.totalTransactions],
        [''],
        ['STATUS KEUANGAN'],
        ['Kesehatan', data.summary.totalIncome > data.summary.totalExpense ? 'SEHAT' : 'PERLU PERHATIAN']
      ]
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      summarySheet['!cols'] = [{ width: 25 }, { width: 20 }]

      const transactionsData = [
        ['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah'],
        ...data.kasEntries.map(entry => [
          formatDate(entry.tanggal),
          entry.jenis === 'masuk' ? 'Pemasukan' : 'Pengeluaran',
          entry.kategori || '-',
          entry.keterangan,
          entry.jumlah
        ])
      ]
      const transactionsSheet = XLSX.utils.aoa_to_sheet(transactionsData)
      transactionsSheet['!cols'] = [
        { width: 12 }, { width: 12 }, { width: 20 }, { width: 40 }, { width: 15 }
      ]

      const monthlyData = [
        ['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo', 'Net Cash Flow'],
        ...data.monthlyData.map(month => [
          month.month,
          month.masuk,
          month.keluar,
          month.saldo,
          month.masuk - month.keluar
        ])
      ]
      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData)
      monthlySheet['!cols'] = [
        { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }, { width: 15 }
      ]

      const incomeData = [
        ['Kategori Pemasukan', 'Total', 'Jumlah Transaksi', 'Persentase'],
        ...data.incomeCategories.map(cat => [
          cat.kategori,
          cat.total,
          cat.count,
          `${cat.percentage.toFixed(1)}%`
        ])
      ]
      const incomeSheet = XLSX.utils.aoa_to_sheet(incomeData)
      incomeSheet['!cols'] = [
        { width: 25 }, { width: 15 }, { width: 18 }, { width: 12 }
      ]

      const expenseData = [
        ['Kategori Pengeluaran', 'Total', 'Jumlah Transaksi', 'Persentase'],
        ...data.expenseCategories.map(cat => [
          cat.kategori,
          cat.total,
          cat.count,
          `${cat.percentage.toFixed(1)}%`
        ])
      ]
      const expenseSheet = XLSX.utils.aoa_to_sheet(expenseData)
      expenseSheet['!cols'] = [
        { width: 25 }, { width: 15 }, { width: 18 }, { width: 12 }
      ]

      XLSX.utils.book_append_sheet(wb, summarySheet, 'Ringkasan')
      XLSX.utils.book_append_sheet(wb, transactionsSheet, 'Detail Transaksi')
      XLSX.utils.book_append_sheet(wb, monthlySheet, 'Bulanan')
      XLSX.utils.book_append_sheet(wb, incomeSheet, 'Kategori Pemasukan')
      XLSX.utils.book_append_sheet(wb, expenseSheet, 'Kategori Pengeluaran')

      const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`
      XLSX.writeFile(wb, fileName)

    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Gagal export Excel. Silakan coba lagi.')
    }
  }, [data, formatDate, title])

  const exportSimplePDF = useCallback((pdf: any) => {
    pdf.setFontSize(18)
    pdf.text('LAPORAN KEUANGAN', 105, 20, { align: 'center' })
    pdf.setFontSize(14)
    pdf.text('Kelas 1 Ibnu Sina', 105, 28, { align: 'center' })

    pdf.setFontSize(12)
    pdf.text('RINGKASAN KEUANGAN', 20, 50)

    let yPos = 65
    pdf.setFontSize(10)
    pdf.text(`Total Pemasukan: ${formatCurrency(data.summary.totalIncome)}`, 20, yPos)
    yPos += 8
    pdf.text(`Total Pengeluaran: ${formatCurrency(data.summary.totalExpense)}`, 20, yPos)
    yPos += 8
    pdf.text(`Saldo Saat Ini: ${formatCurrency(data.summary.currentBalance)}`, 20, yPos)
    yPos += 8
    pdf.text(`Total Transaksi: ${data.summary.totalTransactions}`, 20, yPos)

    yPos += 20
    pdf.setFontSize(12)
    pdf.text('TRANSAKSI TERBARU', 20, yPos)
    yPos += 15

    pdf.setFontSize(8)
    const recentTransactions = data.kasEntries.slice(0, 15)
    recentTransactions.forEach((entry) => {
      if (yPos > 280) {
        pdf.addPage()
        yPos = 20
      }
      const text = `${formatDate(entry.tanggal)} | ${entry.jenis.toUpperCase()} | ${entry.keterangan} | ${formatCurrency(entry.jumlah)}`
      pdf.text(text.length > 100 ? text.substring(0, 100) + '...' : text, 20, yPos)
      yPos += 6
    })

    const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-simple-${new Date().toISOString().split('T')[0]}.pdf`
    pdf.save(fileName)
  }, [data, formatCurrency, formatDate, title])

  const exportPDF = useCallback(async () => {
    try {
      const [{ jsPDF }, autoTable] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable')
      ])

      const pdf = new jsPDF() as any

      if (typeof pdf.autoTable !== 'function') {
        console.warn('autoTable not available, falling back to simple PDF')
        return exportSimplePDF(pdf)
      }
      
      pdf.setFontSize(18)
      pdf.setFont('helvetica', 'bold')
      pdf.text('LAPORAN KEUANGAN', 105, 20, { align: 'center' })
      pdf.setFontSize(14)
      pdf.text('Kelas 1 Ibnu Sina', 105, 28, { align: 'center' })
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, 105, 36, { align: 'center' })

      let yPosition = 50

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RINGKASAN KEUANGAN', 20, yPosition)
      
      yPosition += 10
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      const summaryData = [
        ['Total Pemasukan', formatCurrency(data.summary.totalIncome)],
        ['Total Pengeluaran', formatCurrency(data.summary.totalExpense)],
        ['Saldo Saat Ini', formatCurrency(data.summary.currentBalance)],
        ['Total Transaksi', data.summary.totalTransactions.toString()],
        ['Status Keuangan', data.summary.totalIncome > data.summary.totalExpense ? 'SEHAT' : 'PERLU PERHATIAN']
      ]

      try {
        pdf.autoTable({
          startY: yPosition,
          head: [['Metric', 'Nilai']],
          body: summaryData,
          theme: 'grid',
          headStyles: { fillColor: [66, 139, 202] },
          columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 80 } },
          margin: { left: 20 }
        })

        yPosition = pdf.lastAutoTable.finalY + 20
      } catch (tableError) {
        console.warn('autoTable failed, using simple PDF instead')
        return exportSimplePDF(pdf)
      }

      if (yPosition > 200) {
        pdf.addPage()
        yPosition = 20
      }

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('RINGKASAN BULANAN', 20, yPosition)
      
      yPosition += 10

      const monthlyTableData = data.monthlyData.map(month => [
        month.month,
        formatCurrency(month.masuk),
        formatCurrency(month.keluar),
        formatCurrency(month.saldo)
      ])

      pdf.autoTable({
        startY: yPosition,
        head: [['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo']],
        body: monthlyTableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 40 },
          3: { cellWidth: 40 }
        },
        margin: { left: 20 }
      })

      pdf.addPage()
      yPosition = 20

      pdf.setFontSize(12)
      pdf.setFont('helvetica', 'bold')
      pdf.text('TRANSAKSI TERBARU (20 Terakhir)', 20, yPosition)
      
      yPosition += 10

      const recentTransactions = data.kasEntries
        .slice(-20)
        .map(entry => [
          formatDate(entry.tanggal),
          entry.jenis === 'masuk' ? 'Masuk' : 'Keluar',
          entry.kategori || '-',
          entry.keterangan.length > 30 ? entry.keterangan.substring(0, 30) + '...' : entry.keterangan,
          formatCurrency(entry.jumlah)
        ])

      pdf.autoTable({
        startY: yPosition,
        head: [['Tanggal', 'Jenis', 'Kategori', 'Keterangan', 'Jumlah']],
        body: recentTransactions,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 60 },
          4: { cellWidth: 35 }
        },
        margin: { left: 20 },
        styles: { fontSize: 8 }
      })

      const fileName = `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      pdf.save(fileName)

    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Gagal export PDF. Silakan coba lagi.')
    }
  }, [data, formatCurrency, formatDate, title, exportSimplePDF])

  const handleExport = useCallback(async () => {
    setIsExporting(true)
    
    try {
      switch (exportFormat) {
        case 'csv':
          exportCSV()
          break
        case 'excel':
          await exportExcel()
          break
        case 'pdf':
          await exportPDF()
          break
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Gagal melakukan export. Silakan coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }, [exportFormat, exportCSV, exportExcel, exportPDF])

  const exportOptions = [
    {
      value: 'excel',
      label: 'Excel (.xlsx)',
      icon: FileSpreadsheet,
      description: 'Format spreadsheet dengan multiple sheets dan formatting',
      color: 'text-green-600'
    },
    {
      value: 'pdf',
      label: 'PDF',
      icon: FileText,
      description: 'Format dokumen yang mudah dicetak dan dibagikan',
      color: 'text-red-600'
    },
    {
      value: 'csv',
      label: 'CSV',
      icon: File,
      description: 'Format sederhana yang kompatibel dengan semua aplikasi',
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="flex items-center space-x-4">
      <div className="flex space-x-2">
        {exportOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setExportFormat(option.value as any)}
            className={`p-2 rounded-lg border-2 transition-all duration-200 ${
              exportFormat === option.value
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            title={option.description}
          >
            <option.icon className={`h-4 w-4 ${option.color}`} />
          </button>
        ))}
      </div>

      <button
        onClick={handleExport}
        disabled={isExporting}
        className="btn-primary flex items-center space-x-2"
      >
        {isExporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        <span>
          Export {exportOptions.find(opt => opt.value === exportFormat)?.label}
        </span>
      </button>
    </div>
  )
})

export default AdvancedExport
