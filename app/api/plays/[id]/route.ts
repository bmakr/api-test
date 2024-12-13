import { ConnectionAndBody, Params } from 'types'
import { NextRequest, NextResponse } from 'next/server'
import { getRedisFromEnv, nowInSeconds } from 'lib'

/*
  plays/[id]
  id === sessionId
  track plays over time
  in a sorted set 
  with key of users:[userId]:plays
  we track plays to ensure the user is not 
  abusing the free tier and/or that the user is not a robot
*/

export async function POST(req: NextRequest, { params } : Params) {
  // validate
  let redis, sessionId, deckId
  try {
    // get redis based on meta from body
    const path = '/api/plays/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn

    if (!body) {
      return NextResponse.json({ error: `Internal error: /plays/:validation:!body` }, { status: 500 })
    }

    if (!body.deckId) {
      return NextResponse.json({ error: `Internal error: /scores/incr:validation:body member or score missing` }, { status: 500 })
    }

    deckId = Number(body.deckId)
    sessionId = params.id
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: /plays/[id]]:validation:${e}` }, { status: 500 })
  }

  // set users:[userId]:plays
  try {
    const userId = await redis.get(`sessions:${sessionId}:userId`)
    console.log({ userId })
    const now = nowInSeconds()
    await redis.zadd(`users:${userId}:plays`, {
      score: now,
      member: JSON.stringify({
        deckId,
        createdAt: now
      })
  })
  } catch(e) {
    return NextResponse.json({ error: `Internal error: /plays/[id]]:set:${e}` }, { status: 500 })
  }

  return NextResponse.json({ status: 200 })
}