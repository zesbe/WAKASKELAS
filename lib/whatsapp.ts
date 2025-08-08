import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  WAMessage,
  proto,
  MessageUpsertType,
  ConnectionState,
  jidNormalizedUser
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import pino from 'pino'

class WhatsAppService {
  private socket: ReturnType<typeof makeWASocket> | null = null
  private qrCode: string | null = null
  private isConnected: boolean = false
  private connectionState: string = 'close'
  private onQRUpdate?: (qr: string) => void
  private onConnectionUpdate?: (state: string) => void
  private onMessageReceived?: (message: WAMessage) => void
  private isInitializing: boolean = false
  private qrTimeout?: NodeJS.Timeout

  constructor() {
    // Don't auto-initialize on server startup
  }

  async initializeWhatsApp() {
    if (this.isInitializing) {
      console.log('WhatsApp already initializing')
      return
    }

    // Close existing socket if any
    if (this.socket) {
      console.log('Closing existing socket')
      try {
        this.socket.end()
      } catch (e) {}
      this.socket = null
    }

    this.isInitializing = true

    try {
      // Use persistent auth state (don't clear for session persistence)
      const { state, saveCreds } = await useMultiFileAuthState('./auth_info_baileys')

      // Check if we already have credentials (for auto-reconnect)
      const hasExistingCreds = state.creds && Object.keys(state.creds).length > 0

      if (hasExistingCreds) {
        console.log('Found existing credentials, attempting auto-reconnect...')
        this.qrCode = null
      } else {
        console.log('No existing credentials, will generate QR code')
        this.qrCode = null
        this.isConnected = false
      }
      
      console.log('Creating WhatsApp socket...')
      this.socket = makeWASocket({
        auth: state,
        logger: pino({ level: 'silent' }),
        browser: ['WhatsApp Gateway UMKM', 'Chrome', '1.0.0'],
        defaultQueryTimeoutMs: 60_000,
        generateHighQualityLinkPreview: true,
        markOnlineOnConnect: false
      })
      console.log('WhatsApp socket created')

      this.socket.ev.on('creds.update', saveCreds)
      
      this.socket.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update
        console.log('Connection update:', { connection, qr: qr ? 'YES' : 'NO' })

        if (qr) {
          console.log('QR received, generating...')
          this.generateQR(qr)
        }

        if (connection === 'close') {
          const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
          console.log('Connection closed due to ', lastDisconnect?.error)

          this.isConnected = false
          this.isInitializing = false

          // Only reconnect if it's a connection failure, not user logout or conflict
          if (shouldReconnect && lastDisconnect?.error?.output?.statusCode === 515) {
            console.log('Connection lost, will allow manual reconnect')
          } else {
            console.log('Connection closed. Manual reconnect required.')
          }
        } else if (connection === 'open') {
          console.log('WhatsApp connection opened successfully!')
          this.isConnected = true
          this.isInitializing = false
          this.qrCode = null

          // Clear QR timeout since we're connected
          if (this.qrTimeout) {
            clearTimeout(this.qrTimeout)
            this.qrTimeout = undefined
          }
        } else if (connection === 'connecting') {
          console.log('WhatsApp connecting...')
          this.isConnected = false
        }

        this.connectionState = connection || 'close'
        this.onConnectionUpdate?.(this.connectionState)
      })

