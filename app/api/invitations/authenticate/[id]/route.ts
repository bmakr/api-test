import { 
  Action, ConnectionAndBody, Params, Session, User 
} from 'types'
import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { 
  createPasscode, getRedisFromEnv, nowInSeconds, requireAuthKey, send 
} from 'lib'

export async function POST(req: NextRequest, { params }: Params) {
  // validate auth bearer
  try {
    requireAuthKey({ req })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // validate
  let actionId: number, redis: Redis, email: string
  try {
    // validate redis client
    // get redis based on meta from body
    const path = '/api/invitations/authenticate/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn
    // validate params.id
    if (!params.id) throw new Error('params.id is required')
    actionId = parseInt(params.id)

    // validate req.body.email
    if (!body.email) throw new Error('req.body.email is required')
    email = body.email
  } catch(e) {
    return NextResponse.json({ error: `/api/invitations/authenticate/id validation catch ${e}` }, { status: 400 })
  }

  // send email optimistically
  let passcode, sessionId
  try {
    passcode = createPasscode()
    sessionId = await redis.incr('sessions:id:counter')
    console.log('api/invitation/authenticate/id', { sessionId })
    await send({ contentKey: 'verification', to: email, data: passcode.toString() })
  } catch(e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: sending email /login:${e}` }, { status: 500 })
  }

  // get action
  let userId
  try {
    const action = await redis.get(`actions:${actionId}`) as Action
    if (!action) throw new Error(`action ${actionId} not found`)
    userId = action.targetId as number
  } catch(e) {
    return NextResponse.json({ error: `/api/invitations/authenticate/id get action catch ${e}` }, { status: 500 })
  }

  // complete user
  try {
    // get existing user
    const user = await redis.get(`users:${userId}`) as User
    if (!user) throw new Error(`user ${userId} not found`)
    const now = nowInSeconds()
    const updated = {
      ...user,
      signedUpAt: now
    }
    // update user with passcode
    await redis.set(`users:${userId}`, updated)
  } catch(e) {
    return NextResponse.json({ error: `/api/invitations/authenticate/id complete user catch ${e}` }, { status: 500 })
  }

  // create new session
  // delete existing session if present
  // update user with new sessionId
  try {
    // get existing session id
    const existingSessionId = await redis.get(`users:${userId}:sessionId`) as number
    if (existingSessionId) {
      // delete existing session
      const pipe = redis.pipeline()
      pipe.del(`users:${userId}:sessionId`)
      pipe.del(`sessions:${existingSessionId}`)
      pipe.del(`sessions:${existingSessionId}:userId`)
      await pipe.exec()
    }
    // create session id for user
    const session: Session = { 
      id: sessionId, 
      userId,
      passcode, 
      createdAt: nowInSeconds() 
    }

    console.log('api/invitations/authenticate/id', { sessionId, session })

    // execute pipeline to create new session and delete old
    const pipe = redis.pipeline()
    // users:[useId]:sessionId
    pipe.set(`users:${userId}:sessionId`, sessionId) // userId index
    // sessions:[sessionId]:userId
    pipe.set(`sessions:${sessionId}:userId`, userId) // sessionId index
    // sessions:[sessionId]
    pipe.set(`sessions:${sessionId}`, session) // save session
    await pipe.exec()
  } catch(e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: /login:create,delete session:${e}` }, { status: 500 })
  }

  // success
  return NextResponse.json({ id: sessionId }, { status: 200 })
}