'use client'

import { useState, useEffect } from 'react'
import { Copy, Globe, CheckCircle, XCircle, RefreshCw, Settings, Link as LinkIcon } from 'lucide-react'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'
import { copyUrl } from '../../lib/clipboard'

export default function WebhookConfigPage() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [isWebhookActive, setIsWebhookActive] = useState(false)
  const [lastWebhookCall, setLastWebhookCall] = useState<string | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Set webhook URL based on current domain (client-side only)
    if (typeof window !== 'undefined') {
      const currentDomain = window.location.origin
      setWebhookUrl(`${currentDomain}/api/payment/webhook`)
    }

    checkWebhookStatus()
  }, [])

  const checkWebhookStatus = async () => {
    setIsChecking(true)
    try {
      const response = await fetch('/api/payment/webhook')
      if (response.ok) {
        const data = await response.json()
        setIsWebhookActive(true)
        setLastWebhookCall(data.timestamp)
      } else {
        setIsWebhookActive(false)
      }
    } catch (error) {
      setIsWebhookActive(false)
    } finally {
      setIsChecking(false)
    }
  }


  const testWebhook = async () => {
    try {
      const testPayload = {
        amount: 50000,
        order_id: "TEST_WEBHOOK_" + Date.now(),
        project: "uang-kas-kelas-1-ibnu-sina",
        status: "completed",
        payment_method: "qris",
        completed_at: new Date().toISOString()
      }

      const response = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      })

      if (response.ok) {
        alert('Test webhook berhasil! (Ini hanya test, tidak akan mempengaruhi data real)')
      } else {
        alert('Test webhook gagal!')
      }
    } catch (error) {
      alert('Error saat test webhook')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Webhook Configuration' }]} />
            <h1 className="text-xl sm:text-3xl font-bold gradient-text">Webhook Configuration</h1>
            <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">
              Payment Gateway Integration
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Webhook Status */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Status Webhook</h2>
            <button
              onClick={checkWebhookStatus}
              disabled={isChecking}
              className="btn-secondary flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Check Status</span>
            </button>
          </div>

          <div className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50">
            {isWebhookActive ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <p className={`font-semibold ${isWebhookActive ? 'text-green-700' : 'text-red-700'}`}>
                {isWebhookActive ? 'Webhook Aktif ✅' : 'Webhook Tidak Aktif ❌'}
              </p>
              <p className="text-sm text-gray-600">
                {lastWebhookCall 
                  ? `Last checked: ${new Date(lastWebhookCall).toLocaleString('id-ID')}` 
                  : 'Belum pernah dicek'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook URL</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL untuk Pakasir Webhook:
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="input-field flex-1 font-mono text-sm bg-gray-50"
                />
                <button
                  onClick={() => copyUrl(webhookUrl)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start space-x-3">
                <LinkIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900">Cara Setup Webhook di Pakasir:</h3>
                  <ol className="mt-2 text-sm text-blue-800 space-y-1">
                    <li>1. Login ke dashboard Pakasir.zone.id</li>
                    <li>2. Masuk ke project "uang-kas-kelas-1-ibnu-sina"</li>
                    <li>3. Buka menu Settings → Webhook</li>
                    <li>4. Paste URL webhook di atas</li>
                    <li>5. Set method: POST</li>
                    <li>6. Save dan test webhook</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Information */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Project</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Slug:</label>
              <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                uang-kas-kelas-1-ibnu-sina
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Key:</label>
              <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                u8e0CphRmRVuNwDyqnfNoeOwHa6UBpLg
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Redirect URL:</label>
              <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm">
                https://kasibnusina.vercel.app/
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment URL Format:</label>
              <div className="p-3 bg-gray-50 rounded-lg font-mono text-sm text-xs">
                pakasir.zone.id/pay/[slug]/[amount]?order_id=[id]&qris_only=1
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Features */}
        <div className="card mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fitur Webhook Otomatis</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-green-700">✅ Yang Dilakukan Otomatis:</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Update status pembayaran siswa menjadi "Lunas"</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Tambah transaksi pemasukan ke kas kelas</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Kirim konfirmasi WhatsApp ke orang tua</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Log semua transaksi pembayaran</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Update laporan keuangan real-time</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-blue-700">🔄 Format Data Webhook:</h3>
              <div className="p-3 bg-gray-50 rounded-lg">
                <pre className="text-xs text-gray-700 overflow-x-auto">
{`{
  "amount": 50000,
  "order_id": "STUDENT_1_1234567890",
  "project": "uang-kas-kelas-1-ibnu-sina",
  "status": "completed",
  "payment_method": "qris",
  "completed_at": "2024-01-15T10:30:00Z"
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Webhook</h2>
          <p className="text-sm text-gray-600 mb-4">
            Test webhook endpoint untuk memastikan berfungsi dengan baik.
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={testWebhook}
              className="btn-warning flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Test Webhook (Safe)</span>
            </button>
            
            <button
              onClick={() => window.open('/api/payment/webhook', '_blank')}
              className="btn-secondary flex items-center space-x-2"
            >
              <Globe className="h-4 w-4" />
              <span>Check Endpoint</span>
            </button>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
