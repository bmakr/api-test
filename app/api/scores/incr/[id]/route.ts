import { ConnectionAndBody, Params } from 'types'
import { getRedisFromEnv, nowInSeconds } from 'lib'
import { NextRequest, NextResponse } from 'next/server'
import { getTotalScore } from 'lib'

/*
  /scores/incr/[id]
  increment the users score by incrementing 
  their sorted set (history of all scores)
  with key of `users:[userId]:scores` 
  INPUTS 
    - params.id (user.id)
    - body: {
      member: number; (deck.id)
      value: number; (score to document) 
    }
  1. verify redis instance and all inputs (id, member, value)
  2. zadd member and score
  3. OUTPUT data: { prevScore, totalScore }
*/

export async function POST(req: NextRequest, { params }: Params) {
    // validate
    let redis, sessionId, member, score, results, deckId
    try {
      // get redis based on meta from body
      const path = '/api/scores/incr/[id]'
      const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn
  
      //validate id from params
      sessionId = Number(params.id)
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Internal error: scores/incr missing params.id' }, { status: 500 }
        )
      }

      // get input code from body
      if (!body) {
        return NextResponse.json({ error: `Internal error: /create/deck:validation:!body` }, { status: 500 })
      }

      if (!body.member || !body.score || !body.results || !body.deckId) {
        return NextResponse.json({ error: `Internal error: /scores/incr:validation:body member or score missing` }, { status: 500 })
      }

      member = body.member
      score = body.score
      results = body.results
      deckId = body.deckId
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /scores/incr:validation:${e}` }, { status: 500 })
    }

    // update user.results:[userId]
    let userId
    try {
      userId = await redis.get(`sessions:${sessionId}:userId`)
      // save results to array of all results
      const key = `users:${userId}:results`
      const now = nowInSeconds()
      const resultsWithDeckId = { 
        ...results,
        deckId,
        createdAt: now
      }
      
      console.log({ now })
      await redis.zadd(key, {
        score: now,
        member: JSON.stringify(resultsWithDeckId)
      })
    } catch(e) {
      return NextResponse.json({ error: `Internal error: /scores/incr:update user:results:[userId]:${e}` }, { status: 500 })      
    }
  
    // get prevScore
    // update users:[userId]:scores
    // get new totalScore
    // 
    let prevScore, totalScore
    try {
      const key = `users:${userId}:scores`
      prevScore = await getTotalScore({ 
        key,
        redis
      })
      await redis.zadd(key, {
        member,
        score
      })
      totalScore = await getTotalScore({ key, redis })
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /scores/incr:save score:${e}` }, { status: 500 })
    }

    return NextResponse.json( { data: { prevScore, totalScore }})
}
