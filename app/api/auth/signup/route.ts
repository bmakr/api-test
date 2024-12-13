import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { rateLimiter, send, requireAuthKey, getRedisFromEnv } from 'lib'

import { 
  validateEmail, createPasscode, nowInSeconds, createId,
} from 'lib'
import { ConnectionAndBody, Session, User } from 'types'

/*
  signup route
  POST /api/auth/signup
  input body: { val: string } as stringified JSON
  output: { passcodeId: string } as JSON

  validate email
  check if email is already registered

  send verification email optimistically

  create save user
  save users:emails:{email} index
  save users:usernames:[split email] index
  
  save session

  return session id as id
*/
export async function POST(req: NextRequest) {
  try {
    requireAuthKey({ req })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // validate
  let redis, email
  try {
    // validate redis client
    // get redis based on meta from body
    const path = '/api/signup'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody 
    redis = conn
    
    //  add rate limiter
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || '127.0.0.1'
    const { success } = await rateLimiter({
      ip,
      redis
    })

    if (!success) {
      return NextResponse.json({ error: 'Too many signup attempts' }, { status: 429 })
    }

    // get body
    const { val } = body
    email = val

    await validateEmail({ email })

    // check to see if email is in the database
    const existingEmail = await redis.get(`users:emails:${email}`)
    if (existingEmail) return NextResponse.json({ error: 'Email already registered. Please log in.' }, { status: 400 })

    
  } catch (error) {
    console.error('Error in /signup:validation', error)
    return NextResponse.json(
      { error: 'Internal server error: /signup:validation' }, 
      { status: 500 }
    )
  }

  // send verification email optimistically
  // to reduce user's wait time to receive
  const passcode = createPasscode()
  let sessionId, userId
  try {
    // create pipeline
    const pipe = redis.pipeline()
    pipe.incr('users:id:counter') // incr ids
    pipe.incr('sessions:id:counter')
    const results = await pipe.exec()
    userId = results[0] as number
    sessionId = results[1] as number
    await send({ contentKey: 'verification', to: email, data: passcode.toString() })
  } catch(e) {
    console.error('Error in /signup:send email', e)
    return NextResponse.json(
      { error: 'Internal server error: /signup:send email' }, 
      { status: 500 }
    )
  }

  // save user data
  try {
    // create user
    const user: User = {
      id: userId,
      createdAt: nowInSeconds(),
      email,
      roles: ['free'],
      signedUpAt: nowInSeconds()
    }
    const username = email.split('@')[0] + createId()
    
    // create pipeline for writing user data and indexes
    const pipe = redis.pipeline()
    pipe.incr('users:counter') // incr users counter
    pipe.set(`users:${userId}`, user) // save user
    pipe.set(`users:emails:${email}`, userId) // emails index
    pipe.set(`users:usernames:${username}`, userId) // usernames index
   
    // execute pipeline
    await pipe.exec()
  } catch(e) {
    console.error('Error in /signup:user', e)
    return NextResponse.json(
      { error: 'Internal server error: /signup:user' }, 
      { status: 500 }
    )
  }

  // save session data
  try {
    const pipe = redis.pipeline()
    if (sessionId && passcode && userId) {
      const session: Session = { 
        id: sessionId,
        passcode, 
        userId, 
        createdAt: nowInSeconds() 
      }
      pipe.set(`sessions:${sessionId}`, session)
      pipe.set(`users:${userId}:sessionId`, sessionId)
      pipe.set(`sessions:${sessionId}:userId`, userId)
      await pipe.exec()
    } else {
      throw new Error('Missing required data for session creation')
    }
  } catch(e) {
    console.error('Error in /signup:session', e)
    return NextResponse.json(
      { error: 'Internal server error: /signup:session' }, 
      { status: 500 }
    )
  }

  // success
  return NextResponse.json(
    { id: sessionId }
  )
}
