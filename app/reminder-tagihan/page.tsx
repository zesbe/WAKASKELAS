'use client'

import { useState, useEffect, memo, useCallback, useMemo } from 'react'
import { Send, Users, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
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
  bulanTagihan: string
}

const WaliMuridItem = memo(function WaliMuridItem({ 
  wali, 
  isSelected, 
  onSelect,
  formatCurrency,
  formatWhatsApp
}: {
  wali: WaliMurid
  isSelected: boolean
  onSelect: (noWhatsapp: string) => void
  formatCurrency: (amount: number) => string
  formatWhatsApp: (phone: string) => string
}) {
  const handleSelect = useCallback(() => {
    onSelect(wali.noWhatsapp)
  }, [onSelect, wali.noWhatsapp])

  return (
    <label className="flex items-center space-x-3 p-3 rounded hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={handleSelect}
        className="rounded border-gray-300 text-whatsapp-600 focus:ring-whatsapp-500"
      />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {wali.namaAnak}
            </p>
            {wali.namaPanggilan && (
              <p className="text-xs text-blue-600">Panggilan: {wali.namaPanggilan}</p>
            )}
            <p className="text-xs text-gray-600">{wali.namaWali}</p>
            <p className="text-xs text-gray-500">{formatWhatsApp(wali.noWhatsapp)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-red-600">
              {formatCurrency(wali.tagihan)}
            </p>
            <p className="text-xs text-gray-500">{wali.bulanTagihan}</p>
          </div>
        </div>
      </div>
    </label>
  )
})

const MessagePreview = memo(function MessagePreview({ 
  message, 
  selectedWali, 
  waliMurid, 
  personalizeMessage 
}: {
  message: string
  selectedWali: string[]
  waliMurid: WaliMurid[]
  personalizeMessage: (template: string, wali: WaliMurid) => string
}) {
  const previewWali = useMemo(() => {
    return waliMurid.find(w => selectedWali.includes(w.noWhatsapp))
  }, [waliMurid, selectedWali])

  if (!previewWali) return null

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview Pesan</h3>
      <div className="bg-gray-50 p-4 rounded-lg text-sm">
        <p className="text-gray-600 mb-2">Contoh untuk: {previewWali.namaWali}</p>
        <div className="bg-white p-3 rounded border-l-4 border-whatsapp-500 whitespace-pre-wrap text-gray-900">
          {personalizeMessage(message, previewWali)}
        </div>
      </div>
    </div>
  )
})

const ReminderSummary = memo(function ReminderSummary({
  selectedWali,
  waliMurid,
  formatCurrency
}: {
  selectedWali: string[]
  waliMurid: WaliMurid[]
  formatCurrency: (amount: number) => string
}) {
  const summary = useMemo(() => {
    const selectedWaliData = waliMurid.filter(w => selectedWali.includes(w.noWhatsapp))
    const totalTagihan = selectedWaliData.reduce((sum, w) => sum + w.tagihan, 0)
    const estimatedTime = Math.ceil(selectedWali.length * 2 / 60)
    
    return {
      count: selectedWali.length,
      totalTagihan,
      estimatedTime
    }
  }, [selectedWali, waliMurid])

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span className="text-gray-600">Wali Dipilih:</span>
        <span className="font-medium">{summary.count}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Total Tagihan:</span>
        <span className="font-medium">{formatCurrency(summary.totalTagihan)}</span>
      </div>
      <div className="flex justify-between">
        <span className="text-gray-600">Estimasi Waktu:</span>
        <span className="font-medium">{summary.estimatedTime} menit</span>
      </div>
    </div>
  )
})

