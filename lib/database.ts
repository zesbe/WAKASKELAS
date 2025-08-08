import Database from 'better-sqlite3'
import path from 'path'

interface Contact {
  id: number
  jid: string
  name: string
  phone: string
  isGroup: boolean
  createdAt: string
}

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

interface MessageLog {
  id: number
  campaignId: number
  contactJid: string
  message: string
  status: 'sent' | 'failed'
  sentAt: string
  error?: string
}

interface KasEntry {
  id: number
  tanggal: string
  jenis: 'masuk' | 'keluar'
  keterangan: string
  jumlah: number
  kategori?: string
  createdAt: string
}

interface WaliMurid {
  id: number
  namaAnak: string
  namaPanggilan?: string
  namaWali: string
  noWhatsapp: string
  tagihan: number
  statusBayar: 'belum' | 'lunas'
  tanggalBayar?: string
  bulanTagihan: string
  payment_order_id?: string
  payment_amount?: number
  payment_method?: string
  payment_url?: string
  updated_at?: string
  createdAt: string
}

interface PaymentRequest {
  id: number
  student_id: number
  order_id: string
  amount: number
  payment_url: string
  status: 'pending' | 'completed' | 'failed' | 'expired'
  created_at: string
  completed_at?: string
}

interface PaymentLog {
  id: number
  student_id: number
  order_id: string
  amount: number
  status: string
  payment_method?: string
  completed_at?: string
  webhook_data?: string
  created_at: string
}

// Simple in-memory cache
class Cache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  set(key: string, data: any, ttlMs: number = 60000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    })
  }

  get(key: string): any {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  clear() {
    this.cache.clear()
  }

  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}

class DatabaseService {
  private db: Database.Database
  private cache = new Cache()
  private preparedStatements = new Map<string, Database.Statement>()

  constructor() {
    const dbPath = path.join(process.cwd(), 'data.db')
    this.db = new Database(dbPath)
    
    // Optimize database settings
    this.db.pragma('journal_mode = WAL')
    this.db.pragma('synchronous = NORMAL')
    this.db.pragma('cache_size = 10000')
    this.db.pragma('temp_store = MEMORY')
    this.db.pragma('mmap_size = 268435456') // 256MB
    
    this.initializeTables()
    this.prepareCommonStatements()
  }

  private prepareCommonStatements() {
    // Prepare frequently used statements for better performance
    // Note: We need to prepare these after table initialization
    try {
      const statements = {
        getAllWaliMurid: 'SELECT * FROM wali_murid ORDER BY namaAnak',
        getWaliMuridById: 'SELECT * FROM wali_murid WHERE id = ?',
        getAllKasEntries: 'SELECT * FROM kas_entries ORDER BY tanggal DESC, createdAt DESC',
        getKasEntryById: 'SELECT * FROM kas_entries WHERE id = ?',
        getUnpaidStudents: 'SELECT * FROM wali_murid WHERE statusBayar = ? ORDER BY namaAnak',
        getPaidStudents: 'SELECT * FROM wali_murid WHERE statusBayar = ? ORDER BY tanggalBayar DESC',
        getAllContacts: 'SELECT * FROM contacts ORDER BY name',
        getAllCampaigns: 'SELECT * FROM campaigns ORDER BY createdAt DESC'
      }

      for (const [key, sql] of Object.entries(statements)) {
        this.preparedStatements.set(key, this.db.prepare(sql))
      }
    } catch (error) {
      console.error('Error preparing statements:', error)
      // If preparation fails, we'll use regular queries
    }
  }

