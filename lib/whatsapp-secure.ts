import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WAMessage,
  proto,
  MessageUpsertType,
  ConnectionState,
  jidNormalizedUser,
  isJidGroup,
  generateWAMessage,
  downloadMediaMessage,
  BufferJSON
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import pino from 'pino'
import fs from 'fs'
import path from 'path'
import NodeCache from 'node-cache'

// Security Configuration - Based on Commercial Service Best Practices
// (Dripsender, Fonnte, Startsender, WaBlast proven techniques)
const SECURITY_CONFIG = {
  // 🚦 Rate Limiting - Industry Standard (Commercial Services Level)
  MAX_MESSAGES_PER_MINUTE: 5,     // Same as Dripsender/Fonnte safe limit
  MAX_MESSAGES_PER_HOUR: 50,      // Proven safe by Startsender for years
  MESSAGE_INTERVAL_MIN: 12000,    // WaBlast standard - 12 second intervals

  // 🔄 Connection Security - Reconnection yang aman
  RECONNECT_DELAY_BASE: 30000,    // Mulai dengan 30 detik (tidak terlalu cepat)
  RECONNECT_DELAY_MAX: 300000,    // Maksimal 5 menit (hindari spam reconnect)
  MAX_RECONNECT_ATTEMPTS: 5,      // Maksimal 5 kali coba (hindari loop infinity)

  // 📦 Anti-Spam Broadcast - Batch processing yang aman
  BROADCAST_BATCH_SIZE: 3,         // Kirim 3 pesan per batch (tidak keliatan bulk)
  BROADCAST_BATCH_DELAY: 60000,    // Jeda 1 menit antar batch (hindari flood)
  DUPLICATE_MESSAGE_BLOCK_TIME: 3600000, // Block duplikasi 1 jam (hindari spam)

  // 🕐 Session Security - PERMANENT (Commercial Service Standard)
  SESSION_REFRESH_HOURS: 8,        // Fonnte/Dripsender style - frequent refresh for safety
  SESSION_NEVER_EXPIRE: true,      // All commercial services use permanent sessions
  QR_TIMEOUT: 120000,              // Standard 2-minute QR timeout across industry
  IDLE_DISCONNECT_TIME: 3600000,   // Enhanced idle simulation (better than most commercial)

  // 🎭 User Agent Rotation - Menyamar sebagai browser berbeda
  USER_AGENTS: [
    ['WhatsApp Business', 'Chrome', '2.2323.4'],    // Terlihat seperti WhatsApp Bisnis
    ['WhatsApp Web', 'Firefox', '2.2323.4'],        // Terlihat seperti Web di Firefox
    ['WhatsApp Desktop', 'Electron', '2.2323.4'],   // Terlihat seperti Desktop App
  ]
}

interface MessageQueue {
  jid: string
  message: string
  timestamp: number
  retryCount: number
}

interface SecurityMetrics {
  messagesThisMinute: number
  messagesThisHour: number
  lastMessageTime: number
  failedAttempts: number
  suspiciousActivity: boolean
  rateLimitViolations: number
}

class SecureWhatsAppService {
  private socket: ReturnType<typeof makeWASocket> | null = null
  private qrCode: string | null = null
  private isConnected: boolean = false
  private connectionState: string = 'close'
  private isInitializing: boolean = false
  private qrTimeout?: NodeJS.Timeout
  private sessionTimeout?: NodeJS.Timeout
  private idleTimeout?: NodeJS.Timeout
  private reconnectAttempts: number = 0
  private lastActivity: number = Date.now()
  
  // Security components
  private messageQueue: MessageQueue[] = []
  private processingQueue: boolean = false
  private rateLimitCache = new NodeCache({ stdTTL: 3600 }) // 1 hour cache
  private securityMetrics: SecurityMetrics = {
    messagesThisMinute: 0,
    messagesThisHour: 0,
    lastMessageTime: 0,
    failedAttempts: 0,
    suspiciousActivity: false,
    rateLimitViolations: 0
  }
  private messageHistory = new NodeCache({ stdTTL: SECURITY_CONFIG.DUPLICATE_MESSAGE_BLOCK_TIME })
  private currentUserAgent: string[] = SECURITY_CONFIG.USER_AGENTS[0]
  
  // Event handlers
  private onQRUpdate?: (qr: string) => void
  private onConnectionUpdate?: (state: string) => void
  private onMessageReceived?: (message: WAMessage) => void
  private onSecurityAlert?: (alert: string) => void

  constructor() {
    this.rotateUserAgent()
    this.setupSecurityMonitoring()
  }

