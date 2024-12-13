import { ConnectionAndBody, Params } from 'types'
import { NextRequest, NextResponse } from 'next/server'
import { getRedisFromEnv, getTodayTimestamps } from 'lib'

/*
  api/plays/check/[id]
  id === sessionId
  checks if plays exceed total number of plays allotted for free user
  based on the sorted set 
  with key of users:[userId]:plays
  we track plays to ensure the user is not 
  abusing the free tier and/or that the user is not a robot
*/

const PLAYS_ALLOWED_PER_DAY = 10

export async function POST(req: NextRequest, { params } : Params) {
  // validate
  let redis, sessionId
  try {
    // get redis based on meta from body
    const path = '/api/plays/check/[id]'
    const { conn } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn
    sessionId = params.id
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: /plays/check/[id]]:validation:${e}` }, { status: 500 })
  }

  // set users:[userId]:plays
  try {
    const userId = await redis.get(`sessions:${sessionId}:userId`)
    const key = `users:${userId}:plays`
    const plays = await getTodayTimestamps({ key, redis })
    console.log({ plays })
    if (plays.length >= PLAYS_ALLOWED_PER_DAY) {
      return NextResponse.json({ data: {
        isWithinLimit: false 
    }}, { status: 200 })
    }
  } catch(e) {
    return NextResponse.json({ error: `Internal error: /plays/check/[id]]:set:${e}` }, { status: 500 })
  }

  return NextResponse.json({ data: { isWithinLimit : true }}, { status: 200 })
}