  private initializeTables() {
    const statements = [
      `CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        isGroup BOOLEAN DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS campaigns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        message TEXT NOT NULL,
        targetCount INTEGER DEFAULT 0,
        sentCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'draft',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        sentAt DATETIME
      )`,
      `CREATE TABLE IF NOT EXISTS message_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaignId INTEGER,
        contactJid TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL,
        sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        error TEXT,
        FOREIGN KEY (campaignId) REFERENCES campaigns (id)
      )`,
      `CREATE TABLE IF NOT EXISTS kas_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tanggal DATE NOT NULL,
        jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
        keterangan TEXT NOT NULL,
        jumlah INTEGER NOT NULL,
        kategori TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS wali_murid (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        namaAnak TEXT NOT NULL,
        namaWali TEXT NOT NULL,
        noWhatsapp TEXT NOT NULL,
        tagihan INTEGER NOT NULL,
        statusBayar TEXT DEFAULT 'belum' CHECK (statusBayar IN ('belum', 'lunas')),
        tanggalBayar DATETIME,
        bulanTagihan TEXT NOT NULL,
        payment_order_id TEXT,
        payment_amount INTEGER,
        payment_method TEXT,
        payment_url TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS payment_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        order_id TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        payment_url TEXT NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (student_id) REFERENCES wali_murid (id)
      )`,
      `CREATE TABLE IF NOT EXISTS payment_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER NOT NULL,
        order_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL,
        payment_method TEXT,
        completed_at DATETIME,
        webhook_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES wali_murid (id)
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL,
        isActive BOOLEAN DEFAULT 1,
        lastLogin DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ]

    const transaction = this.db.transaction(() => {
      for (const sql of statements) {
        this.db.exec(sql)
      }
    })

    transaction()

    // Add columns if they don't exist
    try {
      this.db.exec(`ALTER TABLE kas_entries ADD COLUMN kategori TEXT`)
    } catch (error) {
      // Column might already exist
    }

    try {
      this.db.exec(`ALTER TABLE wali_murid ADD COLUMN payment_order_id TEXT`)
      this.db.exec(`ALTER TABLE wali_murid ADD COLUMN payment_amount INTEGER`)
      this.db.exec(`ALTER TABLE wali_murid ADD COLUMN payment_method TEXT`)
      this.db.exec(`ALTER TABLE wali_murid ADD COLUMN payment_url TEXT`)
      this.db.exec(`ALTER TABLE wali_murid ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`)
      this.db.exec(`ALTER TABLE wali_murid ADD COLUMN namaPanggilan TEXT`)
    } catch (error) {
      // Columns might already exist
    }

    // Create indexes for better performance
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_wali_murid_status ON wali_murid(statusBayar)',
      'CREATE INDEX IF NOT EXISTS idx_kas_entries_tanggal ON kas_entries(tanggal)',
      'CREATE INDEX IF NOT EXISTS idx_kas_entries_jenis ON kas_entries(jenis)',
      'CREATE INDEX IF NOT EXISTS idx_payment_requests_student ON payment_requests(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_payment_logs_student ON payment_logs(student_id)',
      'CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status)',
      'CREATE INDEX IF NOT EXISTS idx_contacts_jid ON contacts(jid)'
    ]

    for (const indexSql of indexes) {
      try {
        this.db.exec(indexSql)
      } catch (error) {
        // Index might already exist
      }
    }
  }

  // Contact methods with caching
  addContact(jid: string, name: string, phone?: string, isGroup: boolean = false): Contact {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO contacts (jid, name, phone, isGroup)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(jid, name, phone, isGroup ? 1 : 0)
    
    this.cache.invalidate('contacts')
    return this.getContact(result.lastInsertRowid as number)!
  }

  getContact(id: number): Contact | null {
    const cacheKey = `contact:${id}`
    let contact = this.cache.get(cacheKey)

    if (!contact) {
      const stmt = this.db.prepare('SELECT * FROM contacts WHERE id = ?')
      contact = stmt.get(id) as Contact | null
      if (contact) {
        this.cache.set(cacheKey, contact, 300000) // 5 minutes
      }
    }

    return contact
  }

  getAllContacts(): Contact[] {
    const cacheKey = 'contacts:all'
    let contacts = this.cache.get(cacheKey)

    if (!contacts) {
      const stmt = this.preparedStatements.get('getAllContacts')
      if (stmt) {
        contacts = stmt.all() as Contact[]
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM contacts ORDER BY name')
        contacts = fallbackStmt.all() as Contact[]
      }
      this.cache.set(cacheKey, contacts, 60000) // 1 minute
    }

    return contacts
  }

  searchContacts(query: string): Contact[] {
    const stmt = this.db.prepare(`
      SELECT * FROM contacts 
      WHERE name LIKE ? OR phone LIKE ? OR jid LIKE ?
      ORDER BY name
    `)
    const searchTerm = `%${query}%`
    return stmt.all(searchTerm, searchTerm, searchTerm) as Contact[]
  }

  deleteContact(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM contacts WHERE id = ?')
    const result = stmt.run(id)
    this.cache.invalidate('contacts')
    return result.changes > 0
  }

  // Campaign methods with caching
  createCampaign(name: string, message: string): Campaign {
    const stmt = this.db.prepare(`
      INSERT INTO campaigns (name, message)
      VALUES (?, ?)
    `)
    const result = stmt.run(name, message)
    
    this.cache.invalidate('campaigns')
    return this.getCampaign(result.lastInsertRowid as number)!
  }

  getCampaign(id: number): Campaign | null {
    const cacheKey = `campaign:${id}`
    let campaign = this.cache.get(cacheKey)

    if (!campaign) {
      const stmt = this.db.prepare('SELECT * FROM campaigns WHERE id = ?')
      campaign = stmt.get(id) as Campaign | null
      if (campaign) {
        this.cache.set(cacheKey, campaign, 300000) // 5 minutes
      }
    }

    return campaign
  }

  getAllCampaigns(): Campaign[] {
    const cacheKey = 'campaigns:all'
    let campaigns = this.cache.get(cacheKey)

    if (!campaigns) {
      const stmt = this.preparedStatements.get('getAllCampaigns')
      if (stmt) {
        campaigns = stmt.all() as Campaign[]
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM campaigns ORDER BY createdAt DESC')
        campaigns = fallbackStmt.all() as Campaign[]
      }
      this.cache.set(cacheKey, campaigns, 60000) // 1 minute
    }

    return campaigns
  }

  updateCampaignStatus(id: number, status: Campaign['status'], sentCount?: number): boolean {
    const stmt = this.db.prepare(`
      UPDATE campaigns 
      SET status = ?, sentCount = COALESCE(?, sentCount), sentAt = CASE WHEN ? = 'sending' THEN CURRENT_TIMESTAMP ELSE sentAt END
      WHERE id = ?
    `)
    const result = stmt.run(status, sentCount, status, id)
    this.cache.invalidate('campaigns')
    return result.changes > 0
  }

  deleteCampaign(id: number): boolean {
    const transaction = this.db.transaction(() => {
      const deleteLogsStmt = this.db.prepare('DELETE FROM message_logs WHERE campaignId = ?')
      deleteLogsStmt.run(id)
      
      const stmt = this.db.prepare('DELETE FROM campaigns WHERE id = ?')
      return stmt.run(id)
    })
    
    const result = transaction()
    this.cache.invalidate('campaigns')
    return result.changes > 0
  }

  // Message log methods
  addMessageLog(campaignId: number, contactJid: string, message: string, status: 'sent' | 'failed', error?: string): MessageLog {
    const stmt = this.db.prepare(`
      INSERT INTO message_logs (campaignId, contactJid, message, status, error)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(campaignId, contactJid, message, status, error)
    
    return this.getMessageLog(result.lastInsertRowid as number)!
  }

  getMessageLog(id: number): MessageLog | null {
    const stmt = this.db.prepare('SELECT * FROM message_logs WHERE id = ?')
    return stmt.get(id) as MessageLog | null
  }

  getCampaignLogs(campaignId: number): MessageLog[] {
    const stmt = this.db.prepare('SELECT * FROM message_logs WHERE campaignId = ? ORDER BY sentAt DESC')
    return stmt.all(campaignId) as MessageLog[]
  }

  // Kas Entry methods with caching
  addKasEntry(tanggal: string, jenis: 'masuk' | 'keluar', keterangan: string, jumlah: number, kategori?: string): KasEntry {
    const stmt = this.db.prepare(`
      INSERT INTO kas_entries (tanggal, jenis, keterangan, jumlah, kategori)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(tanggal, jenis, keterangan, jumlah, kategori)

    this.cache.invalidate('kas')
    return this.getKasEntry(result.lastInsertRowid as number)!
  }

  getKasEntry(id: number): KasEntry | null {
    const cacheKey = `kas:${id}`
    let entry = this.cache.get(cacheKey)

    if (!entry) {
      const stmt = this.preparedStatements.get('getKasEntryById')
      if (stmt) {
        entry = stmt.get(id) as KasEntry | null
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM kas_entries WHERE id = ?')
        entry = fallbackStmt.get(id) as KasEntry | null
      }
      if (entry) {
        this.cache.set(cacheKey, entry, 300000) // 5 minutes
      }
    }

    return entry
  }

  getAllKasEntries(): KasEntry[] {
    const cacheKey = 'kas:all'
    let entries = this.cache.get(cacheKey)

    if (!entries) {
      const stmt = this.preparedStatements.get('getAllKasEntries')
      if (stmt) {
        entries = stmt.all() as KasEntry[]
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM kas_entries ORDER BY tanggal DESC, createdAt DESC')
        entries = fallbackStmt.all() as KasEntry[]
      }
      this.cache.set(cacheKey, entries, 30000) // 30 seconds
    }

    return entries
  }

  updateKasEntry(id: number, tanggal: string, jenis: 'masuk' | 'keluar', keterangan: string, jumlah: number, kategori?: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE kas_entries
      SET tanggal = ?, jenis = ?, keterangan = ?, jumlah = ?, kategori = ?
      WHERE id = ?
    `)
    const result = stmt.run(tanggal, jenis, keterangan, jumlah, kategori, id)
    this.cache.invalidate('kas')
    return result.changes > 0
  }

  deleteKasEntry(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM kas_entries WHERE id = ?')
    const result = stmt.run(id)
    this.cache.invalidate('kas')
    return result.changes > 0
  }

  // Wali Murid methods with caching
  addWaliMurid(namaAnak: string, namaWali: string, noWhatsapp: string, tagihan: number, statusBayar: 'belum' | 'lunas', bulanTagihan: string, namaPanggilan?: string): WaliMurid {
    const stmt = this.db.prepare(`
      INSERT INTO wali_murid (namaAnak, namaPanggilan, namaWali, noWhatsapp, tagihan, statusBayar, bulanTagihan, tanggalBayar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const tanggalBayar = statusBayar === 'lunas' ? new Date().toISOString() : null
    const result = stmt.run(namaAnak, namaPanggilan, namaWali, noWhatsapp, tagihan, statusBayar, bulanTagihan, tanggalBayar)

    this.cache.invalidate('wali')
    return this.getWaliMurid(result.lastInsertRowid as number)!
  }

  getWaliMurid(id: number): WaliMurid | null {
    const cacheKey = `wali:${id}`
    let wali = this.cache.get(cacheKey)

    if (!wali) {
      const stmt = this.preparedStatements.get('getWaliMuridById')
      if (stmt) {
        wali = stmt.get(id) as WaliMurid | null
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM wali_murid WHERE id = ?')
        wali = fallbackStmt.get(id) as WaliMurid | null
      }
      if (wali) {
        this.cache.set(cacheKey, wali, 300000) // 5 minutes
      }
    }

    return wali
  }

  getAllWaliMurid(): WaliMurid[] {
    const cacheKey = 'wali:all'
    let waliMurid = this.cache.get(cacheKey)

    if (!waliMurid) {
      const stmt = this.preparedStatements.get('getAllWaliMurid')
      if (stmt) {
        waliMurid = stmt.all() as WaliMurid[]
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM wali_murid ORDER BY namaAnak')
        waliMurid = fallbackStmt.all() as WaliMurid[]
      }
      this.cache.set(cacheKey, waliMurid, 30000) // 30 seconds
    }

    return waliMurid
  }

  updateWaliMurid(id: number, namaAnak: string, namaWali: string, noWhatsapp: string, tagihan: number, statusBayar: 'belum' | 'lunas', bulanTagihan: string, namaPanggilan?: string): boolean {
    const tanggalBayar = statusBayar === 'lunas' ? new Date().toISOString() : null
    const stmt = this.db.prepare(`
      UPDATE wali_murid
      SET namaAnak = ?, namaPanggilan = ?, namaWali = ?, noWhatsapp = ?, tagihan = ?, statusBayar = ?, bulanTagihan = ?, tanggalBayar = ?
      WHERE id = ?
    `)
    const result = stmt.run(namaAnak, namaPanggilan, namaWali, noWhatsapp, tagihan, statusBayar, bulanTagihan, tanggalBayar, id)
    this.cache.invalidate('wali')
    return result.changes > 0
  }

  updateWaliMuridStatus(id: number, statusBayar: 'belum' | 'lunas'): boolean {
    const tanggalBayar = statusBayar === 'lunas' ? new Date().toISOString() : null
    const stmt = this.db.prepare(`
      UPDATE wali_murid
      SET statusBayar = ?, tanggalBayar = ?
      WHERE id = ?
    `)
    const result = stmt.run(statusBayar, tanggalBayar, id)
    this.cache.invalidate('wali')
    return result.changes > 0
  }

  deleteWaliMurid(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM wali_murid WHERE id = ?')
    const result = stmt.run(id)
    this.cache.invalidate('wali')
    return result.changes > 0
  }

  // Payment Request methods
  addPaymentRequest(student_id: number, order_id: string, amount: number, payment_url: string): PaymentRequest {
    const stmt = this.db.prepare(`
      INSERT INTO payment_requests (student_id, order_id, amount, payment_url)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(student_id, order_id, amount, payment_url)
    return this.getPaymentRequest(result.lastInsertRowid as number)!
  }

  getPaymentRequest(id: number): PaymentRequest | null {
    const stmt = this.db.prepare('SELECT * FROM payment_requests WHERE id = ?')
    return stmt.get(id) as PaymentRequest | null
  }

  getPaymentRequestByOrderId(order_id: string): PaymentRequest | null {
    const stmt = this.db.prepare('SELECT * FROM payment_requests WHERE order_id = ?')
    return stmt.get(order_id) as PaymentRequest | null
  }

  updatePaymentRequestStatus(order_id: string, status: PaymentRequest['status'], completed_at?: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE payment_requests
      SET status = ?, completed_at = ?
      WHERE order_id = ?
    `)
    const result = stmt.run(status, completed_at, order_id)
    return result.changes > 0
  }

  getStudentPaymentRequests(student_id: number): PaymentRequest[] {
    const stmt = this.db.prepare('SELECT * FROM payment_requests WHERE student_id = ? ORDER BY created_at DESC')
    return stmt.all(student_id) as PaymentRequest[]
  }

  // Payment Log methods
  addPaymentLog(student_id: number, order_id: string, amount: number, status: string, payment_method?: string, completed_at?: string, webhook_data?: string): PaymentLog {
    const stmt = this.db.prepare(`
      INSERT INTO payment_logs (student_id, order_id, amount, status, payment_method, completed_at, webhook_data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(student_id, order_id, amount, status, payment_method, completed_at, webhook_data)
    return this.getPaymentLog(result.lastInsertRowid as number)!
  }

  getPaymentLog(id: number): PaymentLog | null {
    const stmt = this.db.prepare('SELECT * FROM payment_logs WHERE id = ?')
    return stmt.get(id) as PaymentLog | null
  }

  getStudentPaymentLogs(student_id: number): PaymentLog[] {
    const stmt = this.db.prepare('SELECT * FROM payment_logs WHERE student_id = ? ORDER BY created_at DESC')
    return stmt.all(student_id) as PaymentLog[]
  }

  getAllPaymentLogs(): PaymentLog[] {
    const stmt = this.db.prepare(`
      SELECT pl.*, wm.namaAnak, wm.namaWali
      FROM payment_logs pl
      JOIN wali_murid wm ON pl.student_id = wm.id
      ORDER BY pl.created_at DESC
    `)
    return stmt.all() as PaymentLog[]
  }

  // Enhanced Wali Murid methods with payment info
  updateWaliMuridPayment(id: number, payment_order_id: string, payment_amount: number, payment_method: string, statusBayar: 'lunas', tanggalBayar: string): boolean {
    const stmt = this.db.prepare(`
      UPDATE wali_murid
      SET statusBayar = ?, tanggalBayar = ?, payment_order_id = ?, payment_amount = ?, payment_method = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    const result = stmt.run(statusBayar, tanggalBayar, payment_order_id, payment_amount, payment_method, id)
    this.cache.invalidate('wali')
    return result.changes > 0
  }

  getUnpaidStudents(): WaliMurid[] {
    const cacheKey = 'wali:unpaid'
    let students = this.cache.get(cacheKey)

    if (!students) {
      const stmt = this.preparedStatements.get('getUnpaidStudents')
      if (stmt) {
        students = stmt.all('belum') as WaliMurid[]
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM wali_murid WHERE statusBayar = ? ORDER BY namaAnak')
        students = fallbackStmt.all('belum') as WaliMurid[]
      }
      this.cache.set(cacheKey, students, 30000) // 30 seconds
    }

    return students
  }

  getPaidStudents(): WaliMurid[] {
    const cacheKey = 'wali:paid'
    let students = this.cache.get(cacheKey)

    if (!students) {
      const stmt = this.preparedStatements.get('getPaidStudents')
      if (stmt) {
        students = stmt.all('lunas') as WaliMurid[]
      } else {
        // Fallback to direct query
        const fallbackStmt = this.db.prepare('SELECT * FROM wali_murid WHERE statusBayar = ? ORDER BY tanggalBayar DESC')
        students = fallbackStmt.all('lunas') as WaliMurid[]
      }
      this.cache.set(cacheKey, students, 30000) // 30 seconds
    }

    return students
  }

  // Statistics with caching
  getStats() {
    const cacheKey = 'stats:all'
    let stats = this.cache.get(cacheKey)
    
    if (!stats) {
      try {
        const totalContacts = this.db.prepare('SELECT COUNT(*) as count FROM contacts').get() as { count: number }
        const totalCampaigns = this.db.prepare('SELECT COUNT(*) as count FROM campaigns').get() as { count: number }

        let totalMessages = { count: 0 }
        let successfulMessages = { count: 0 }
        try {
          totalMessages = this.db.prepare('SELECT COUNT(*) as count FROM message_logs').get() as { count: number }
          successfulMessages = this.db.prepare("SELECT COUNT(*) as count FROM message_logs WHERE status = 'sent'").get() as { count: number }
        } catch (error) {
          console.log('message_logs table not found, using default values')
        }

        const totalStudents = this.db.prepare('SELECT COUNT(*) as count FROM wali_murid').get() as { count: number }
        const paidStudents = this.db.prepare("SELECT COUNT(*) as count FROM wali_murid WHERE statusBayar = 'lunas'").get() as { count: number }

        let totalPayments = { count: 0 }
        let totalRevenue = { total: 0 }
        try {
          totalPayments = this.db.prepare("SELECT COUNT(*) as count FROM payment_logs WHERE status = 'completed'").get() as { count: number }
        } catch (error) {
          console.log('payment_logs table not found, using default values')
        }

        try {
          totalRevenue = this.db.prepare("SELECT COALESCE(SUM(payment_amount), 0) as total FROM wali_murid WHERE statusBayar = 'lunas'").get() as { total: number }
        } catch (error) {
          totalRevenue = this.db.prepare("SELECT COALESCE(SUM(tagihan), 0) as total FROM wali_murid WHERE statusBayar = 'lunas'").get() as { total: number }
        }

        stats = {
          totalContacts: totalContacts.count,
          totalCampaigns: totalCampaigns.count,
          totalMessages: totalMessages.count,
          successfulMessages: successfulMessages.count,
          successRate: totalMessages.count > 0 ? (successfulMessages.count / totalMessages.count) * 100 : 0,
          totalStudents: totalStudents.count,
          paidStudents: paidStudents.count,
          unpaidStudents: totalStudents.count - paidStudents.count,
          paymentRate: totalStudents.count > 0 ? (paidStudents.count / totalStudents.count) * 100 : 0,
          totalPayments: totalPayments.count,
          totalRevenue: totalRevenue.total
        }
        
        this.cache.set(cacheKey, stats, 60000) // Cache for 1 minute
      } catch (error) {
        console.error('Error in getStats:', error)
        stats = {
          totalContacts: 0,
          totalCampaigns: 0,
          totalMessages: 0,
          successfulMessages: 0,
          successRate: 0,
          totalStudents: 0,
          paidStudents: 0,
          unpaidStudents: 0,
          paymentRate: 0,
          totalPayments: 0,
          totalRevenue: 0
        }
      }
    }
    
    return stats
  }

  // Cache management methods
  // User management methods
  createUser(userData: any): number {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, name, passwordHash, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      userData.username,
      userData.email,
      userData.name,
      userData.passwordHash,
      userData.role.name,
      userData.isActive ? 1 : 0,
      userData.createdAt,
      userData.updatedAt
    )

    this.cache.invalidate('users')
    return result.lastInsertRowid as number
  }

  getUserById(id: number): any | null {
    const cacheKey = `user:${id}`
    let user = this.cache.get(cacheKey)

    if (!user) {
      const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?')
      const dbUser = stmt.get(id) as any
      if (dbUser) {
        user = this.mapDbUserToUser(dbUser)
        this.cache.set(cacheKey, user, 300000) // 5 minutes
      }
    }

    return user
  }

  getUserByUsername(username: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?')
    const dbUser = stmt.get(username) as any
    return dbUser ? this.mapDbUserToUser(dbUser) : null
  }

  getUserByEmail(email: string): any | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?')
    const dbUser = stmt.get(email) as any
    return dbUser ? this.mapDbUserToUser(dbUser) : null
  }

  getAllUsers(): any[] {
    const cacheKey = 'users:all'
    let users = this.cache.get(cacheKey)

    if (!users) {
      const stmt = this.db.prepare('SELECT * FROM users ORDER BY name')
      const dbUsers = stmt.all() as any[]
      users = dbUsers.map(dbUser => this.mapDbUserToUser(dbUser))
      this.cache.set(cacheKey, users, 60000) // 1 minute
    }

    return users
  }

  updateUser(id: number, updates: any): boolean {
    const fields = []
    const values = []

    for (const [key, value] of Object.entries(updates)) {
      if (key === 'role') {
        fields.push('role = ?')
        values.push((value as any).name)
      } else {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    values.push(id)

    const stmt = this.db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `)
    const result = stmt.run(...values)

    this.cache.invalidate('users')
    this.cache.invalidate(`user:${id}`)

    return result.changes > 0
  }

  deleteUser(id: number): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)

    this.cache.invalidate('users')
    this.cache.invalidate(`user:${id}`)

    return result.changes > 0
  }

  private mapDbUserToUser(dbUser: any): any {
    const { ROLES } = require('./auth')
    const role = Object.values(ROLES).find((r: any) => r.name === dbUser.role) || ROLES.VIEWER

    return {
      id: dbUser.id.toString(),
      username: dbUser.username,
      email: dbUser.email,
      name: dbUser.name,
      passwordHash: dbUser.passwordHash,
      role,
      permissions: (role as any).permissions,
      isActive: Boolean(dbUser.isActive),
      lastLogin: dbUser.lastLogin,
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt
    }
  }

  clearCache() {
    this.cache.clear()
  }

  invalidateCache(pattern: string) {
    this.cache.invalidate(pattern)
  }

  close() {
    this.db.close()
  }
}

export const db = new DatabaseService()

export function initDb() {
  return db
}