      this.socket.ev.on('messages.upsert', ({ messages, type }: { messages: WAMessage[], type: MessageUpsertType }) => {
        if (type === 'notify') {
          messages.forEach((message) => {
            this.onMessageReceived?.(message)
          })
        }
      })

    } catch (error) {
      console.error('Error initializing WhatsApp:', error)
      this.isInitializing = false
    }
  }

  private async generateQR(qr: string) {
    try {
      console.log('Generating QR code...')
      this.qrCode = await QRCode.toDataURL(qr)
      console.log('QR code generated successfully:', this.qrCode ? 'YES' : 'NO')
      this.onQRUpdate?.(this.qrCode)

      // Clear existing timeout
      if (this.qrTimeout) {
        clearTimeout(this.qrTimeout)
      }

      // Set QR expiry timeout (60 seconds - longer to allow scanning)
      this.qrTimeout = setTimeout(() => {
        console.log('QR code expired, clearing...')
        this.qrCode = null
        // DON'T auto-reconnect - let user manually refresh
      }, 60000)

    } catch (error) {
      console.error('Error generating QR code:', error)
    }
  }

  async sendMessage(jid: string, message: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp belum terhubung')
    }

    try {
      await this.socket.sendMessage(jid, { text: message })
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  async restoreSession(): Promise<boolean> {
    try {
      console.log('Attempting to restore WhatsApp session...')
      const { state } = await useMultiFileAuthState('./auth_info_baileys')

      // Check if we have valid credentials
      if (state.creds && Object.keys(state.creds).length > 0) {
        await this.initializeWhatsApp()
        return true
      } else {
        console.log('No valid session found to restore')
        return false
      }
    } catch (error) {
      console.error('Error restoring session:', error)
      return false
    }
  }

  async broadcastMessage(jids: string[], message: string): Promise<{ success: number, failed: number }> {
    if (!this.socket || !this.isConnected) {
      throw new Error('WhatsApp belum terhubung')
    }

    let success = 0
    let failed = 0

    for (const jid of jids) {
      try {
        await this.socket.sendMessage(jid, { text: message })
        success++
        // Delay untuk menghindari spam detection
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        console.error(`Failed to send to ${jid}:`, error)
        failed++
      }
    }

    return { success, failed }
  }

  async getContacts() {
    if (!this.socket || !this.isConnected) {
      return []
    }

    try {
      const contacts = await this.socket.store?.contacts
      return Object.values(contacts || {}).map(contact => ({
        jid: contact.id,
        name: contact.name || contact.notify || contact.id.split('@')[0],
        isGroup: contact.id.includes('@g.us')
      }))
    } catch (error) {
      console.error('Error getting contacts:', error)
      return []
    }
  }

  getQR(): string | null {
    return this.qrCode
  }

  getConnectionState(): string {
    return this.connectionState
  }

  isReady(): boolean {
    return this.isConnected
  }

  onQRCodeUpdate(callback: (qr: string) => void) {
    this.onQRUpdate = callback
  }

  onConnectionStateUpdate(callback: (state: string) => void) {
    this.onConnectionUpdate = callback
  }

  onMessage(callback: (message: WAMessage) => void) {
    this.onMessageReceived = callback
  }

  async logout() {
    try {
      if (this.socket) {
        await this.socket.logout()
      }
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      this.socket = null
      this.isConnected = false
      this.isInitializing = false
      this.qrCode = null

      // Clear QR timeout
      if (this.qrTimeout) {
        clearTimeout(this.qrTimeout)
        this.qrTimeout = undefined
      }
    }
  }

  async clearAuthAndReconnect() {
    if (this.isInitializing) {
      console.log('Already initializing, skipping...')
      return
    }

    try {
      // Clear existing socket safely
      if (this.socket) {
        try {
          this.socket.end()
        } catch (e) {
          console.log('Socket already closed')
        }
        this.socket = null
      }

      // Clear timeouts
      if (this.qrTimeout) {
        clearTimeout(this.qrTimeout)
        this.qrTimeout = undefined
      }

      // Clear auth files to force new QR
      const fs = require('fs')
      const authDir = './auth_info_baileys'

      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true })
        console.log('Cleared auth state')
      }

      // Reset state
      this.isConnected = false
      this.isInitializing = false
      this.qrCode = null

      // Wait a bit before reinitializing
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Initialize fresh connection
      await this.initializeWhatsApp()
    } catch (error) {
      console.error('Error clearing auth:', error)
      this.isInitializing = false
    }
  }
}

export const whatsappService = new WhatsAppService()
