// next
export { getBody, getRedisFromEnv } from './next'

// upstash
export { getTotalScore, rateLimiter, getTodayTimestamps } from './upstash'

// auth
export { requireAuthKey } from './auth'

// validations
export { validateEmail, validateId, validatePasscode } from './validations'

// helpers
export function createId() {
  return crypto.randomUUID().toString()
}

export function nowInSeconds() {
  const now = Date.now()
  return Math.floor(now/1000)
}

export function createPasscode() {
  return Math.floor(100000 + Math.random() * 900000)
}

export { send, type Send } from './email'

export { teamsKv } from './teams'

export { titlePrompt } from './prompts'