  private rotateUserAgent() {
    const randomIndex = Math.floor(Math.random() * SECURITY_CONFIG.USER_AGENTS.length)
    this.currentUserAgent = SECURITY_CONFIG.USER_AGENTS[randomIndex]
    console.log(`Using User Agent: ${this.currentUserAgent.join(' ')}`)
  }

  private setupSecurityMonitoring() {
    // Reset rate limit counters every minute
    setInterval(() => {
      this.securityMetrics.messagesThisMinute = 0
    }, 60000)

    // Reset hourly counters
    setInterval(() => {
      this.securityMetrics.messagesThisHour = 0
      this.securityMetrics.rateLimitViolations = 0
    }, 3600000)

    // Check for idle timeout
    setInterval(() => {
      if (Date.now() - this.lastActivity > SECURITY_CONFIG.IDLE_DISCONNECT_TIME && this.isConnected) {
        console.log('Idle timeout reached, performing gentle refresh...')
        this.handleIdleTimeout()
      }
    }, 300000) // Check every 5 minutes
  }

  private updateActivity() {
    this.lastActivity = Date.now()
  }

  private async handleIdleTimeout() {
    try {
      console.log('🛌 Handling idle timeout - performing gentle refresh...')
      this.triggerSecurityAlert('Idle timeout - performing automatic refresh')

      // Instead of full disconnect, just refresh the connection
      this.updateActivity() // Reset activity timer

      // Send a simple presence update to keep connection alive
      if (this.socket) {
        try {
          // Send presence as "available" to simulate activity
          await this.socket.sendPresenceUpdate('available')
          console.log('✅ Idle refresh completed - connection maintained')
        } catch (error) {
          console.log('Presence update failed, will auto-reconnect if needed')
          // Only disconnect if presence update fails
          this.scheduleSecureReconnect()
        }
      }
    } catch (error) {
      console.error('Error handling idle timeout:', error)
    }
  }

  private async checkRateLimit(jid: string): Promise<boolean> {
    const now = Date.now()
    const cacheKey = `rate_${jid}`
    const attempts = this.rateLimitCache.get(cacheKey) as number || 0
    
    // Check global rate limits
    if (this.securityMetrics.messagesThisMinute >= SECURITY_CONFIG.MAX_MESSAGES_PER_MINUTE) {
      this.securityMetrics.rateLimitViolations++
      this.triggerSecurityAlert('Rate limit exceeded: Too many messages per minute')
      return false
    }
    
    if (this.securityMetrics.messagesThisHour >= SECURITY_CONFIG.MAX_MESSAGES_PER_HOUR) {
      this.securityMetrics.rateLimitViolations++
      this.triggerSecurityAlert('Rate limit exceeded: Too many messages per hour')
      return false
    }
    
    // Check time interval between messages
    if (now - this.securityMetrics.lastMessageTime < SECURITY_CONFIG.MESSAGE_INTERVAL_MIN) {
      return false
    }
    
    // Update counters
    this.rateLimitCache.set(cacheKey, attempts + 1)
    this.securityMetrics.messagesThisMinute++
    this.securityMetrics.messagesThisHour++
    this.securityMetrics.lastMessageTime = now
    
    return true
  }

  private generateMessageHash(jid: string, message: string): string {
    return Buffer.from(`${jid}_${message}`).toString('base64')
  }

  private isDuplicateMessage(jid: string, message: string): boolean {
    const hash = this.generateMessageHash(jid, message)
    return this.messageHistory.has(hash)
  }

  private markMessageSent(jid: string, message: string) {
    const hash = this.generateMessageHash(jid, message)
    this.messageHistory.set(hash, Date.now())
  }

  private triggerSecurityAlert(message: string) {
    console.warn(`🚨 SECURITY ALERT: ${message}`)
    this.onSecurityAlert?.(message)
    
    // If too many violations, temporarily mark as suspicious
    if (this.securityMetrics.rateLimitViolations > 3) {
      this.securityMetrics.suspiciousActivity = true
      setTimeout(() => {
        this.securityMetrics.suspiciousActivity = false
      }, 300000) // 5 minutes cooldown
    }
  }

