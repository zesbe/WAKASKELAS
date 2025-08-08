'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  Zap, Plus, Search, Calculator, Send, Download, 
  Users, Clock, TrendingUp, MessageSquare, CreditCard,
  Keyboard, Command, X, ArrowRight, Sparkles
} from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Shortcut {
  id: string
  label: string
  description: string
  icon: React.ComponentType<any>
  action: () => void
  keywords: string[]
  category: 'navigation' | 'action' | 'calculation' | 'data'
  keybinding?: string
  color: string
}

interface SmartShortcutsProps {
  onClose?: () => void
}

export default function SmartShortcuts({ onClose }: SmartShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentShortcuts, setRecentShortcuts] = useState<string[]>([])
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  const shortcuts: Shortcut[] = [
    // Navigation shortcuts
    {
      id: 'nav-analytics',
      label: 'Open Analytics',
      description: 'Advanced analytics dashboard with insights',
      icon: TrendingUp,
      action: () => router.push('/analytics'),
      keywords: ['analytics', 'dashboard', 'insights', 'reports', 'data'],
      category: 'navigation',
      keybinding: 'Ctrl+A',
      color: 'text-purple-600'
    },
    {
      id: 'nav-smart-reminders',
      label: 'Smart Reminders',
      description: 'AI-powered reminder management',
      icon: MessageSquare,
      action: () => router.push('/smart-reminders'),
      keywords: ['reminder', 'ai', 'smart', 'automation', 'schedule'],
      category: 'navigation',
      keybinding: 'Ctrl+R',
      color: 'text-blue-600'
    },
    {
      id: 'nav-payment-center',
      label: 'Payment Center',
      description: 'Manage payment links and transactions',
      icon: CreditCard,
      action: () => router.push('/payment-center'),
      keywords: ['payment', 'qris', 'link', 'transaction', 'money'],
      category: 'navigation',
      keybinding: 'Ctrl+P',
      color: 'text-green-600'
    },
    {
      id: 'nav-students',
      label: 'Student Data',
      description: 'Manage student and parent information',
      icon: Users,
      action: () => router.push('/wali-murid'),
      keywords: ['student', 'siswa', 'wali', 'parent', 'data'],
      category: 'navigation',
      keybinding: 'Ctrl+S',
      color: 'text-indigo-600'
    },

    // Quick actions
    {
      id: 'action-add-student',
      label: 'Add New Student',
      description: 'Quick add student with parent info',
      icon: Plus,
      action: () => {
        router.push('/wali-murid')
        // Would trigger modal in real implementation
        setTimeout(() => {
          const addButton = document.querySelector('[data-action="add-student"]') as HTMLButtonElement
          if (addButton) addButton.click()
        }, 500)
      },
      keywords: ['add', 'new', 'student', 'siswa', 'create'],
      category: 'action',
      color: 'text-blue-600'
    },
    {
      id: 'action-send-reminder',
      label: 'Send Payment Reminder',
      description: 'Quick send reminder to unpaid students',
      icon: Send,
      action: () => router.push('/reminder-tagihan'),
      keywords: ['send', 'reminder', 'payment', 'whatsapp', 'message'],
      category: 'action',
      color: 'text-emerald-600'
    },
    {
      id: 'action-generate-report',
      label: 'Generate Financial Report',
      description: 'Export current financial data',
      icon: Download,
      action: () => {
        router.push('/laporan-keuangan')
        // Would trigger export in real implementation
      },
      keywords: ['report', 'export', 'financial', 'download', 'excel'],
      category: 'action',
      color: 'text-orange-600'
    },

    // Calculations
    {
      id: 'calc-total-unpaid',
      label: 'Calculate Unpaid Amount',
      description: 'Quick calculation of outstanding payments',
      icon: Calculator,
      action: async () => {
        try {
          const response = await fetch('/api/wali-murid')
          const data = await response.json()
          if (data.success) {
            const unpaidTotal = data.waliMurid
              .filter((w: any) => w.statusBayar === 'belum')
              .reduce((sum: number, w: any) => sum + w.tagihan, 0)
            
            const formatter = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            })
            
            alert(`Total Outstanding: ${formatter.format(unpaidTotal)}`)
          }
        } catch (error) {
          alert('Error calculating unpaid amount')
        }
      },
      keywords: ['calculate', 'unpaid', 'outstanding', 'total', 'sum'],
      category: 'calculation',
      color: 'text-yellow-600'
    },
    {
      id: 'calc-monthly-summary',
      label: 'Monthly Summary',
      description: 'Quick view of this month\'s financials',
      icon: Clock,
      action: async () => {
        try {
          const response = await fetch('/api/kas-kelas')
          const data = await response.json()
          if (data.success) {
            const thisMonth = new Date().getMonth()
            const thisYear = new Date().getFullYear()
            
            const monthlyEntries = data.kasEntries.filter((entry: any) => {
              const entryDate = new Date(entry.tanggal)
              return entryDate.getMonth() === thisMonth && entryDate.getFullYear() === thisYear
            })
            
            const income = monthlyEntries
              .filter((e: any) => e.jenis === 'masuk')
              .reduce((sum: number, e: any) => sum + e.jumlah, 0)
            
            const expense = monthlyEntries
              .filter((e: any) => e.jenis === 'keluar')
              .reduce((sum: number, e: any) => sum + e.jumlah, 0)
            
            const formatter = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              minimumFractionDigits: 0
            })
            
            alert(`This Month:\nIncome: ${formatter.format(income)}\nExpense: ${formatter.format(expense)}\nBalance: ${formatter.format(income - expense)}`)
          }
        } catch (error) {
          alert('Error calculating monthly summary')
        }
      },
      keywords: ['monthly', 'summary', 'this month', 'current', 'balance'],
      category: 'calculation',
      color: 'text-pink-600'
    },

    // Data shortcuts
    {
      id: 'data-unpaid-students',
      label: 'Show Unpaid Students',
      description: 'List students with outstanding payments',
      icon: Users,
      action: async () => {
        try {
          const response = await fetch('/api/wali-murid')
          const data = await response.json()
          if (data.success) {
            const unpaidStudents = data.waliMurid.filter((w: any) => w.statusBayar === 'belum')
            const studentList = unpaidStudents
              .map((w: any) => `• ${w.namaAnak} - ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(w.tagihan)}`)
              .join('\n')
            
            alert(`Unpaid Students (${unpaidStudents.length}):\n\n${studentList}`)
          }
        } catch (error) {
          alert('Error loading unpaid students')
        }
      },
      keywords: ['unpaid', 'students', 'outstanding', 'list', 'belum bayar'],
      category: 'data',
      color: 'text-red-600'
    }
  ]

  const filteredShortcuts = shortcuts.filter(shortcut =>
    shortcut.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shortcut.keywords.some(keyword => keyword.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Initialize client-side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isClient) return
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open shortcuts with Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
        return
      }

      // Close with Escape
      if (e.key === 'Escape') {
        setIsOpen(false)
        setSearchQuery('')
        setSelectedIndex(0)
        return
      }

      if (!isOpen) {
        // Global shortcuts when not in search mode
        shortcuts.forEach(shortcut => {
          if (shortcut.keybinding) {
            const keys = shortcut.keybinding.toLowerCase().split('+')
            const requiredCtrl = keys.includes('ctrl')
            const requiredMeta = keys.includes('cmd')
            const requiredKey = keys[keys.length - 1]

            if (
              ((requiredCtrl && e.ctrlKey) || (requiredMeta && e.metaKey)) &&
              e.key.toLowerCase() === requiredKey &&
              !e.shiftKey && !e.altKey
            ) {
              e.preventDefault()
              shortcut.action()
              addToRecent(shortcut.id)
            }
          }
        })
        return
      }

      // Navigation in search mode
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredShortcuts.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredShortcuts.length) % filteredShortcuts.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (filteredShortcuts[selectedIndex]) {
          executeShortcut(filteredShortcuts[selectedIndex])
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isClient, isOpen, selectedIndex, filteredShortcuts])

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchQuery])

  const addToRecent = useCallback((shortcutId: string) => {
    setRecentShortcuts(prev => {
      const updated = [shortcutId, ...prev.filter(id => id !== shortcutId)].slice(0, 5)
      if (typeof window !== 'undefined') {
        localStorage.setItem('kas-recent-shortcuts', JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const executeShortcut = useCallback((shortcut: Shortcut) => {
    shortcut.action()
    addToRecent(shortcut.id)
    setIsOpen(false)
    setSearchQuery('')
    setSelectedIndex(0)
    if (onClose) onClose()
  }, [addToRecent, onClose])

  // Load recent shortcuts from localStorage
  useEffect(() => {
    if (!isClient) return

    const saved = localStorage.getItem('kas-recent-shortcuts')
    if (saved) {
      try {
        setRecentShortcuts(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading recent shortcuts:', error)
      }
    }
  }, [isClient])

  const recentShortcutItems = recentShortcuts
    .map(id => shortcuts.find(s => s.id === id))
    .filter(Boolean) as Shortcut[]

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 right-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-[999998]"
        title="Quick Actions (Ctrl+K)"
      >
        <Zap className="h-5 w-5" />
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Smart Shortcuts</h2>
                <p className="text-sm text-gray-600">Quick actions and navigation</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search shortcuts..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              autoFocus
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <kbd className="px-2 py-1 text-xs font-mono text-gray-500 bg-gray-100 rounded">
                Ctrl+K
              </kbd>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-96 overflow-y-auto">
          {/* Recent shortcuts */}
          {searchQuery === '' && recentShortcutItems.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Recent
              </h3>
              <div className="space-y-1">
                {recentShortcutItems.map((shortcut, index) => (
                  <button
                    key={shortcut.id}
                    onClick={() => executeShortcut(shortcut)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <shortcut.icon className={`h-5 w-5 ${shortcut.color}`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{shortcut.label}</p>
                      <p className="text-sm text-gray-500">{shortcut.description}</p>
                    </div>
                    {shortcut.keybinding && (
                      <kbd className="px-2 py-1 text-xs font-mono text-gray-500 bg-gray-100 rounded">
                        {shortcut.keybinding}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results or all shortcuts */}
          <div className="p-4">
            {searchQuery && (
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {filteredShortcuts.length} results for "{searchQuery}"
              </h3>
            )}
            
            <div className="space-y-1">
              {filteredShortcuts.map((shortcut, index) => (
                <button
                  key={shortcut.id}
                  onClick={() => executeShortcut(shortcut)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                    index === selectedIndex 
                      ? 'bg-blue-50 border-2 border-blue-200' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <shortcut.icon className={`h-5 w-5 ${shortcut.color}`} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{shortcut.label}</p>
                    <p className="text-sm text-gray-500">{shortcut.description}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        shortcut.category === 'navigation' ? 'bg-blue-100 text-blue-700' :
                        shortcut.category === 'action' ? 'bg-green-100 text-green-700' :
                        shortcut.category === 'calculation' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {shortcut.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {shortcut.keybinding && (
                      <kbd className="px-2 py-1 text-xs font-mono text-gray-500 bg-gray-100 rounded">
                        {shortcut.keybinding}
                      </kbd>
                    )}
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </button>
              ))}
            </div>

            {filteredShortcuts.length === 0 && searchQuery && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No shortcuts found for "{searchQuery}"</p>
                <p className="text-sm mt-2">Try different keywords or check the help section</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Keyboard className="h-4 w-4" />
                <span>Use ↑↓ to navigate</span>
              </div>
              <div className="flex items-center space-x-1">
                <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-200 rounded">Enter</kbd>
                <span>to select</span>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <kbd className="px-1 py-0.5 text-xs font-mono bg-gray-200 rounded">Esc</kbd>
              <span>to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
