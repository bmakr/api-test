import { Redis } from '@upstash/redis'
import { KeyValues } from 'types'
import { getBody } from './getBody'
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { nowInSeconds } from 'lib'

const dbKvs: KeyValues = {
  production: {
    url: process.env.UPSTASH_REDIS_PRODUCTION_URL,
    token: process.env.UPSTASH_REDIS_PRODUCTION_TOKEN
  },
  development: {
    url: process.env.UPSTASH_REDIS_DEVELOPMENT_URL,
    token: process.env.UPSTASH_REDIS_DEVELOPMENT_TOKEN
  },
  staging: {
    url: process.env.UPSTASH_REDIS_STAGING_URL,
    token: process.env.UPSTASH_REDIS_STAGING_TOKEN
  },
  requests: {
    url: process.env.UPSTASH_REDIS_REQUESTS_URL,
    token: process.env.UPSTASH_REDIS_REQUESTS_TOKEN
  }
}

const currentDate = new Date();
const year = currentDate.getFullYear();
const month = currentDate.getMonth() + 1; // Add 1 to get the month in the range 1-12
const day = currentDate.getDate();
const date = year + "-" + month + "-" + day
console.log({ date })

async function saveRequest({ path, body, env }: { path: string; body: any; env: 'production' | 'development' | 'staging' }) {
  try {
    // prep data
    const data = { path, meta: body.meta, env, referer: '' }
    const headersList = await headers()
    const referer = headersList.get('referer') as string
    data.referer = referer
    console.log({ referer, path, env })
    const redis = new Redis(dbKvs.requests)
    if (!redis) throw new Error('Redis requests client not found')
    await redis.zadd(`${env}:${date}`, {
      score: nowInSeconds(),
      member: JSON.stringify({ ...data })
    })
  } catch(e) {
    console.error(e)
  }
  return
}

/*
  get redis instance
  based on meta.environment
  @params req
  @params req.body.meta
  @returns redis instance
*/

export async function getRedisFromEnv({ 
  req, 
  path
}: { 
  req: NextRequest; 
  path: string;
}) {
  // get environment from environment settings: process.env.ENV
  // development on the dev branch                  localhost:3000
  // staging on the stg branch/preview on vercel    actual.sh
  // production on the main branch                  actual.now    

  // validate
  try {
    // get body
    const body = await getBody({ req })
    if (!body) throw new Error('Body not found')

    // get environment
    const env = process.env.ENV as 'production' | 'development' | 'staging'
    console.log({ env })

    // get referrer from headers
    // and save it with meta and path to redis 'REQUESTS'
    // we do this to track all requests coming to the api by path
    await saveRequest({ path, body, env })
    
    // get redis based on environment
    const conn = new Redis(dbKvs[env])
    if (!conn) throw new Error('Redis client not found')
    return { conn, body }
  } catch(e) {
    console.error(e)
    return null
  }
} 
