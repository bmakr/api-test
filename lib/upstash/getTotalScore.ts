import { Redis } from '@upstash/redis'

export async function getTotalScore({ 
  key, 
  redis 
}: { 
  key: string; 
  redis: Redis 
}) {
  // Fetch all members with their scores
  const members: number[] = await redis.zrange(key, 0, -1, { withScores: true });

  console.log({ members })
  
  // Sum up all scores
  const scores = members.filter((member, i) => {
    if (i % 2 !== 0) return member
  })
  console.log({ scores })
    
  const totalScore = scores.reduce((sum, score) => sum + score, 0)
  
  return totalScore
}