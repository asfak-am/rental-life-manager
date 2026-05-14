const Redis = require('ioredis')

// Use REDIS_URL env var if provided, e.g. redis://:password@host:6379
const redisUrl = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://127.0.0.1:6379'

// Helpful runtime options (tunable via env)
const maxRetriesPerRequest = Number(process.env.REDIS_MAX_RETRIES || 5)
const connectTimeout = Number(process.env.REDIS_CONNECT_TIMEOUT || 10000)
const enableOfflineQueue = process.env.REDIS_OFFLINE_QUEUE === 'true' // default false

let client = null

try {
  const opts = {
    maxRetriesPerRequest,
    retryStrategy(times) {
      // exponential backoff capped at 2s
      return Math.min(times * 50, 2000)
    },
    reconnectOnError(err) {
      // try reconnect for connection reset or MOVED/READONLY errors
      if (!err) return false
      const msg = String(err.message || '')
      return msg.includes('READONLY') || msg.includes('MOVED') || err.code === 'ECONNRESET'
    },
    lazyConnect: true, // don't block startup
    enableOfflineQueue: enableOfflineQueue,
    connectTimeout,
  }

  client = new Redis(redisUrl, opts)

  client.on('connect', () => console.info('Redis: connecting...'))
  client.on('ready', () => console.info('Redis: ready'))
  client.on('error', (err) => console.error('Redis error:', err))
  client.on('close', () => console.warn('Redis: connection closed'))
  client.on('end', () => console.warn('Redis: connection ended'))

  // Try connecting but don't crash app if it fails
  client.connect().catch((err) => {
    console.warn('Redis connect failed (continuing without cache):', err && err.message ? err.message : err)
    // keep client instance but commands will fail — callers should guard `if (client)`
  })
} catch (err) {
  console.error('Failed to create Redis client', err)
  client = null
}

module.exports = client
