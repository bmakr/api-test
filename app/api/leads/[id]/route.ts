import { ConnectionAndBody, Params, User } from 'types'
import { getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  save form inputs to `leads`
*/
export async function POSTS(req: NextRequest, { params }: Params) {
  // validate
  let redis, leads, sessionId
    try {
      // validate redis client
      // get redis based on meta from body
      const path = '/api/leads/[id]'
      const { conn } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn

      //validate id from params
      sessionId = params.id
      console.log('/leads', { sessionId })
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Internal error with /leads/params: our team is working on it' }, { status: 500 }
        )
      }
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /leads:validation:${e}` }, { status: 500 })
    }

    // check user isAdmin
    // return leads if true
    let list
    try {
      const userId = await redis.get(`sessions:${sessionId}:userId`)
      const user = await redis.get(`users:${userId}`) as User
      if (!user.roles.includes('admin')) {
        return NextResponse.json({ error: `Internal error: /leads user is not admin` }, { status: 500 })
      }

      // get data
      const enterprise = await redis.zrange(`leads:enterprise`, 0, -1)
      const hobby = await redis.zrange(`leads:hobby`, 0, -1)
      console.log({ enterprise }, { hobby })
      list = [enterprise, hobby]
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /leads get leads:${e}` }, { status: 500 })
    }

    return NextResponse.json({ data: list }, { status: 200 })
}