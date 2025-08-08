'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, Users, MessageSquare, TrendingUp, Eye, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { FloatingNav } from '../../components/Navigation'

interface Campaign {
  id: number
  name: string
  message: string
  targetCount: number
  sentCount: number
  status: 'draft' | 'sending' | 'completed' | 'failed'
  createdAt: string
  sentAt?: string
}

interface Stats {
  totalContacts: number
  totalCampaigns: number
  totalMessages: number
  successfulMessages: number
  successRate: number
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [stats, setStats] = useState<Stats>({
    totalContacts: 0,
    totalCampaigns: 0,
    totalMessages: 0,
    successfulMessages: 0,
    successRate: 0
  })
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)

  useEffect(() => {
    loadCampaigns()
    loadStats()
  }, [])

  const loadCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns')
      const data = await response.json()
      if (data.success) {
        setCampaigns(data.campaigns)
      }
    } catch (error) {
      console.error('Error loading campaigns:', error)
    }
  }

  const loadStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const data = await response.json()
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const deleteCampaign = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus campaign ini?')) return

    try {
      const response = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (response.ok) {
        loadCampaigns()
        loadStats()
      }
    } catch (error) {
      console.error('Error deleting campaign:', error)
    }
  }

  const getStatusBadge = (status: Campaign['status']) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      sending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Mengirim' },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Gagal' }
    }
    
    const config = statusConfig[status]
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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
              <h1 className="text-xl font-bold text-gray-900">Campaign Manager</h1>
              <p className="text-sm text-gray-600">Kelola dan analisis campaign broadcast Anda</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Kontak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalContacts}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="bg-whatsapp-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-whatsapp-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Campaign</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pesan Terkirim</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successfulMessages}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="card">
            <Link href="/broadcast" className="btn-primary w-full text-center">
              Campaign Baru
            </Link>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Riwayat Campaign</h2>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Belum ada campaign</p>
              <p className="text-sm text-gray-400 mt-1">Buat campaign pertama Anda untuk mulai broadcast</p>
              <Link href="/broadcast" className="btn-primary mt-4 inline-block">
                Buat Campaign
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Campaign
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Target/Terkirim
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {campaign.message}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(campaign.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {campaign.sentCount} / {campaign.targetCount}
                        {campaign.targetCount > 0 && (
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-whatsapp-600 h-2 rounded-full" 
                              style={{ width: `${(campaign.sentCount / campaign.targetCount) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(campaign.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => setSelectedCampaign(campaign)}
                          className="text-whatsapp-600 hover:text-whatsapp-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteCampaign(campaign.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Campaign Detail Modal */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Detail Campaign
                  </h3>
                  <button
                    onClick={() => setSelectedCampaign(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nama Campaign</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedCampaign.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedCampaign.status)}</div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Pesan</label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm text-gray-900 whitespace-pre-wrap">
                      {selectedCampaign.message}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Target</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedCampaign.targetCount} kontak</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Terkirim</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedCampaign.sentCount} kontak</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Dibuat</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCampaign.createdAt)}</p>
                  </div>
                  
                  {selectedCampaign.sentAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Dikirim</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedCampaign.sentAt)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Navigation */}
      <FloatingNav />
    </div>
  )
}
