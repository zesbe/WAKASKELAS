// PWA Installation and Offline Utilities

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

class PWAManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private isOnline = true
  private offlineQueue: Array<{ url: string; method: string; headers: HeadersInit; body?: string; id: string }> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine
      this.init()
    }
  }

  private init() {
    // Register service worker
    this.registerServiceWorker()

    // Listen for install prompt
    this.setupInstallPrompt()

    // Setup online/offline handlers
    this.setupConnectivityHandlers()

    // Setup background sync registration
    this.setupBackgroundSync()
  }

  // Service Worker Registration
  async registerServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })
        
        console.log('✅ Service Worker registered:', registration)
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdateNotification()
              }
            })
          }
        })
        
        return registration
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }
  }

  // PWA Install Prompt
  private setupInstallPrompt() {
    if (typeof window === 'undefined') return

    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.showInstallButton()
    })

    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully')
      this.hideInstallButton()
      this.deferredPrompt = null
    })
  }

  // Show install button
  private showInstallButton() {
    const installButton = document.getElementById('pwa-install-button')
    if (installButton) {
      installButton.style.display = 'block'
      installButton.addEventListener('click', () => this.promptInstall())
    } else {
      // Create install button dynamically
      this.createInstallButton()
    }
  }

  // Create install button
  private createInstallButton() {
    const button = document.createElement('button')
    button.id = 'pwa-install-button'
    button.className = 'fixed bottom-4 left-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2 hover:bg-blue-700 transition-colors'
    button.innerHTML = `
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
      </svg>
      <span>Install App</span>
    `
    button.addEventListener('click', () => this.promptInstall())
    document.body.appendChild(button)
  }

  // Hide install button
  private hideInstallButton() {
    const installButton = document.getElementById('pwa-install-button')
    if (installButton) {
      installButton.style.display = 'none'
    }
  }

  // Prompt for installation
  async promptInstall() {
    if (!this.deferredPrompt) return

    this.deferredPrompt.prompt()
    
    const { outcome } = await this.deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)
    
    this.deferredPrompt = null
    this.hideInstallButton()
  }

  // Online/Offline Handlers
  private setupConnectivityHandlers() {
    if (typeof window === 'undefined') return

    window.addEventListener('online', () => {
      this.isOnline = true
      this.onOnline()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.onOffline()
    })
  }

  private onOnline() {
    console.log('🟢 Back online')
    this.hideOfflineNotification()
    this.syncOfflineData()
    this.showOnlineNotification()
  }

  private onOffline() {
    console.log('🔴 Gone offline')
    this.showOfflineNotification()
  }

  // Notification Helpers
  private showOfflineNotification() {
    this.showNotification(
      '🔴 Mode Offline',
      'Anda sedang offline. Beberapa fitur mungkin terbatas.',
      'offline-notification',
      'bg-yellow-500'
    )
  }

  private showOnlineNotification() {
    this.showNotification(
      '🟢 Kembali Online',
      'Koneksi restored. Data sedang disinkronisasi...',
      'online-notification',
      'bg-green-500'
    )
    
    // Hide after 3 seconds
    setTimeout(() => {
      this.hideNotification('online-notification')
    }, 3000)
  }

  private hideOfflineNotification() {
    this.hideNotification('offline-notification')
  }

  private showUpdateNotification() {
    this.showNotification(
      '🔄 Update Tersedia',
      'Aplikasi telah diperbarui. Refresh untuk menggunakan versi terbaru.',
      'update-notification',
      'bg-blue-500',
      [
        {
          text: 'Refresh',
          action: () => window.location.reload()
        }
      ]
    )
  }

  private showNotification(
    title: string, 
    message: string, 
    id: string, 
    bgClass: string,
    actions?: Array<{ text: string; action: () => void }>
  ) {
    // Remove existing notification
    this.hideNotification(id)
    
    const notification = document.createElement('div')
    notification.id = id
    notification.className = `fixed top-4 right-4 ${bgClass} text-white p-4 rounded-lg shadow-lg z-50 max-w-sm`
    
    let actionsHtml = ''
    if (actions) {
      actionsHtml = actions.map(action => 
        `<button class="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded mt-2 mr-2 text-sm">${action.text}</button>`
      ).join('')
    }
    
    notification.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <h4 class="font-semibold">${title}</h4>
          <p class="text-sm mt-1">${message}</p>
          ${actionsHtml}
        </div>
        <button class="ml-4 text-white hover:text-gray-200" onclick="this.parentElement.parentElement.remove()">
          ✕
        </button>
      </div>
    `
    
    // Add action listeners
    if (actions) {
      const buttons = notification.querySelectorAll('button')
      buttons.forEach((button, index) => {
        if (index < actions.length) {
          button.addEventListener('click', actions[index].action)
        }
      })
    }
    
    document.body.appendChild(notification)
  }

  private hideNotification(id: string) {
    const notification = document.getElementById(id)
    if (notification) {
      notification.remove()
    }
  }

  // Background Sync
  private setupBackgroundSync() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) return

    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        // Register periodic sync if supported
        if ('periodicSync' in registration) {
          return (registration as any).periodicSync.register('kas-sync', {
            minInterval: 24 * 60 * 60 * 1000 // 24 hours
          })
        }
      }).catch(error => {
        console.log('Background sync not supported:', error)
      })
    }
  }

  // Offline Data Management
  async queueOfflineRequest(url: string, method: string, headers: HeadersInit, body?: string) {
    const request = {
      url,
      method,
      headers,
      body,
      id: Date.now().toString()
    }
    
    this.offlineQueue.push(request)
    
    // Store in localStorage as backup
    localStorage.setItem('kas-offline-queue', JSON.stringify(this.offlineQueue))
    
    // Register background sync
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready
      if ('sync' in registration) {
        try {
          await (registration as any).sync.register('background-sync-kas')
        } catch (error) {
          console.log('Background sync registration failed:', error)
        }
      }
    }
  }

  private async syncOfflineData() {
    // Load from localStorage
    const queueData = localStorage.getItem('kas-offline-queue')
    if (queueData) {
      this.offlineQueue = JSON.parse(queueData)
    }

    for (const request of this.offlineQueue) {
      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        })
        
        // Remove successful request from queue
        this.offlineQueue = this.offlineQueue.filter(r => r.id !== request.id)
      } catch (error) {
        console.error('Failed to sync request:', error)
      }
    }
    
    // Update localStorage
    localStorage.setItem('kas-offline-queue', JSON.stringify(this.offlineQueue))
  }

  // Push Notifications
  async requestNotificationPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) return false
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  async subscribeToPushNotifications() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '')
      })
      
      console.log('Push subscription:', subscription)
      return subscription
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  private urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Utility Methods
  isAppInstalled() {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  getConnectionType() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return null
    const connection = (navigator as any).connection ||
                     (navigator as any).mozConnection ||
                     (navigator as any).webkitConnection
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    
    return null
  }

  // Storage Estimation
  async getStorageEstimate() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return null
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      return await navigator.storage.estimate()
    }
    return null
  }
}

// Singleton instance
export const pwaManager = new PWAManager()

// Helper functions
export const isPWAInstalled = () => pwaManager.isAppInstalled()
export const promptPWAInstall = () => pwaManager.promptInstall()
export const queueOfflineRequest = (url: string, method: string, headers: HeadersInit, body?: string) => 
  pwaManager.queueOfflineRequest(url, method, headers, body)
