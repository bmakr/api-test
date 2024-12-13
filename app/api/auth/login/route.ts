import { NextRequest, NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'
import { 
  createPasscode, getRedisFromEnv, nowInSeconds, requireAuthKey, send, validateEmail
} from 'lib'
import { ConnectionAndBody, Session } from 'types'

/*
  login route
  POST /api/auth/login
  input body: { val: string } as stringified JSON
  output: { passcodeId: string } as JSON

  validate email
  check for existing email
  If email is not in db, return error

  Send email with passcode
  Save new session
  If previous session exists, delete it
  Update user
*/

export async function POST(req: NextRequest) {
  // Remove the OPTIONS check here since it's handled in middleware
  try {
    requireAuthKey({ req })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // validate
  let redis, email, userId
  try {
    // get redis based on meta from body
    const path = '/api/auth/login'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn
    const { val, metadata } = body

    console.log({ metadata })

    // Validate email
    email = val
    await validateEmail({ email })

    // Check for existing email
    userId = await redis.get(`users:emails:${email}`)
    if (!userId) {
      return NextResponse.json({ error: 'That email is not in our db. Try again.', status: 400 })
    }

    userId = Number(userId)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Internal error. /login:userId NaN', status: 500 })
    }
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: /login:validation:${e}` }, { status: 500 })
  }

  // send email optimistically
  let passcode, sessionId
  try {
    passcode = createPasscode()
    sessionId = await redis.incr('sessions:id:counter')
    await send({ contentKey: 'verification', to: email, data: passcode.toString() })
  } catch(e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: sending email /login:${e}` }, { status: 500 })
  }

  // create new session
  // delete existing session if present
  // update user with new sessionId
  try {
    // get existing session id for user
    const existingSessionId = await redis.get(`users:${userId}:sessionId`)
    const session: Session = { 
      id: sessionId, 
      userId,
      passcode, 
      createdAt: nowInSeconds() 
    }

    // execute pipeline to create new session and delete old
    const pipe = redis.pipeline()
    // users:[useId]:sessionId
    pipe.del(`users:${userId}:sessionId`) // delete existing index
    pipe.set(`users:${userId}:sessionId`, sessionId) // userId index
    // sessions:[sessionId]:userId
    pipe.del(`sessions:${existingSessionId}:userId`) // delete existing index
    pipe.set(`sessions:${sessionId}:userId`, userId) // sessionId index
    // sessions:[sessionId]
    pipe.del(`sessions:${existingSessionId}`) // delete existing session
    pipe.set(`sessions:${sessionId}`, session) // save session
    await pipe.exec()
  } catch(e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: /login:create,delete session:${e}` }, { status: 500 })
  }

  // success
  return NextResponse.json({ id: sessionId })
}

// Remove the OPTIONS handler since it's handled in middleware

