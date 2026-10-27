import { nextUsage } from './assistant.js'

/** SQLite-backed Durable Object. Only counters are stored, never chat text. */
export class AssistantQuota {
  constructor(state) {
    this.state = state
  }

  async fetch(request) {
    if (request.method !== 'POST') {
      return new Response(null, { status: 405 })
    }
    const global = new URL(request.url).pathname === '/global'
    const limits = global ? { perMinute: 60, perDay: 500 } : { perMinute: 10, perDay: 100 }
    return this.state.blockConcurrencyWhile(async () => {
      const now = Date.now()
      const current = await this.state.storage.get('usage')
      const usage = nextUsage(current, now, limits)
      if (!usage) {
        const dayLimit = current?.day === Math.floor(now / 86400000) && current.dayCount >= limits.perDay
        const reset = dayLimit ? (Math.floor(now / 86400000) + 1) * 86400000 : (Math.floor(now / 60000) + 1) * 60000
        return Response.json({ allowed: false, retryAfter: Math.ceil((reset - now) / 1000) })
      }
      await this.state.storage.put('usage', usage)
      await this.state.storage.setAlarm((usage.day + 1) * 86400000)
      return Response.json({ allowed: true })
    })
  }

  async alarm() {
    const usage = await this.state.storage.get('usage')
    if (usage && usage.day >= Math.floor(Date.now() / 86400000)) {
      await this.state.storage.setAlarm((usage.day + 1) * 86400000)
    } else {
      await this.state.storage.deleteAll()
    }
  }
}
