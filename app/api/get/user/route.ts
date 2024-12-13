import { ConnectionAndBody, Session, User } from 'types'
import { getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  2 optional inputs (but 1 must be passed): id or index (for indexed values)
  Step 1: Validate the request
  Step 2: return user from users:[id] or index (sessions:[id]:userId)
*/
export async function POST(req: NextRequest) {
    // validate
    let redis, index, id
    try {
      // get redis based on meta from body
      const path = '/api/get/user'
      const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn
      if (!redis) return NextResponse.json({ error: 'Internal error: redis' }, { status: 500 })

      // ensure either id or index have been passed
      if (!body.id && !body.index) {
        return NextResponse.json({ error: 'Internal error: body !id && !index' }, { status: 500 })
      }

      // ensure not both id and index have been passed
      if (body.id && body.index) {
        return NextResponse.json({ error: 'Internal error: body id && index' }, { status: 500 })
      }

      if (body.id) id = body.id
      if (body.index) index = body.index
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /login:validation:${e}` }, { status: 500 })
    }

    // if id, return item from table
    let user
    if (id) {
      try {
        user = await redis.get(`users:${id}`) as User
        if (!user) {
          return NextResponse.json({ error: `Internal error: /get:user from id` }, { status: 500 })
        }
      } catch(e) {
        console.error(e)
        return NextResponse.json({ error: `Internal error: /get:item from id:catch(e)${e}` }, { status: 500 })
      }

  // return item from index
    } else { 
      try {
        const userId = await redis.get(index) as Session
        if (!userId) {
          return NextResponse.json({ error: `Internal error: /get:session from index !userId` }, { status: 500 })
        }

        user = await redis.get(`users:${userId}`) as User
        if (!user) {
          return NextResponse.json({ error: `Internal error: /get:item from idFromIndex` }, { status: 500 })
        }
          
      } catch(e) {
        console.error(e)
        return NextResponse.json({ error: `Internal error: /get:item from index:catch(e)${e}` }, { status: 500 })
      }
    }    

    console.log('user:', user)  

    const data = {
      id: user.id, 
      roles: user.roles, 
      names: user.names, 
      isStripeCustomer: user.stripeCustomerId ? true : false 
    } 

    return NextResponse.json({ data }, { status: 200 })
}