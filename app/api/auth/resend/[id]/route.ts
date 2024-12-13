import { createPasscode, nowInSeconds, send, requireAuthKey, getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'
import { ConnectionAndBody, Params, Session, User } from 'types'

/*
  validate session id
  send email optimistically
  create new session
  delete existing session
*/
export async function POST(req: NextRequest, { params }: Params) {
  try {
    requireAuthKey({ req })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // validate
  let redis, existingSessionId
  try {
    // get redis based on meta from body
    const path = '/api/auth/resend/[id]'
    const { conn } = await getRedisFromEnv({ req, path }) as ConnectionAndBody 
    redis = conn
    // Extract session id from params
    const { id } = params
    existingSessionId = Number(id)
    if (isNaN(existingSessionId)) return NextResponse.json({ error: 'Internal error. /resend:params.id NaN'})
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error in POST /resend:', error);

    // Return a generic error response to the client
    return NextResponse.json(
      { error: 'Internal Error: /resend' }, 
      { status: 500 }
    );
  }

  // send email optimistically
  let passcode, sessionId, userId
  try {
    passcode = createPasscode()
    const pipe = redis.pipeline()
    pipe.get(`sessions:${existingSessionId}`) // existingSession index 0
    pipe.incr('sessions:id:counter') // sessionId index 1
    const results = await pipe.exec()
    const existingSession = results[0] as Session
    sessionId = results[1] as number
    userId = existingSession.userId
    const user = await redis.get(`users:${userId}`) as User
    const { email } = user
    // send email
    await send({ contentKey: 'verification', to: email, data: passcode.toString() })

  } catch(e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: sending email /login:${e}` }, { status: 500 })
  }

  // create a new session/index
  // delete existing session/index if present
  try {
    const session: Session = { 
      id: sessionId,
      userId,
      passcode, 
      createdAt: nowInSeconds() 
    }

    // execute pipeline to create new session and delete old
    const pipe = redis.pipeline()
    // users:[userId]:sessionId
    pipe.del(`users:${userId}:sessionId`) // delete existing userID index
    pipe.set(`users:${userId}:sessionId`, sessionId) // set new userId index
    // sessions:[sessionId]:userId
    pipe.del(`sessions:${existingSessionId}:userId`) // sessionId index
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