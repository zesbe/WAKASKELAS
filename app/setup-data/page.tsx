'use client'

import { useState } from 'react'
import { Database, CheckCircle, AlertCircle } from 'lucide-react'

export default function SetupDataPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean, message: string } | null>(null)

  const seedSampleData = async () => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/seed-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: 'Terjadi kesalahan saat menambah data contoh'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Data Contoh</h1>
          <p className="text-gray-600">Tambahkan data contoh pengeluaran dan pemasukan untuk testing</p>
        </div>

        {result && (
          <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
            result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {result.success ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="text-sm">{result.message}</span>
          </div>
        )}

        <button
          onClick={seedSampleData}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Menambah Data...' : 'Tambah Data Contoh'}
        </button>

        <div className="mt-6 text-center">
          <a 
            href="/"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            ← Kembali ke Dashboard
          </a>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p className="mb-2"><strong>Data yang akan ditambahkan:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>3 data pemasukan (iuran bulanan, donasi)</li>
            <li>6 data pengeluaran (alat tulis, kebersihan, konsumsi, dll)</li>
            <li>Berbagai kategori untuk testing filter</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
