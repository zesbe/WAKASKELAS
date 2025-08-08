'use client'

import { useState, useEffect, useMemo } from 'react'
import { Bell, Brain, Calendar, Clock, Users, Zap, Plus, Edit, Trash2, Play, Pause, Settings, BarChart3 } from 'lucide-react'
import { BreadcrumbNav, FloatingNav } from '../../components/Navigation'

interface SmartReminder {
  id: string
  name: string
  type: 'payment' | 'deadline' | 'follow_up' | 'custom'
  frequency: 'daily' | 'weekly' | 'monthly' | 'smart'
  status: 'active' | 'paused' | 'completed'
  conditions: {
    targetGroup: 'all' | 'unpaid' | 'overdue' | 'specific'
    timing: 'immediate' | 'scheduled' | 'smart'
    triggerDays: number[]
    maxReminders: number
  }
  message: {
    template: string
    personalized: boolean
    smartContent: boolean
  }
  analytics: {
    sent: number
    delivered: number
    responded: number
    effectiveness: number
  }
  aiInsights: {
    bestTime: string
    responseRate: number
    suggestions: string[]
  }
  nextRun: string
  createdAt: string
}

interface WaliMurid {
  id: number
  namaAnak: string
  namaWali: string
  noWhatsapp: string
  tagihan: number
  statusBayar: 'belum' | 'lunas'
  bulanTagihan: string
  tanggalBayar?: string
}

