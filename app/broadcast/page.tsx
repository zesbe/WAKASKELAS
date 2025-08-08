'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Users, Send, Upload, Download } from 'lucide-react'
import Link from 'next/link'
import { FloatingNav } from '../../components/Navigation'

interface Contact {
  id: number
  jid: string
  name: string
  phone?: string
  selected?: boolean
}

export default function BroadcastPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      const data = await response.json()
      if (data.success) {
        setContacts(data.contacts)
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (contact.phone && contact.phone.includes(searchQuery))
  )

  const handleSelectContact = (jid: string) => {
    setSelectedContacts(prev => 
      prev.includes(jid) 
        ? prev.filter(id => id !== jid)
        : [...prev, jid]
    )
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(filteredContacts.map(c => c.jid))
    }
  }

  const handleSendBroadcast = async () => {
    if (!message.trim() || selectedContacts.length === 0) {
      alert('Harap isi pesan dan pilih minimal 1 kontak')
      return
    }

    setIsSending(true)
    try {
      const response = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: campaignName || `Broadcast ${new Date().toLocaleDateString()}`,
          message,
          contacts: selectedContacts
        })
      })

      const data = await response.json()
      if (data.success) {
        alert(`Broadcast berhasil dikirim ke ${data.result.success} kontak!`)
        setMessage('')
        setCampaignName('')
        setSelectedContacts([])
      } else {
        alert('Gagal mengirim broadcast: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending broadcast:', error)
      alert('Terjadi kesalahan saat mengirim broadcast')
    } finally {
      setIsSending(false)
    }
  }

  const importContacts = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    const newContacts = lines.map((line, index) => {
      const [name, phone] = line.split(',').map(s => s.trim())
      return { name: name || `Contact ${index + 1}`, phone }
    }).filter(contact => contact.phone)

    try {
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts: newContacts })
      })

      const data = await response.json()
      if (data.success) {
        alert(`Berhasil import ${data.imported} kontak`)
        loadContacts()
      }
    } catch (error) {
      console.error('Error importing contacts:', error)
      alert('Gagal import kontak')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/" className="flex items-center space-x-3 text-gray-700 hover:text-gray-900">
              <ArrowLeft className="h-5 w-5" />
              <span>Kembali</span>
            </Link>
            <div className="ml-6">
              <h1 className="text-xl font-bold text-gray-900">Broadcast Pesan</h1>
              <p className="text-sm text-gray-600">Kirim pesan ke banyak kontak sekaligus</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Message Composer */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Tulis Pesan</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Campaign
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Contoh: Promo Ramadan 2024"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pesan Broadcast
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tulis pesan Anda di sini..."
                    rows={8}
                    className="input-field resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {message.length} karakter
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Tips Pesan Efektif:</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Gunakan nama pelanggan untuk personalisasi</li>
                    <li>• Sertakan call-to-action yang jelas</li>
                    <li>• Hindari teks yang terlalu panjang</li>
                    <li>• Pastikan informasi kontak/alamat tersedia</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Ringkasan</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Kontak Dipilih:</span>
                  <span className="font-medium">{selectedContacts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimasi Waktu:</span>
                  <span className="font-medium">{Math.ceil(selectedContacts.length * 2 / 60)} menit</span>
                </div>
              </div>
              
              <button
                onClick={handleSendBroadcast}
                disabled={!message.trim() || selectedContacts.length === 0 || isSending}
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
                    <span>Kirim Broadcast</span>
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Contact Selection */}
          <div className="space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Pilih Kontak</h2>
                <div className="flex space-x-2">
                  <label className="btn-secondary cursor-pointer text-xs">
                    <Upload className="h-4 w-4 mr-1" />
                    Import CSV
                    <input
                      type="file"
                      accept=".csv,.txt"
                      onChange={importContacts}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kontak..."
                  className="input-field"
                />

                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-whatsapp-600 focus:ring-whatsapp-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Pilih Semua ({filteredContacts.length})
                    </span>
                  </label>
                  <span className="text-xs text-gray-500">
                    {selectedContacts.length} dipilih
                  </span>
                </div>

                <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                  {filteredContacts.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Belum ada kontak</p>
                      <p className="text-xs mt-1">Import atau sinkronisasi WhatsApp untuk menambah kontak</p>
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {filteredContacts.map((contact) => (
                        <label
                          key={contact.jid}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.jid)}
                            onChange={() => handleSelectContact(contact.jid)}
                            className="rounded border-gray-300 text-whatsapp-600 focus:ring-whatsapp-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contact.name}
                            </p>
                            {contact.phone && (
                              <p className="text-xs text-gray-500">{contact.phone}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Template Pesan */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Pesan</h3>
              <div className="space-y-2">
                {[
                  'Halo! Kami punya promo spesial untuk Anda. Diskon 20% untuk semua produk! Info: wa.me/6281234567890',
                  'Selamat pagi! Jangan lewatkan flash sale hari ini. Gratis ongkir ke seluruh Indonesia!',
                  'Reminder: Pesanan Anda sudah siap diambil. Terima kasih sudah berbelanja di toko kami!'
                ].map((template, index) => (
                  <button
                    key={index}
                    onClick={() => setMessage(template)}
                    className="text-left w-full p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
