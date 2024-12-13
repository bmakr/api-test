import { getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'
import { ConnectionAndBody } from 'types'

export async function POST(req: NextRequest) {
  // validate
  let key, payload, redis
  try {
    // get redis based on meta from body
    const path = '/api/update/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    // validate body.key && body.payload
    if (!body) return NextResponse.json({ error: `api/update/[id] - no body`}, { status: 500 })

    if (!body.key || !body.payload) return NextResponse.json({ error: `api/update/[id] - no body key or payload`}, { status: 500 })
    
      key = body.key
      console.log({ key })
      payload = JSON.stringify(body.payload)
      console.log({ payload })
  } catch(e) {
    console.log(e)
    return NextResponse.json(
      { error: 'Internal error: api/update/[id] - validate catch ${e}' }, 
      { status: 500 }
    )
  }

  if (!redis) {
    return NextResponse.json(
      { error: 'Internal error: redis' }, { status: 500 }
    )
  }

  // update
  try {
    const res = await redis.set(key, payload)
    console.log({ res })
    if (!res) return NextResponse.json(
      { error: 'Internal error: api/update/[id] - update' }, { status: 500 }
    )
  } catch(e) {
    return NextResponse.json(
      { error: `Internal error: api/update/[id] - update catch ${e}` }, 
      { status: 500 }
    )
  }

  return NextResponse.json({ status: 200 })
}