import { Duration, Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export async function rateLimiter({ 
  ip, 
  redis,
  attempts=10,
  window='60 s',
}: { 
  ip: string; 
  redis: Redis; 
  attempts?: number;
  window?: Duration
}) {
  // allows 5 requests per 60 seconds
  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(attempts, window), 
    analytics: true,
  })

  const { success } = await ratelimit.limit(ip)

  return { success }
}