export default function SmartRemindersPage() {
  const [reminders, setReminders] = useState<SmartReminder[]>([])
  const [waliMurid, setWaliMurid] = useState<WaliMurid[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState<SmartReminder | null>(null)
  const [selectedView, setSelectedView] = useState<'list' | 'calendar' | 'analytics'>('list')
  const [isLoading, setIsLoading] = useState(true)

  const [formData, setFormData] = useState({
    name: '',
    type: 'payment' as SmartReminder['type'],
    frequency: 'smart' as SmartReminder['frequency'],
    targetGroup: 'unpaid' as SmartReminder['conditions']['targetGroup'],
    timing: 'smart' as SmartReminder['conditions']['timing'],
    triggerDays: [] as number[],
    maxReminders: 3,
    template: '',
    personalized: true,
    smartContent: true
  })

  useEffect(() => {
    loadData()
    loadReminders()
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/wali-murid')
      const data = await response.json()
      if (data.success) {
        setWaliMurid(data.waliMurid)
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadReminders = async () => {
    setIsLoading(true)
    try {
      // In a real app, this would fetch from API
      const mockReminders: SmartReminder[] = [
        {
          id: '1',
          name: 'Payment Reminder - Weekly',
          type: 'payment',
          frequency: 'weekly',
          status: 'active',
          conditions: {
            targetGroup: 'unpaid',
            timing: 'smart',
            triggerDays: [1, 3, 5], // Monday, Wednesday, Friday
            maxReminders: 3
          },
          message: {
            template: 'Reminder pembayaran kas kelas untuk {namaAnak}. Jumlah: {tagihan}. Mohon segera dilakukan pembayaran.',
            personalized: true,
            smartContent: true
          },
          analytics: {
            sent: 45,
            delivered: 43,
            responded: 12,
            effectiveness: 27.9
          },
          aiInsights: {
            bestTime: '09:00-11:00',
            responseRate: 28.5,
            suggestions: [
              'Tingkatkan personalisasi pesan',
              'Coba kirim di pagi hari (09:00-11:00)',
              'Tambahkan deadline yang jelas'
            ]
          },
          nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Follow-up Overdue',
          type: 'follow_up',
          frequency: 'smart',
          status: 'active',
          conditions: {
            targetGroup: 'overdue',
            timing: 'smart',
            triggerDays: [],
            maxReminders: 5
          },
          message: {
            template: 'Follow-up tagihan yang sudah melewati deadline. Mohon segera menghubungi bendahara untuk pengaturan pembayaran.',
            personalized: true,
            smartContent: true
          },
          analytics: {
            sent: 23,
            delivered: 22,
            responded: 8,
            effectiveness: 36.4
          },
          aiInsights: {
            bestTime: '14:00-16:00',
            responseRate: 35.2,
            suggestions: [
              'Berikan opsi pembayaran cicilan',
              'Sertakan kontak bendahara',
              'Gunakan tone yang lebih supportive'
            ]
          },
          nextRun: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }
      ]
      setReminders(mockReminders)
    } catch (error) {
      console.error('Error loading reminders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const aiSuggestions = useMemo(() => {
    const unpaidCount = waliMurid.filter(w => w.statusBayar === 'belum').length
    const totalCount = waliMurid.length
    const paymentRate = totalCount > 0 ? (totalCount - unpaidCount) / totalCount * 100 : 0

    const suggestions = []

    if (paymentRate < 70) {
      suggestions.push({
        type: 'urgent',
        title: 'Tingkat Pembayaran Rendah',
        description: `Hanya ${paymentRate.toFixed(1)}% siswa yang sudah membayar. Rekomendasikan reminder harian untuk 7 hari ke depan.`,
        action: 'Create Daily Reminder'
      })
    }

    if (unpaidCount > 10) {
      suggestions.push({
        type: 'info',
        title: 'Batch Reminder Suggested',
        description: `${unpaidCount} siswa belum membayar. Pertimbangkan kirim reminder batch dengan pesan yang dipersonalisasi.`,
        action: 'Create Batch Reminder'
      })
    }

    const currentHour = new Date().getHours()
    if (currentHour >= 9 && currentHour <= 11) {
      suggestions.push({
        type: 'success',
        title: 'Waktu Optimal untuk Reminder',
        description: 'Ini adalah waktu terbaik untuk mengirim reminder (response rate 35% lebih tinggi).',
        action: 'Send Now'
      })
    }

    return suggestions
  }, [waliMurid])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const newReminder: SmartReminder = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      frequency: formData.frequency,
      status: 'active',
      conditions: {
        targetGroup: formData.targetGroup,
        timing: formData.timing,
        triggerDays: formData.triggerDays,
        maxReminders: formData.maxReminders
      },
      message: {
        template: formData.template,
        personalized: formData.personalized,
        smartContent: formData.smartContent
      },
      analytics: {
        sent: 0,
        delivered: 0,
        responded: 0,
        effectiveness: 0
      },
      aiInsights: {
        bestTime: '09:00-11:00',
        responseRate: 0,
        suggestions: []
      },
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    }

    if (editingReminder) {
      setReminders(prev => prev.map(r => r.id === editingReminder.id ? { ...newReminder, id: editingReminder.id } : r))
    } else {
      setReminders(prev => [...prev, newReminder])
    }

    resetForm()
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'payment',
      frequency: 'smart',
      targetGroup: 'unpaid',
      timing: 'smart',
      triggerDays: [],
      maxReminders: 3,
      template: '',
      personalized: true,
      smartContent: true
    })
    setEditingReminder(null)
    setIsModalOpen(false)
  }

  const handleEdit = (reminder: SmartReminder) => {
    setEditingReminder(reminder)
    setFormData({
      name: reminder.name,
      type: reminder.type,
      frequency: reminder.frequency,
      targetGroup: reminder.conditions.targetGroup,
      timing: reminder.conditions.timing,
      triggerDays: reminder.conditions.triggerDays,
      maxReminders: reminder.conditions.maxReminders,
      template: reminder.message.template,
      personalized: reminder.message.personalized,
      smartContent: reminder.message.smartContent
    })
    setIsModalOpen(true)
  }

  const toggleReminderStatus = (id: string) => {
    setReminders(prev => prev.map(r => 
      r.id === id 
        ? { ...r, status: r.status === 'active' ? 'paused' : 'active' }
        : r
    ))
  }

  const deleteReminder = (id: string) => {
    if (confirm('Yakin ingin menghapus reminder ini?')) {
      setReminders(prev => prev.filter(r => r.id !== id))
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getStatusColor = (status: SmartReminder['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: SmartReminder['type']) => {
    switch (type) {
      case 'payment': return '💳'
      case 'deadline': return '⏰'
      case 'follow_up': return '📞'
      case 'custom': return '✨'
      default: return '📝'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading smart reminders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="header-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <BreadcrumbNav items={[{ label: 'Smart Reminders' }]} />
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold gradient-text">🧠 Smart Reminders</h1>
                <p className="text-sm sm:text-base text-secondary-600 font-medium mt-1 sm:mt-2">
                  AI-Powered Reminders
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buat Reminder
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <div className="card mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Brain className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {aiSuggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-2 ${
                    suggestion.type === 'urgent' ? 'bg-red-50 border-red-200' :
                    suggestion.type === 'success' ? 'bg-green-50 border-green-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <h4 className={`font-medium mb-2 ${
                    suggestion.type === 'urgent' ? 'text-red-800' :
                    suggestion.type === 'success' ? 'text-green-800' :
                    'text-blue-800'
                  }`}>
                    {suggestion.title}
                  </h4>
                  <p className={`text-sm mb-3 ${
                    suggestion.type === 'urgent' ? 'text-red-700' :
                    suggestion.type === 'success' ? 'text-green-700' :
                    'text-blue-700'
                  }`}>
                    {suggestion.description}
                  </p>
                  <button className={`text-sm font-medium ${
                    suggestion.type === 'urgent' ? 'text-red-600 hover:text-red-800' :
                    suggestion.type === 'success' ? 'text-green-600 hover:text-green-800' :
                    'text-blue-600 hover:text-blue-800'
                  }`}>
                    {suggestion.action} →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="card mb-8">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'list', label: 'List View', icon: Bell },
              { key: 'calendar', label: 'Calendar', icon: Calendar },
              { key: 'analytics', label: 'Analytics', icon: BarChart3 }
            ].map(view => (
              <button
                key={view.key}
                onClick={() => setSelectedView(view.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                  selectedView === view.key
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <view.icon className="h-4 w-4" />
                <span className="font-medium">{view.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List View */}
        {selectedView === 'list' && (
          <div className="space-y-6">
            {reminders.length === 0 ? (
              <div className="card text-center py-12">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada Smart Reminders</h3>
                <p className="text-gray-600 mb-4">Buat reminder pertama untuk mengotomatisasi komunikasi dengan orang tua siswa</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Buat Reminder Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="card">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getTypeIcon(reminder.type)}</div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{reminder.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(reminder.status)}`}>
                              {reminder.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {reminder.frequency === 'smart' ? '🧠 Smart' : reminder.frequency}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleReminderStatus(reminder.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          {reminder.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleEdit(reminder)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Target:</span>
                          <span className="ml-2 font-medium">{reminder.conditions.targetGroup}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Max Reminders:</span>
                          <span className="ml-2 font-medium">{reminder.conditions.maxReminders}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm text-gray-700 italic">"{reminder.message.template}"</p>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div>
                          <p className="text-gray-600">Sent</p>
                          <p className="font-semibold text-blue-600">{reminder.analytics.sent}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Delivered</p>
                          <p className="font-semibold text-green-600">{reminder.analytics.delivered}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Response Rate</p>
                          <p className="font-semibold text-purple-600">{reminder.analytics.effectiveness.toFixed(1)}%</p>
                        </div>
                      </div>

                      {reminder.aiInsights.suggestions.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">🧠 AI Insights:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {reminder.aiInsights.suggestions.slice(0, 2).map((suggestion, index) => (
                              <li key={index}>• {suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-gray-500">
                          Next run: {new Date(reminder.nextRun).toLocaleDateString('id-ID')}
                        </span>
                        <span className="text-xs text-blue-600">
                          Best time: {reminder.aiInsights.bestTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {selectedView === 'calendar' && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 Reminder Schedule</h3>
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-700">Calendar view akan menampilkan jadwal reminder dalam format kalender interaktif</p>
              <p className="text-sm text-blue-600 mt-2">Feature ini akan diimplementasikan dengan integrasi Google Calendar</p>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {selectedView === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card text-center">
                <Zap className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Total Reminders</h3>
                <p className="text-2xl font-bold text-blue-600">{reminders.length}</p>
              </div>
              <div className="card text-center">
                <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Avg Response Rate</h3>
                <p className="text-2xl font-bold text-green-600">
                  {reminders.length > 0 
                    ? (reminders.reduce((sum, r) => sum + r.analytics.effectiveness, 0) / reminders.length).toFixed(1)
                    : 0
                  }%
                </p>
              </div>
              <div className="card text-center">
                <Clock className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-900">Active Reminders</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {reminders.filter(r => r.status === 'active').length}
                </p>
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Performance Metrics</h3>
              <div className="space-y-4">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="border-l-4 border-blue-500 pl-4">
                    <h4 className="font-medium text-gray-900">{reminder.name}</h4>
                    <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600">Sent:</span>
                        <span className="ml-2 font-medium">{reminder.analytics.sent}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Delivered:</span>
                        <span className="ml-2 font-medium">{reminder.analytics.delivered}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Responded:</span>
                        <span className="ml-2 font-medium">{reminder.analytics.responded}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Effectiveness:</span>
                        <span className="ml-2 font-medium text-green-600">{reminder.analytics.effectiveness.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="bg-gradient-to-br from-purple-500 to-blue-500 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold gradient-text">
                  {editingReminder ? 'Edit Smart Reminder' : 'Buat Smart Reminder Baru'}
                </h3>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Reminder
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Payment Reminder - Weekly"
                    className="input-field"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipe Reminder
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="input-field"
                    >
                      <option value="payment">Payment Reminder</option>
                      <option value="deadline">Deadline Alert</option>
                      <option value="follow_up">Follow Up</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Frequency
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                      className="input-field"
                    >
                      <option value="smart">🧠 Smart (AI-powered)</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Target Group
                    </label>
                    <select
                      value={formData.targetGroup}
                      onChange={(e) => setFormData({ ...formData, targetGroup: e.target.value as any })}
                      className="input-field"
                    >
                      <option value="all">Semua Siswa</option>
                      <option value="unpaid">Belum Bayar</option>
                      <option value="overdue">Terlambat</option>
                      <option value="specific">Spesifik</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Reminders
                    </label>
                    <input
                      type="number"
                      value={formData.maxReminders}
                      onChange={(e) => setFormData({ ...formData, maxReminders: parseInt(e.target.value) })}
                      min="1"
                      max="10"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Pesan
                  </label>
                  <textarea
                    value={formData.template}
                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                    placeholder="Reminder pembayaran kas kelas untuk {namaAnak}..."
                    rows={4}
                    className="input-field resize-none"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Gunakan {'{namaAnak}'}, {'{namaWali}'}, {'{tagihan}'} untuk personalisasi
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.personalized}
                      onChange={(e) => setFormData({ ...formData, personalized: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Personalisasi Otomatis</span>
                  </label>

                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.smartContent}
                      onChange={(e) => setFormData({ ...formData, smartContent: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">🧠 AI Smart Content</span>
                  </label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingReminder ? 'Update Reminder' : 'Buat Reminder'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary flex-1"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <FloatingNav />
    </div>
  )
}
