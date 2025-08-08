interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  
  // Rate limits for WhatsApp operations
  private readonly QR_GENERATION_LIMIT = 3 // Max 3 QR generations
  private readonly QR_GENERATION_WINDOW = 60 * 60 * 1000 // Per hour
  
  private readonly CONNECTION_LIMIT = 5 // Max 5 connection attempts  
  private readonly CONNECTION_WINDOW = 30 * 60 * 1000 // Per 30 minutes

  checkQRGenerationLimit(identifier: string = 'default'): boolean {
    return this.checkLimit(`qr_${identifier}`, this.QR_GENERATION_LIMIT, this.QR_GENERATION_WINDOW)
  }

  checkConnectionLimit(identifier: string = 'default'): boolean {
    return this.checkLimit(`conn_${identifier}`, this.CONNECTION_LIMIT, this.CONNECTION_WINDOW)
  }

  private checkLimit(key: string, maxCount: number, windowMs: number): boolean {
    const now = Date.now()
    const entry = this.limits.get(key)

    if (!entry || now > entry.resetTime) {
      // First request or window expired
      this.limits.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return true
    }

    if (entry.count >= maxCount) {
      return false
    }

    entry.count++
    return true
  }

  getRemainingTime(key: string): number {
    const entry = this.limits.get(key)
    if (!entry) return 0
    
    const remaining = entry.resetTime - Date.now()
    return Math.max(0, remaining)
  }

  getQRRemainingTime(identifier: string = 'default'): number {
    return this.getRemainingTime(`qr_${identifier}`)
  }

  getConnectionRemainingTime(identifier: string = 'default'): number {
    return this.getRemainingTime(`conn_${identifier}`)
  }

  reset(identifier?: string) {
    if (identifier) {
      this.limits.delete(`qr_${identifier}`)
      this.limits.delete(`conn_${identifier}`)
    } else {
      this.limits.clear()
    }
  }
}

export const rateLimiter = new RateLimiter()
