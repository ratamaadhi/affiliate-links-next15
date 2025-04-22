import Redis from 'ioredis'

let redis = process.env.REDIS_URL;

if (process.env.NODE_ENV === 'production') {
  // ✅ Production (e.g., Vercel + Upstash)
  redis = new Redis(process.env.REDIS_URL, {
    // optional: log friendly name
    name: 'vercel-prod-redis',
    // tls: process.env.REDIS_URL?.startsWith('rediss://') ? {} : undefined,
    reconnectOnError(err) {
      const targetError = "READONLY";
      if (err.message.includes(targetError)) {
        // Only reconnect when the error contains "READONLY"
        return true; // or `return 1;`
      }
    },
  })
} else {
  // ✅ Local development
  redis = new Redis({
    port: 6379,          // default Redis port
    host: '127.0.0.1',   // localhost
    // password: 'your_local_password', // kalau Redis lokal kamu ada password
  })
}

export { redis }
