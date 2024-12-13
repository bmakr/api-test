import { Redis } from '@upstash/redis'
import { nowInSeconds } from 'lib'

type Play = {
  createdAt: number;
  deckId: number;
}

export async function getTodayTimestamps({ 
  key, 
  redis 
} : { 
  key: string; 
  redis: Redis;
}) {
  // Get today's start and end timestamps
  const now = nowInSeconds()
  const startOfDay = now - (now % 86400); // Round down to the start of the day
    const endOfDay = startOfDay + 86399; // End of day is start of day + 23:59:59
  console.log({startOfDay})
  console.log({endOfDay})
  console.log({ key })
  try {
    // Fetch timestamps from Redis
    const results = await redis.zrange(
      key, 
      startOfDay, 
      endOfDay, 
      { byScore: true }
    ) as Play[]
    console.log('getTodayTimestamps', { results })
    
    // Convert results to numbers
    return Array.isArray(results) ? results.map<number>((p) => p.createdAt) : []
  } catch (error) {
    console.error('Redis operation failed:', error)
    throw error
  }
}