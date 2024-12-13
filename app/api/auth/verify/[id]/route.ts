import { Action, ConnectionAndBody, Params, Session, User } from 'types'
import { NextRequest, NextResponse } from 'next/server'
import { 
  getRedisFromEnv, nowInSeconds, requireAuthKey
} from 'lib'

/*
  get session id from params
  get passcode input val from body
  validate val exists

  get session
  validate input agains session.passcode 
  validate expiration
  get user from session.userID
  return user


  SANDBOX TESTING
  if user.email === sandbox@actual.team
  we bypass the passcode verification
  and use a sandbox passcode 
  to maintain security, we remove the sandbox passcode
  after Apple completes the review
*/
const SANDBOX_PASSCODES = [787998]
export async function POST(req: NextRequest, { params }: Params) {
  // validate auth bearer
  try {
    requireAuthKey({ req })
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  

  // validate
  let redis, sessionId, input
  try {
    // get redis based on meta from body
    const path = '/api/auth/verify/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody 
    redis = conn
    
    //validate id from params
    sessionId = params.id
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Internal error: params' }, { status: 500 }
      )
    }

    // get input code from body
    const { val } = body
    if (!val) {
      return NextResponse.json(
        { error: 'Internal error: /verify:No val in body', status: 500 }
      )
    }

    input = Number(val)
    if (isNaN(input)) {
      return NextResponse.json(
        { error: 'Internal error: /verify:Val NaN', status: 500 }
      )
    }
  } catch (error) {
    console.error(error)
    console.error('Error in /verify:validation', error)
    return NextResponse.json(
      { error: 'Internal server error /verify:validation' }, 
      { status: 500 }
    )
  }

  // get session
  let numericalSessionId, user
  try {
    numericalSessionId = Number(sessionId)
    if (isNaN(numericalSessionId)) {
      return NextResponse.json(
        { error: 'Invalid session ID', status: 400 }
      )
    }
    
    const session = await redis.get(`sessions:${sessionId}`) as Session
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found', status: 404 }
      )
    }

    const passcode = session.passcode
    const userId = session.userId
    const createdAt = session.createdAt
    console.log('api/verify passcode', passcode)
    console.log('api/verify userId', userId)
    console.log('api/verify createdAt', createdAt)

    if (!passcode || ! userId || !createdAt) {
      return NextResponse.json(
        { error: 'Internal Error: /verify:deconstructing session', status: 400 }
      )
    }    

    // sandbox testing
    let skip = false
    user = await redis.get(`users:${userId}`) as User
    if (user.email === 'sandbox@actual.team') {
      if (!SANDBOX_PASSCODES.includes(input)) {
        return NextResponse.json(
          { error: 'Invalid code. Please re-check the code', status: 400 }
        )
      } else {
        skip = true
      }
    }

    if (!skip) {
      // check input against saved passcode
      if (input !== passcode) {
        return NextResponse.json(
          { error: 'Invalid code. Please re-check the code', status: 400 }
        )
      }

      // check expiration
      const PASSCODE_EXPIRATION_TIME = 300; // 5 minutes in seconds
      if (nowInSeconds() - createdAt > PASSCODE_EXPIRATION_TIME) {
        return NextResponse.json(
          { error: 'Passcode has expired', status: 400 }
        )
      } 
    }

    

    // everything passed
    // delete passcode from session
    const copy = session
    delete copy.passcode
    await redis.set(`sessions:${sessionId}`, JSON.stringify(copy))

  } catch(e) {
    console.error('Error in /verify:session', e)
    return NextResponse.json(
      { error: `Internal server error /verify:session ${e}` }, 
      { status: 500 }
    )
  }

  // update user with loggedInAts
  try {
    const updated = {
      ...user,
      loggedInAts: user.loggedInAts ? [...user.loggedInAts, nowInSeconds()] : [nowInSeconds()]
    }
    await redis.set(`users:${user.id}`, JSON.stringify(updated))
  } catch(e) {
    console.error('Error in /verify:update user', e)
    return NextResponse.json(
      { error: `Internal server error /verify:update user ${e}` }, 
      { status: 500 }
    )
  }

  // check for invitation
  // this is a failsafe in case the invitee gets lost in the process of 
  // responding to the invitation by signing up
  // if there is an invitation, we return the deck from the invitation
  let deck
  try {
    const invitationIds = await redis.zrange(`users:${user.id}:invitations:actionIds`, 0, -1)
    if (invitationIds.length > 0) {
      const actionId = invitationIds[0]
      const action = await redis.get(`actions:${actionId}`) as Action
      const deckFromInvitation = await redis.get(`decks:${action.deckId}`)
      if (deck) deck = deckFromInvitation
    }
  } catch(e) {
    console.error('Error in /verify:invitation', e)
    return NextResponse.json(
      { error: `Internal server error /verify:invitation ${e}` }, 
      { status: 500 }
    )
  }

  // success
  return NextResponse.json({ id: numericalSessionId, deck }, { status: 200 })
}

