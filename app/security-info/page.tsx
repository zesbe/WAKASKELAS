'use client'

import { Shield, Clock, RotateCcw, Activity, CheckCircle, AlertTriangle } from 'lucide-react'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'

export default function SecurityInfoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Security Information' }]} />
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">🛡️ Penjelasan Fitur Keamanan</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">
                  Memahami cara kerja perlindungan anti-banned
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Session Security */}
        <div className="card mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">1. 🕐 Session Security (Auto-Refresh)</h2>
              <p className="text-gray-600">Menjaga session tetap aman tanpa scan ulang</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">🎉 Cara Kerja (PERMANENT):</h3>
              <div className="space-y-2 text-green-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>Hari 1:</strong> Scan QR code SEKALI SAJA</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>Tiap 8 jam:</strong> Auto-refresh session (background)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>Selamanya:</strong> Session TIDAK PERNAH expire!</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>Kecuali:</strong> Logout manual atau ada error</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🚀 Keuntungan PERMANENT Session:</h3>
              <ul className="space-y-1 text-blue-800">
                <li>• <strong>SCAN QR CUMA SEKALI:</strong> Setup sekali, jalan selamanya!</li>
                <li>• <strong>Auto-refresh tiap 8 jam:</strong> Tetap fresh tanpa logout</li>
                <li>• <strong>TIDAK ADA BATAS WAKTU:</strong> Session berjalan terus</li>
                <li>• <strong>Zero maintenance:</strong> Tidak perlu action manual</li>
                <li>• <strong>Super user-friendly:</strong> Set and forget!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Idle Timeout */}
        <div className="card mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-100 p-3 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">2. 🛌 Auto-Disconnect Idle (60 Menit)</h2>
              <p className="text-gray-600">Simulasi aktivitas manusia yang natural</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">🤖 Mengapa WhatsApp Mendeteksi Bot?</h3>
              <ul className="space-y-1 text-yellow-800">
                <li>• <strong>Koneksi 24/7:</strong> Manusia normal tidak online terus</li>
                <li>• <strong>Tidak ada idle time:</strong> Bot tidak pernah "istirahat"</li>
                <li>• <strong>Aktivitas mekanis:</strong> Pola yang terlalu teratur</li>
              </ul>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">🧠 Simulasi Perilaku Manusia:</h3>
              <div className="space-y-2 text-green-800">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>0-60 menit:</strong> Aktif normal (kirim/terima pesan)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>60+ menit idle:</strong> Auto "istirahat" sebentar</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span><strong>Auto-reconnect:</strong> "Bangun" lagi otomatis</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">⚡ Yang Terjadi Saat Idle:</h3>
              <ol className="space-y-1 text-blue-800 list-decimal list-inside">
                <li>System kirim "presence update" untuk tetap hidup</li>
                <li>Jika gagal, baru disconnect sementara</li>
                <li>Auto-reconnect dalam beberapa detik</li>
                <li><strong>TIDAK perlu scan QR ulang!</strong></li>
              </ol>
            </div>
          </div>
        </div>

        {/* User Agent Rotation */}
        <div className="card mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-purple-100 p-3 rounded-lg">
              <RotateCcw className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">3. 🎭 User Agent Rotation</h2>
              <p className="text-gray-600">Menyamar sebagai browser yang berbeda-beda</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-900 mb-2">🔍 Cara WhatsApp Mendeteksi Bot:</h3>
              <ul className="space-y-1 text-red-800">
                <li>• <strong>User Agent sama terus:</strong> Browser identifier tidak berubah</li>
                <li>• <strong>Fingerprinting:</strong> Kombinasi browser + OS + versi yang sama</li>
                <li>• <strong>Pattern recognition:</strong> Perilaku yang terlalu konsisten</li>
              </ul>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">🎯 Contoh User Agent Rotation:</h3>
              <div className="space-y-3 text-sm">
                <div className="bg-white/50 p-3 rounded border">
                  <strong>Koneksi #1:</strong><br />
                  <code className="text-purple-700">WhatsApp Business + Chrome + 2.2323.4</code>
                </div>
                <div className="bg-white/50 p-3 rounded border">
                  <strong>Koneksi #2:</strong><br />
                  <code className="text-purple-700">WhatsApp Web + Firefox + 2.2323.4</code>
                </div>
                <div className="bg-white/50 p-3 rounded border">
                  <strong>Koneksi #3:</strong><br />
                  <code className="text-purple-700">WhatsApp Desktop + Electron + 2.2323.4</code>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">✅ Hasil User Agent Rotation:</h3>
              <ul className="space-y-1 text-green-800">
                <li>• <strong>WhatsApp bingung:</strong> Tidak bisa track pola yang konsisten</li>
                <li>• <strong>Terlihat natural:</strong> Seperti user yang ganti-ganti device</li>
                <li>• <strong>Fingerprinting gagal:</strong> Identitas berubah-ubah</li>
                <li>• <strong>Anti-detection:</strong> Algoritma WhatsApp tidak bisa lock pattern</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="card bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-purple-600" />
            🎯 Ringkasan Perlindungan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Session Fresh</h3>
              <p className="text-sm text-gray-600">Auto-refresh tiap 12 jam tanpa scan ulang</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Human-like</h3>
              <p className="text-sm text-gray-600">Simulasi perilaku manusia dengan idle time</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <RotateCcw className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Identity Shift</h3>
              <p className="text-sm text-gray-600">Ganti identitas browser setiap connect</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white/50 rounded-lg">
            <p className="text-center text-gray-700">
              <strong>🎉 HASIL AKHIR:</strong><br />
              ✅ Scan QR <strong>CUMA SEKALI</strong> - jalan selamanya!<br />
              ✅ Auto-refresh tiap 8 jam tanpa action manual<br />
              ✅ Risiko banned turun drastis dengan perlindungan berlapis!
            </p>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
