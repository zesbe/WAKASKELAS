'use client'

import { useState } from 'react'
import { QrCode, Link, MessageSquare, CreditCard, Loader2, CheckCircle, XCircle, Send, Copy } from 'lucide-react'
import { copyUrl } from '../lib/clipboard'

interface Student {
  id: number
  namaAnak: string
  namaPanggilan?: string
  namaWali: string
  noWhatsapp: string
  tagihan: number
  statusBayar: 'belum' | 'lunas'
  bulanTagihan: string
}

interface PaymentLinkData {
  studentId: number
  studentName: string
  parentName: string
  amount: number
  orderId: string
  paymentUrl: string
  whatsappMessage: string
  qrCodeUrl: string
}

interface PaymentLinkGeneratorProps {
  students: Student[]
  onRefresh: () => void
}

export default function PaymentLinkGenerator({ students, onRefresh }: PaymentLinkGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [generatedLinks, setGeneratedLinks] = useState<PaymentLinkData[]>([])
  const [sendResults, setSendResults] = useState<Record<number, 'success' | 'failed'>>({})

  const unpaidStudents = students.filter(s => s.statusBayar === 'belum')

  const handleSelectAll = () => {
    if (selectedStudents.length === unpaidStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(unpaidStudents.map(s => s.id))
    }
  }

  const handleSelectStudent = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    )
  }

  const generatePaymentLinks = async () => {
    if (selectedStudents.length === 0) return

    setIsGenerating(true)
    const links: PaymentLinkData[] = []

    try {
      for (const studentId of selectedStudents) {
        const response = await fetch('/api/payment/generate-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId })
        })

        if (response.ok) {
          const result = await response.json()
          links.push(result.data)
        }
      }

      setGeneratedLinks(links)
    } catch (error) {
      console.error('Error generating payment links:', error)
      alert('Gagal generate payment links')
    } finally {
      setIsGenerating(false)
    }
  }

  const sendWhatsAppMessage = async (link: PaymentLinkData) => {
    try {
      const student = students.find(s => s.id === link.studentId)
      if (!student) return false

      const response = await fetch('/api/whatsapp/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: student.noWhatsapp,
          message: link.whatsappMessage
        })
      })

      return response.ok
    } catch (error) {
      console.error('Error sending WhatsApp:', error)
      return false
    }
  }

  const sendBulkMessages = async () => {
    if (generatedLinks.length === 0) return

    setIsSending(true)
    const results: Record<number, 'success' | 'failed'> = {}

    for (const link of generatedLinks) {
      const success = await sendWhatsAppMessage(link)
      results[link.studentId] = success ? 'success' : 'failed'
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setSendResults(results)
    setIsSending(false)
    
    // Refresh parent data after sending
    setTimeout(() => {
      onRefresh()
    }, 2000)
  }


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center space-x-4 mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl">
            <CreditCard className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Generator Payment Link Otomatis</h2>
            <p className="text-gray-600">Buat dan kirim link pembayaran ke orang tua siswa secara otomatis</p>
          </div>
        </div>

        {/* Student Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Pilih Siswa ({unpaidStudents.length} belum bayar)
            </h3>
            <button
              onClick={handleSelectAll}
              className="btn-secondary text-sm"
            >
              {selectedStudents.length === unpaidStudents.length ? 'Batal Semua' : 'Pilih Semua'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpaidStudents.map((student) => (
              <div
                key={student.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedStudents.includes(student.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelectStudent(student.id)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded border-2 ${
                    selectedStudents.includes(student.id)
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedStudents.includes(student.id) && (
                      <CheckCircle className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{student.namaAnak}</p>
                    {student.namaPanggilan && (
                      <p className="text-xs text-blue-600">Panggilan: {student.namaPanggilan}</p>
                    )}
                    <p className="text-sm text-gray-600">{student.namaWali}</p>
                    <p className="text-sm font-medium text-blue-600">{formatCurrency(student.tagihan)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex space-x-4">
          <button
            onClick={generatePaymentLinks}
            disabled={selectedStudents.length === 0 || isGenerating}
            className="btn-primary flex-1"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <QrCode className="h-5 w-5 mr-2" />
                Generate {selectedStudents.length} Payment Link
              </>
            )}
          </button>

          {generatedLinks.length > 0 && (
            <button
              onClick={sendBulkMessages}
              disabled={isSending}
              className="btn-success flex-1"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Kirim ke {generatedLinks.length} WhatsApp
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Success Notification */}
      {generatedLinks.length > 0 && (
        <div className="card mb-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <h3 className="text-lg font-semibold text-green-800">Payment Links Berhasil Dibuat! 🎉</h3>
              <p className="text-green-700">
                {generatedLinks.length} link pembayaran siap dikirim ke orang tua siswa
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generated Links Display */}
      {generatedLinks.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Link Pembayaran yang Dibuat ({generatedLinks.length})
          </h3>

          <div className="space-y-4">
            {generatedLinks.map((link) => (
              <div key={link.studentId} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium text-gray-900">{link.studentName}</p>
                    {students.find(s => s.id === link.studentId)?.namaPanggilan && (
                      <p className="text-xs text-blue-600">
                        Panggilan: {students.find(s => s.id === link.studentId)?.namaPanggilan}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">{link.parentName}</p>
                    <p className="text-sm font-medium text-green-600">{formatCurrency(link.amount)}</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {sendResults[link.studentId] === 'success' && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                    {sendResults[link.studentId] === 'failed' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <button
                    onClick={() => copyUrl(link.paymentUrl)}
                    className="btn-secondary text-sm w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </button>
                  
                  <a
                    href={link.paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary text-sm w-full text-center"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Buka Payment
                  </a>
                  
                  <a
                    href={`https://wa.me/${students.find(s => s.id === link.studentId)?.noWhatsapp}?text=${encodeURIComponent(link.whatsappMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-whatsapp text-sm w-full text-center"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Manual WA
                  </a>
                </div>

                <div className="mt-3 p-3 bg-white rounded border">
                  <p className="text-xs text-gray-500 mb-1">Order ID:</p>
                  <p className="text-sm font-mono">{link.orderId}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
