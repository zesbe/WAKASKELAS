'use client'

import { useEffect, useState } from 'react'
import { pwaManager } from '../lib/pwaUtils'
import SmartShortcuts from './SmartShortcuts'

interface PWAProviderProps {
  children: React.ReactNode
}

export default function PWAProvider({ children }: PWAProviderProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Mark as client-side
    setIsClient(true)

    // Initialize PWA
    const initPWA = async () => {
      // Check if app is installed
      setIsInstalled(pwaManager.isAppInstalled())

      // Setup online/offline listeners
      const handleOnline = () => setIsOnline(true)
      const handleOffline = () => setIsOnline(false)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      // Initial online status (only on client)
      setIsOnline(navigator.onLine)

      // Request notification permission
      await pwaManager.requestNotificationPermission()

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    }

    initPWA()
  }, [])

  return (
    <>
      {children}

      {/* Smart Shortcuts - Only render on client */}
      {isClient && <SmartShortcuts />}

      {/* PWA Status Indicators - Only show on client */}
      {isClient && !isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white text-center py-2 z-50">
          <span className="text-sm font-medium">
            📱 Mode Offline - Beberapa fitur mungkin terbatas
          </span>
        </div>
      )}

      {/* PWA Install Prompt will be handled by pwaManager */}
    </>
  )
}