export default function ReminderTagihanPage() {
  const [waliMurid, setWaliMurid] = useState<WaliMurid[]>([])
  const [selectedWali, setSelectedWali] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  const defaultMessage = useMemo(() => `Assalamu'alaikum Bapak/Ibu {namaWali},

Kami dari bendahara kelas 1 Ibnu Sina ingin mengingatkan tentang tagihan kas kelas:

👤 Nama Anak: {namaAnak}
📅 Bulan: {bulanTagihan}
💰 Jumlah: {tagihan}

Mohon untuk segera melakukan pembayaran kas kelas. Terima kasih atas perhatiannya.

Wassalamu'alaikum
Bendahara Kelas 1 Ibnu Sina`, [])

  useEffect(() => {
    loadWaliMurid()
    checkWhatsAppStatus()
    setMessage(defaultMessage)
  }, [defaultMessage])

  const loadWaliMurid = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/wali-murid', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.success) {
        const belumBayar = data.waliMurid.filter((w: WaliMurid) => w.statusBayar === 'belum')
        setWaliMurid(belumBayar)
        setSelectedWali(belumBayar.map((w: WaliMurid) => w.noWhatsapp))
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Load wali murid request timed out')
      } else {
        console.error('Error loading wali murid:', (error as Error).message)
      }
    }
  }, [])

  const checkWhatsAppStatus = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/whatsapp/status', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        setIsConnected(data.isConnected || false)
      } else {
        console.log('WhatsApp status check failed:', response.status)
        setIsConnected(false)
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('WhatsApp status check timed out')
      } else {
        console.error('Error checking WhatsApp status:', (error as Error).message)
      }
      setIsConnected(false)
    }
  }, [])

  const handleSelectWali = useCallback((noWhatsapp: string) => {
    setSelectedWali(prev => 
      prev.includes(noWhatsapp) 
        ? prev.filter(id => id !== noWhatsapp)
        : [...prev, noWhatsapp]
    )
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedWali.length === waliMurid.length) {
      setSelectedWali([])
    } else {
      setSelectedWali(waliMurid.map(w => w.noWhatsapp))
    }
  }, [selectedWali.length, waliMurid])

  const personalizeMessage = useCallback((template: string, wali: WaliMurid) => {
    return template
      .replace('{namaWali}', wali.namaWali)
      .replace('{namaAnak}', wali.namaAnak)
      .replace('{bulanTagihan}', wali.bulanTagihan)
      .replace('{tagihan}', formatCurrency(wali.tagihan))
  }, [])

  const handleSendReminder = useCallback(async () => {
    if (!message.trim() || selectedWali.length === 0) {
      alert('Harap isi pesan dan pilih minimal 1 wali murid')
      return
    }

    if (!isConnected) {
      alert('WhatsApp belum terhubung. Silakan setup device terlebih dahulu.')
      return
    }

    setIsSending(true)
    try {
      const messages = waliMurid
        .filter(wali => selectedWali.includes(wali.noWhatsapp))
        .map(wali => ({
          jid: wali.noWhatsapp + '@s.whatsapp.net',
          message: personalizeMessage(message, wali),
          wali: wali
        }))

      const response = await fetch('/api/reminder-secure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      })

      const data = await response.json()
      if (data.success) {
        alert(`Reminder berhasil dikirim ke ${data.result.success} wali murid!`)
        loadWaliMurid()
      } else {
        alert('Gagal mengirim reminder: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending reminder:', error)
      alert('Terjadi kesalahan saat mengirim reminder')
    } finally {
      setIsSending(false)
    }
  }, [message, selectedWali, isConnected, waliMurid, personalizeMessage, loadWaliMurid])

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }, [])

  const formatWhatsApp = useCallback((phone: string) => {
    if (phone.startsWith('62')) {
      return '0' + phone.substring(2)
    }
    return phone
  }, [])

  const breadcrumbItems = useMemo(() => [
    { label: 'Data Wali Murid', href: '/wali-murid' },
    { label: 'Reminder Tagihan' }
  ], [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={breadcrumbItems} />
            <h1 className="text-xl sm:text-3xl font-bold gradient-text">Reminder Tagihan Kas Kelas</h1>
            <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">WhatsApp Reminder System</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isConnected && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <XCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-900">🛡️ Secure WhatsApp Required</h3>
                <p className="text-sm text-purple-700">
                  Gunakan koneksi WhatsApp yang aman untuk menghindari banned
                </p>
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-purple-800 mb-2">Keamanan Berlapis:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-purple-700">
                <div>✅ Rate limiting protection</div>
                <div>✅ Anti-spam detection</div>
                <div>✅ Message queue security</div>
                <div>✅ User agent rotation</div>
              </div>
            </div>
            <Link
              href="/settings/secure-device"
              className="btn-primary bg-purple-600 hover:bg-purple-700 inline-flex items-center"
            >
              <span>Setup Secure WhatsApp Connection</span>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Template Pesan Reminder</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pesan Reminder
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis pesan reminder..."
                    rows={12}
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gunakan placeholder: {'{namaWali}'}, {'{namaAnak}'}, {'{bulanTagihan}'}, {'{tagihan}'}
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Tips Pesan Efektif:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Gunakan salam dan nama wali untuk personalisasi</li>
                    <li>• Sebutkan nama anak dan detail tagihan</li>
                    <li>• Gunakan bahasa yang sopan dan informatif</li>
                    <li>• Sertakan informasi kontak bendahara jika diperlukan</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan Pengiriman</h2>
              <ReminderSummary 
                selectedWali={selectedWali}
                waliMurid={waliMurid}
                formatCurrency={formatCurrency}
              />
              
              <button
                onClick={handleSendReminder}
                disabled={!message.trim() || selectedWali.length === 0 || isSending || !isConnected}
                className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Mengirim...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <Send className="h-4 w-4" />
                    <span>Kirim Reminder</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pilih Wali Murid</h2>
                <span className="text-sm text-gray-500">
                  {waliMurid.length} wali belum bayar
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedWali.length === waliMurid.length && waliMurid.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-whatsapp-600 focus:ring-whatsapp-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Pilih Semua ({waliMurid.length})
                    </span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {selectedWali.length} dipilih
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {waliMurid.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Semua wali murid sudah bayar!</p>
                      <p className="text-xs mt-1">Tidak ada tagihan yang perlu diingatkan</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {waliMurid.map((wali) => (
                        <WaliMuridItem
                          key={wali.id}
                          wali={wali}
                          isSelected={selectedWali.includes(wali.noWhatsapp)}
                          onSelect={handleSelectWali}
                          formatCurrency={formatCurrency}
                          formatWhatsApp={formatWhatsApp}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedWali.length > 0 && (
              <MessagePreview 
                message={message}
                selectedWali={selectedWali}
                waliMurid={waliMurid}
                personalizeMessage={personalizeMessage}
              />
            )}
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
