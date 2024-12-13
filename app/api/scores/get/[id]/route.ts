import { ConnectionAndBody, Params } from 'types'
import { getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'
import { getTotalScore } from 'lib'

/*
  /scores/get/[id]
  get the users score from 
  their sorted set (history of all scores)
  with key of `users:[userId]:scores` 
  INPUTS 
    - params.id (user.id)
  1. verify redis instance and all inputs (id, member, value)
  2. call function to return getTotalScore
  3. OUTPUT data: { totalScore }
*/

export async function POST(req: NextRequest, { params }: Params) {
    // validate
    let redis, userId
    try {
      // get redis based on meta from body
      const path = '/api/scores/get/[id]'
      const { conn } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn
  
      //validate id from params
      userId = Number(params.id)
      console.log('/scores/get', { userId })
      if (!userId) {
        return NextResponse.json(
          { error: 'Internal error: scores/get missing params.id' }, { status: 500 }
        )
      }
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /scores/get:validation:${e}` }, { status: 500 })
    }
  
    // get the sum of entries from users:[userId]:scores

    let totalScore
    try {
      const key = `users:${userId}:scores`
      totalScore = await getTotalScore({ 
        key,
        redis
      })
      console.log({ totalScore })
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /scores/get:save score:${e}` }, { status: 500 })
    }

    return NextResponse.json( { data: { totalScore }})
}
