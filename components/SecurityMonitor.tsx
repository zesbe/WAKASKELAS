'use client'

import { useState, useEffect } from 'react'
import { Shield, ShieldAlert, ShieldCheck, Activity, AlertTriangle, CheckCircle } from 'lucide-react'

interface SecurityStatus {
  isSecure: boolean
  messagesThisHour: number
  connectionStability: 'stable' | 'unstable'
}

interface WhatsAppSecureStatus {
  isConnected: boolean
  connectionState: string
  securityStatus: SecurityStatus
  protectionLevel: string
  timestamp: string
}

export default function SecurityMonitor() {
  const [status, setStatus] = useState<WhatsAppSecureStatus | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    checkSecurityStatus()
    const interval = setInterval(checkSecurityStatus, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const checkSecurityStatus = async () => {
    try {
      const response = await fetch('/api/whatsapp-secure/status')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setStatus(data)
          if (isClient) {
            setLastUpdate(new Date().toLocaleTimeString('id-ID'))
          }
        }
      }
    } catch (error) {
      console.error('Error checking security status:', error)
    }
  }

  if (!status) {
    return (
      <div className="bg-gray-100 border border-gray-300 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-500" />
          <span className="text-gray-600">Memuat status keamanan...</span>
        </div>
      </div>
    )
  }

  const getSecurityIcon = () => {
    if (!status.isConnected) {
      return <ShieldAlert className="h-5 w-5 text-red-500" />
    }
    if (!status.securityStatus.isSecure) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
    return <ShieldCheck className="h-5 w-5 text-green-500" />
  }

  const getSecurityLevel = () => {
    if (!status.isConnected) return 'Disconnected'
    if (!status.securityStatus.isSecure) return 'Warning'
    return 'Protected'
  }

  const getSecurityColor = () => {
    if (!status.isConnected) return 'border-red-200 bg-red-50'
    if (!status.securityStatus.isSecure) return 'border-yellow-200 bg-yellow-50'
    return 'border-green-200 bg-green-50'
  }

  const getStabilityIcon = () => {
    if (status.securityStatus.connectionStability === 'stable') {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />
  }

  return (
    <div className={`border rounded-lg p-4 ${getSecurityColor()}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getSecurityIcon()}
          <h3 className="font-semibold text-gray-900">Security Monitor</h3>
        </div>
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          getSecurityLevel() === 'Protected' ? 'bg-green-100 text-green-800' :
          getSecurityLevel() === 'Warning' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {getSecurityLevel()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Activity className="h-4 w-4 text-blue-500" />
            <span className="text-gray-700">Connection Status</span>
          </div>
          <p className={`font-medium ${status.isConnected ? 'text-green-600' : 'text-red-600'}`}>
            {status.isConnected ? 'Connected' : 'Disconnected'}
          </p>
          <p className="text-xs text-gray-600">State: {status.connectionState}</p>
        </div>

        <div>
          <div className="flex items-center space-x-2 mb-2">
            {getStabilityIcon()}
            <span className="text-gray-700">Stability</span>
          </div>
          <p className={`font-medium ${
            status.securityStatus.connectionStability === 'stable' ? 'text-green-600' : 'text-yellow-600'
          }`}>
            {status.securityStatus.connectionStability === 'stable' ? 'Stable' : 'Unstable'}
          </p>
          <p className="text-xs text-gray-600">
            Messages/hour: {status.securityStatus.messagesThisHour}
          </p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Protection Level: {status.protectionLevel}</span>
          <span>Last Update: {lastUpdate}</span>
        </div>
      </div>

      {!status.securityStatus.isSecure && (
        <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded text-xs text-yellow-800">
          ⚠️ Security warning detected. Some features may be limited for protection.
        </div>
      )}
    </div>
  )
}