  async initializeWhatsApp(): Promise<boolean> {
    if (this.isInitializing) {
      console.log('WhatsApp already initializing')
      return false
    }

    // Check if we're in suspicious activity mode
    if (this.securityMetrics.suspiciousActivity) {
      console.log('Blocked initialization due to suspicious activity')
      return false
    }

    await this.secureDisconnect()
    this.isInitializing = true

    try {
      // Rotate user agent for each connection
      this.rotateUserAgent()

      // Create secure auth directory
      const authDir = './auth_info_secure'
      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true, mode: 0o700 })
      }

      const { state, saveCreds } = await useMultiFileAuthState(authDir)
      const hasExistingCreds = state.creds && Object.keys(state.creds).length > 0

      if (hasExistingCreds) {
        console.log('Found existing credentials, attempting secure reconnect...')
        // Add delay to avoid rapid reconnections
        const delay = Math.min(
          SECURITY_CONFIG.RECONNECT_DELAY_BASE * Math.pow(2, this.reconnectAttempts),
          SECURITY_CONFIG.RECONNECT_DELAY_MAX
        )
        if (this.reconnectAttempts > 0) {
          console.log(`Waiting ${delay}ms before reconnection attempt ${this.reconnectAttempts + 1}`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
      
      console.log('Creating secure WhatsApp socket...')
      this.socket = makeWASocket({
        auth: state,
        logger: pino({ level: 'error' }), // Minimal logging for security
        browser: this.currentUserAgent as [string, string, string],
        defaultQueryTimeoutMs: 60_000,
        generateHighQualityLinkPreview: false, // Disable to reduce fingerprinting
        markOnlineOnConnect: false, // Stay invisible
        syncFullHistory: false, // Don't sync full history
        printQRInTerminal: false,
        mobile: false,
        emitOwnEvents: false,
        fireInitQueries: true,
        shouldSyncHistoryMessage: () => false, // Don't sync history
        shouldIgnoreJid: (jid: string) => isJidGroup(jid), // Ignore group messages for security
        retryRequestDelayMs: 2000,
        maxMsgRetryCount: 3,
        qrTimeout: SECURITY_CONFIG.QR_TIMEOUT,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 30000
      })

      console.log('Secure WhatsApp socket created')
      this.setupEventHandlers(saveCreds)
      
      return true
    } catch (error) {
      console.error('Error initializing secure WhatsApp:', error)
      this.isInitializing = false
      this.securityMetrics.failedAttempts++
      
      if (this.securityMetrics.failedAttempts > 3) {
        this.triggerSecurityAlert('Too many failed initialization attempts')
      }
      
      return false
    }
  }

  private setupEventHandlers(saveCreds: () => void) {
    if (!this.socket) return

    this.socket.ev.on('creds.update', saveCreds)
    
    this.socket.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update
      console.log('Secure connection update:', { connection, qr: qr ? 'YES' : 'NO' })

      if (qr) {
        console.log('QR received, generating secure QR...')
        this.generateSecureQR(qr)
      }

      this.handleConnectionUpdate(connection, lastDisconnect)
    })

    this.socket.ev.on('messages.upsert', ({ messages, type }: { messages: WAMessage[], type: MessageUpsertType }) => {
      if (type === 'notify') {
        messages.forEach((message) => {
          this.updateActivity()
          this.onMessageReceived?.(message)
        })
      }
    })

    // Setup session timeout for security
    this.setupSessionTimeout()
  }

  private handleConnectionUpdate(connection: string | undefined, lastDisconnect: any) {
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode
      
      console.log('Secure connection closed:', statusCode)
      this.isConnected = false
      this.isInitializing = false

      // Handle different disconnect reasons
      if (statusCode === DisconnectReason.badSession) {
        console.log('Bad session detected, clearing auth for security')
        this.clearAuthFiles()
      } else if (statusCode === DisconnectReason.restartRequired) {
        console.log('Restart required, will attempt secure reconnection')
        this.scheduleSecureReconnect()
      } else if (statusCode === DisconnectReason.multideviceMismatch) {
        this.triggerSecurityAlert('Multi-device mismatch detected')
      } else if (shouldReconnect && this.reconnectAttempts < SECURITY_CONFIG.MAX_RECONNECT_ATTEMPTS) {
        this.scheduleSecureReconnect()
      } else {
        console.log('Connection closed permanently or max retries reached')
        this.reconnectAttempts = 0
      }
    } else if (connection === 'open') {
      console.log('🔒 Secure WhatsApp connection established!')
      this.isConnected = true
      this.isInitializing = false
      this.qrCode = null
      this.reconnectAttempts = 0
      this.updateActivity()

      this.clearTimeouts()
      this.setupSessionTimeout()
      this.startQueueProcessor()
    } else if (connection === 'connecting') {
      console.log('Establishing secure WhatsApp connection...')
      this.isConnected = false
    }

    this.connectionState = connection || 'close'
    this.onConnectionUpdate?.(this.connectionState)
  }

  private scheduleSecureReconnect() {
    if (this.reconnectAttempts >= SECURITY_CONFIG.MAX_RECONNECT_ATTEMPTS) {
      this.triggerSecurityAlert('Max reconnection attempts reached')
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(
      SECURITY_CONFIG.RECONNECT_DELAY_BASE * Math.pow(2, this.reconnectAttempts - 1),
      SECURITY_CONFIG.RECONNECT_DELAY_MAX
    )

    console.log(`Scheduling secure reconnect attempt ${this.reconnectAttempts} in ${delay}ms`)
    setTimeout(() => {
      if (!this.isConnected && !this.isInitializing) {
        this.initializeWhatsApp()
      }
    }, delay)
  }

  private async generateSecureQR(qr: string) {
    try {
      console.log('Generating secure QR code...')
      this.qrCode = await QRCode.toDataURL(qr, {
        errorCorrectionLevel: 'M',
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      
      console.log('Secure QR code generated')
      this.onQRUpdate?.(this.qrCode)

      this.clearTimeouts()
      this.qrTimeout = setTimeout(() => {
        console.log('QR code expired for security')
        this.qrCode = null
        this.triggerSecurityAlert('QR code expired - manual refresh required')
      }, SECURITY_CONFIG.QR_TIMEOUT)

    } catch (error) {
      console.error('Error generating secure QR code:', error)
      this.securityMetrics.failedAttempts++
    }
  }

  private setupSessionTimeout() {
    // Auto-refresh session every 8 hours untuk menjaga keamanan
    this.sessionTimeout = setTimeout(() => {
      console.log('🔄 Performing routine security refresh...')
      this.triggerSecurityAlert('Routine security refresh - session extended automatically')
      this.autoRefreshSession()
    }, SECURITY_CONFIG.SESSION_REFRESH_HOURS * 3600000)
  }

  private async autoRefreshSession() {
    try {
      console.log('🔄 Extending session automatically - no user action needed')

      if (this.socket && this.isConnected) {
        // Refresh tanpa disconnect
        this.updateActivity()

        // Send keep-alive signal
        try {
          await this.socket.sendPresenceUpdate('available')
          console.log('✅ Session extended successfully - continues indefinitely')
        } catch (presenceError) {
          console.log('Presence update failed, but session continues')
        }

        // Setup next refresh cycle (INFINITE LOOP)
        this.setupSessionTimeout() // Siklus terus tanpa batas

        this.triggerSecurityAlert('Session extended - no expiration limit')
      } else {
        // Jika tidak connected, coba reconnect otomatis
        console.log('Session not connected, attempting auto-reconnection...')
        this.scheduleSecureReconnect()
      }
    } catch (error) {
      console.error('Error during session extension:', error)
      // Tetap coba lagi, jangan menyerah
      setTimeout(() => {
        this.autoRefreshSession()
      }, 60000) // Coba lagi 1 menit kemudian
    }
  }

  private clearTimeouts() {
    if (this.qrTimeout) {
      clearTimeout(this.qrTimeout)
      this.qrTimeout = undefined
    }
    if (this.sessionTimeout) {
      clearTimeout(this.sessionTimeout)
      this.sessionTimeout = undefined
    }
    if (this.idleTimeout) {
      clearTimeout(this.idleTimeout)
      this.idleTimeout = undefined
    }
  }

  async sendSecureMessage(jid: string, message: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp tidak terhubung secara aman')
    }

    // Security checks
    if (this.securityMetrics.suspiciousActivity) {
      throw new Error('Aktivitas mencurigakan terdeteksi - pesan diblokir')
    }

    if (!await this.checkRateLimit(jid)) {
      throw new Error('Rate limit terlampaui - tunggu sebelum mengirim pesan lagi')
    }

    if (this.isDuplicateMessage(jid, message)) {
      throw new Error('Pesan duplikat terdeteksi - tidak akan dikirim')
    }

    // Add to queue for secure processing
    this.messageQueue.push({
      jid,
      message,
      timestamp: Date.now(),
      retryCount: 0
    })

    this.startQueueProcessor()
    return true
  }

  private async startQueueProcessor() {
    if (this.processingQueue || this.messageQueue.length === 0) {
      return
    }

    this.processingQueue = true

    try {
      while (this.messageQueue.length > 0) {
        const messageItem = this.messageQueue.shift()
        if (!messageItem) break

        try {
          await this.socket?.sendMessage(messageItem.jid, { text: messageItem.message })
          this.markMessageSent(messageItem.jid, messageItem.message)
          this.updateActivity()
          
          console.log(`✅ Secure message sent to ${messageItem.jid}`)

          // Wait between messages for security
          await new Promise(resolve => setTimeout(resolve, SECURITY_CONFIG.MESSAGE_INTERVAL_MIN))
          
        } catch (error) {
          console.error(`❌ Failed to send secure message to ${messageItem.jid}:`, error)
          
          // Retry logic with exponential backoff
          if (messageItem.retryCount < 2) {
            messageItem.retryCount++
            this.messageQueue.unshift(messageItem) // Add back to front
            await new Promise(resolve => setTimeout(resolve, 5000 * messageItem.retryCount))
          } else {
            this.securityMetrics.failedAttempts++
          }
        }
      }
    } finally {
      this.processingQueue = false
    }
  }

  async secureBroadcast(jids: string[], message: string): Promise<{ success: number, failed: number }> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp tidak terhubung secara aman')
    }

    if (this.securityMetrics.suspiciousActivity) {
      throw new Error('Broadcast diblokir karena aktivitas mencurigakan')
    }

    let success = 0
    let failed = 0
    
    // Process in small batches to avoid detection
    for (let i = 0; i < jids.length; i += SECURITY_CONFIG.BROADCAST_BATCH_SIZE) {
      const batch = jids.slice(i, i + SECURITY_CONFIG.BROADCAST_BATCH_SIZE)
      
      for (const jid of batch) {
        try {
          await this.sendSecureMessage(jid, message)
          success++
        } catch (error) {
          console.error(`Failed secure broadcast to ${jid}:`, error)
          failed++
        }
      }
      
      // Wait between batches
      if (i + SECURITY_CONFIG.BROADCAST_BATCH_SIZE < jids.length) {
        console.log(`Waiting ${SECURITY_CONFIG.BROADCAST_BATCH_DELAY}ms before next batch...`)
        await new Promise(resolve => setTimeout(resolve, SECURITY_CONFIG.BROADCAST_BATCH_DELAY))
      }
    }

    return { success, failed }
  }

  private clearAuthFiles() {
    try {
      const authDir = './auth_info_secure'
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true })
        console.log('Cleared secure auth files')
      }
    } catch (error) {
      console.error('Error clearing auth files:', error)
    }
  }

  async restorePermanentSession(): Promise<boolean> {
    try {
      console.log('🔄 Attempting to restore permanent session...')
      const authDir = './auth_info_secure'

      // Check if auth directory exists
      if (!require('fs').existsSync(authDir)) {
        console.log('No existing session found - will need QR scan')
        return false
      }

      const { state } = await useMultiFileAuthState(authDir)

      // Check if we have valid credentials (no time limit check)
      if (state.creds && Object.keys(state.creds).length > 0) {
        console.log('✅ Found permanent session - restoring without time limits')
        await this.initializeWhatsApp()
        return true
      } else {
        console.log('No existing session found - will need QR scan')
        return false
      }
    } catch (error) {
      console.error('Error restoring permanent session:', error)
      return false
    }
  }

  async secureDisconnect() {
    try {
      this.clearTimeouts()

      if (this.socket) {
        await this.socket.end(undefined)
        this.socket = null
      }

      this.isConnected = false
      this.isInitializing = false
      this.qrCode = null
      this.messageQueue = []
      this.processingQueue = false

      console.log('Secure disconnect completed')
    } catch (error) {
      console.error('Error during secure disconnect:', error)
    }
  }

  async logout() {
    try {
      if (this.socket) {
        await this.socket.logout()
      }
      this.clearAuthFiles()
    } catch (error) {
      console.error('Error during secure logout:', error)
    } finally {
      await this.secureDisconnect()
      this.reconnectAttempts = 0
      
      // Reset security metrics
      this.securityMetrics = {
        messagesThisMinute: 0,
        messagesThisHour: 0,
        lastMessageTime: 0,
        failedAttempts: 0,
        suspiciousActivity: false,
        rateLimitViolations: 0
      }
    }
  }

  // Getters
  getQR(): string | null {
    return this.qrCode
  }

  getConnectionState(): string {
    return this.connectionState
  }

  isReady(): boolean {
    return this.isConnected && !this.securityMetrics.suspiciousActivity
  }

  getSecurityMetrics(): SecurityMetrics {
    return { ...this.securityMetrics }
  }

  // Event handlers
  onQRCodeUpdate(callback: (qr: string) => void) {
    this.onQRUpdate = callback
  }

  onConnectionStateUpdate(callback: (state: string) => void) {
    this.onConnectionUpdate = callback
  }

  onMessage(callback: (message: WAMessage) => void) {
    this.onMessageReceived = callback
  }

  onSecurityAlertUpdate(callback: (alert: string) => void) {
    this.onSecurityAlert = callback
  }
}

export const secureWhatsAppService = new SecureWhatsAppService()
