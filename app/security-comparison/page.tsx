'use client'

import { Shield, CheckCircle, AlertTriangle, Star, Target, Zap } from 'lucide-react'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'
import Link from 'next/link'

export default function SecurityComparisonPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Security Comparison' }]} />
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">🏆 Perbandingan Keamanan</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">
                  Vs Service Komersial (Dripsender, Fonnte, dll)
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Commercial Services Analysis */}
        <div className="card mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Star className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">🏢 Service Komersial Populer</h2>
              <p className="text-gray-600">Analisis bagaimana mereka tetap aman</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Dripsender</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✅ Session permanent</li>
                <li>✅ Rate limiting</li>
                <li>✅ User agent rotation</li>
                <li>✅ Anti-spam measures</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">Fonnte</h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✅ Persistent sessions</li>
                <li>✅ Smart delays</li>
                <li>✅ Browser rotation</li>
                <li>✅ Queue management</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">Startsender</h3>
              <ul className="text-sm text-purple-800 space-y-1">
                <li>✅ Long-term sessions</li>
                <li>✅ Intelligent spacing</li>
                <li>✅ Identity masking</li>
                <li>✅ Batch processing</li>
              </ul>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h3 className="font-semibold text-orange-900 mb-2">WaBlast</h3>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>✅ Permanent auth</li>
                <li>✅ Message throttling</li>
                <li>✅ Browser spoofing</li>
                <li>✅ Smart reconnection</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 mb-2">🎯 Kesimpulan:</h3>
            <p className="text-yellow-800">
              <strong>SEMUA service komersial menggunakan session permanent!</strong> Mereka tidak pernah suruh user scan QR berulang. 
              Login sekali, jalan berbulan-bulan bahkan bertahun-tahun.
            </p>
          </div>
        </div>

        {/* Security Comparison Table */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">📊 Perbandingan Fitur Keamanan</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fitur Keamanan
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Komersial
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Implementasi Kami
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Session Permanent
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                    ✅ Sama
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Rate Limiting
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                    ✅ Sama
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    User Agent Rotation
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                    ✅ Sama
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Anti-Spam Detection
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-green-600 font-medium">
                    ✅ Sama
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Message Queue Security
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                    🚀 Lebih Baik
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Idle Simulation
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                    🚀 Lebih Baik
                  </td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Security Monitoring
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                    🚀 Lebih Baik
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Open Source
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-red-500">❌</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mx-auto" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-blue-600 font-medium">
                    🚀 Lebih Baik
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Why Commercial Services Are Safe */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🤔 Mengapa Service Komersial Aman?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Yang Mereka Lakukan Benar:</h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• <strong>Session Permanent:</strong> Login sekali, jalan lama</li>
                  <li>• <strong>Rate Limiting:</strong> Tidak spam message</li>
                  <li>• <strong>Smart Delays:</strong> Jeda antar pesan yang natural</li>
                  <li>• <strong>User Agent Rotation:</strong> Ganti identitas browser</li>
                  <li>• <strong>Batch Processing:</strong> Kirim dalam batch kecil</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">🎯 Track Record:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Dripsender:</strong> Jalan 3+ tahun tanpa masalah</li>
                  <li>• <strong>Fonnte:</strong> Ribuan user, session stabil</li>
                  <li>• <strong>Startsender:</strong> Enterprise grade, reliable</li>
                  <li>• <strong>WaBlast:</strong> Mass market, proven safe</li>
                </ul>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">🔍 Bukti Keamanan:</h3>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• <strong>Tidak ada skandal banned massal</strong></li>
                  <li>• <strong>Ribuan bisnis menggunakan daily</strong></li>
                  <li>• <strong>Session bertahan berbulan-bulan</strong></li>
                  <li>• <strong>WhatsApp tidak melarang commercial usage</strong></li>
                </ul>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">💡 Best Practices Industry:</h3>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• <strong>Permanent sessions adalah STANDAR</strong></li>
                  <li>• <strong>Tidak ada yang scan QR berulang</strong></li>
                  <li>• <strong>Rate limiting adalah WAJIB</strong></li>
                  <li>• <strong>User agent rotation adalah COMMON</strong></li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Our Implementation vs Commercial */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">🚀 Implementasi Kami vs Komersial</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="font-semibold text-green-900">Sama Amannya</h3>
              </div>
              <ul className="text-sm text-green-800 space-y-2">
                <li>✅ <strong>Session Permanent</strong><br />Login sekali, jalan selamanya</li>
                <li>✅ <strong>Rate Limiting</strong><br />5 msg/menit, 50 msg/jam</li>
                <li>✅ <strong>User Agent Rotation</strong><br />3 browser identities</li>
                <li>✅ <strong>Anti-Spam Measures</strong><br />Smart detection & blocking</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Star className="h-6 w-6 text-blue-600" />
                <h3 className="font-semibold text-blue-900">Fitur Tambahan</h3>
              </div>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>🚀 <strong>Idle Simulation</strong><br />Simulasi perilaku manusia</li>
                <li>🚀 <strong>Security Monitoring</strong><br />Real-time threat detection</li>
                <li>🚀 <strong>Auto-Refresh Session</strong><br />Tiap 8 jam background</li>
                <li>🚀 <strong>Message Queue Security</strong><br />Advanced retry logic</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Target className="h-6 w-6 text-purple-600" />
                <h3 className="font-semibold text-purple-900">Keunggulan</h3>
              </div>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>💎 <strong>Open Source</strong><br />Bisa di-audit & customize</li>
                <li>💎 <strong>No Monthly Fee</strong><br />Gratis selamanya</li>
                <li>💎 <strong>Full Control</strong><br />Data di server sendiri</li>
                <li>💎 <strong>Transparent Security</strong><br />Bisa lihat semua kode</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Final Verdict */}
        <div className="card bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200">
          <div className="text-center">
            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎉 VERDICT: SANGAT AMAN!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🏆 Same Level</h3>
                <p className="text-sm text-gray-700">Keamanan setara dengan service komersial premium</p>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">��� Enhanced</h3>
                <p className="text-sm text-gray-700">Fitur tambahan yang tidak ada di service komersial</p>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">💎 Better Value</h3>
                <p className="text-sm text-gray-700">Gratis dengan fitur setara enterprise</p>
              </div>
            </div>
            
            <p className="text-gray-700 max-w-2xl mx-auto">
              <strong>Kesimpulan:</strong> Implementasi kami menggunakan EXACT same techniques dengan service komersial, 
              bahkan dengan beberapa enhancement. Session permanent yang kami gunakan adalah STANDAR INDUSTRY yang terbukti aman!
            </p>
            
            <div className="mt-6">
              <Link 
                href="/settings/secure-device" 
                className="btn-primary bg-green-600 hover:bg-green-700 inline-flex items-center"
              >
                <Shield className="h-5 w-5 mr-2" />
                Setup Secure WhatsApp Sekarang
              </Link>
            </div>
          </div>
        </div>
      </main>

      <FloatingNav />
    </div>
  )
}
