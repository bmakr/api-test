import { 
  ConnectionAndBody, Deck, Params, User 
} from 'types'
import { getRedisFromEnv, nowInSeconds, send } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  @param id === userId, the inviterId
  @body: {
    tuples: string[][]; // [[ [namesList], email ], ...]
    isBeta: boolean;
    isCoach: boolean;
  }
  
*/

export async function POST(req:NextRequest, { params }: Params) {
  // validate
  let redis, inviterId, tuples, isBeta, isCoach, action, inviter, deck
  // NOTE: action.id., action.targetId and action.description to be added below
  try {
    // validate redis
    // get redis based on meta from body
    const path = '/api/invitations/create/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    // validate params
    inviterId = Number(params.id) 
    if (!inviterId) throw new Error('inviterId is required')

    // validate body
    tuples = body.tuples
    isBeta = body.isBeta
    isCoach = body.isCoach
    action = body.action
    if (!tuples) throw new Error('tuples is required')

    // get inviter
    inviter = await redis.get(`users:${inviterId}`) as User
    if (!inviter) throw new Error('inviter not found')

    // get deck
    deck = await redis.get(`decks:${action.deckId}`) as Deck
    if (!deck) throw new Error('deck not found')
    
  } catch(e) {
    return NextResponse.json({ error: `/api/invitations/create: validate catch ${e}` }, { status: 400 });
  }

  console.log({ inviterId, tuples, isBeta, isCoach })
  const now = nowInSeconds()

  // process invitees
  let invitees: User[] = []
  for (const [nameList, email] of tuples) {
    let inviteeId
    let invitee = {
      id: -1, // placeholder
      createdAt: now,
      names: nameList,
      email,
    } as User
    try {
      // lookup users:emails:[email] to get userId if user exists
      const trimmed = email.toLowerCase().trim()
      inviteeId = await redis.get(`users:emails:${trimmed}`)
      if (!inviteeId) {
        let roles: ('free' | 'beta' | 'coach')[] = ['free']
        if (isBeta) roles.push('beta')
        if (isCoach) roles.push('coach')
        invitee.roles = roles
        // if user does not exist, create user and inviteeId
        inviteeId = await redis.incr('users:counter')
        invitee.id = inviteeId
        invitee.invitedAts = [now]
        invitee.invitedBys = [inviterId]
        // save email to users:emails:[email]
        await redis.set(`users:emails:${trimmed}`, inviteeId)
      } else {
        // if user exists, update invitedAts and invitedBys
        let existingUser = await redis.get(`users:${inviteeId}`) as User
        if (!existingUser) throw new Error('existing user not found')
        invitee = existingUser
        if (!existingUser.invitedAts) invitee.invitedAts = [now]
        else invitee.invitedAts?.push(now)
        if (!existingUser.invitedBys) invitee.invitedBys = [inviterId]
        else invitee.invitedBys?.push(inviterId)
        inviteeId = existingUser.id
        // update roles
        invitee.roles = existingUser.roles
        if (isBeta) invitee.roles.push('beta')
        if (isCoach) invitee.roles.push('coach')
      }
      console.log('saving invitee', invitee)
      // save or update to users:[inviteeId]
      await redis.set(`users:${inviteeId}`, invitee)

      // process action
      // add id, targetId (inviterId) and description
      const actionId = await redis.incr('actions:counter')
      console.log({ actionId })
      action.id = actionId
      action.targetId = inviteeId
      action.description = `Hi ${nameList.join(' ')}! ${inviter.names?.join(' ')} shared a learning deck, ${deck.title}}` // namesList is an array of the invitee's names
      const pipe = redis.pipeline()
      // save action
      console.log('saving action', action)
      pipe.set(`actions:${actionId}`, action)
      // track actions
      pipe.zadd(`users:${inviterId}:actionIds`, {
        score: now,
        member: actionId
      })
      // track invitations
      pipe.incr(`users:${inviteeId}:invitations:received:length`)
      // save invitations:actionIds for use in /verify (in case user gets lost in the process)
      pipe.zadd(`users:${inviteeId}:invitations:actionIds`, {
        score: now,
        member: actionId
      })
      // save notification
      pipe.zadd(`users:${inviteeId}:notifications`, {
        score: now,
        member: {
          actionId,
          actorId: inviterId,
          isRead: false
        }
      })
      // save notifications status
      pipe.incr(`users:${inviteeId}:notifications:unread:length`)
      
      await pipe.exec()
    } catch(e) {
      return NextResponse.json({ error: `/api/invitations/create: process invitees catch ${e}` }, { status: 500 })
    }
    // add to invitees list
    invitees.push(invitee)
  }

  // end of forEach loop

  // process inviter
  try {
    const pipe = redis.pipeline()
    pipe.zadd(`users:${inviterId}:actionIds`, {
      score: now,
      member: action.id
    })
    pipe.incr(`users:${inviterId}:invitations:sent:length`)
    pipe.exec()
  } catch(e) {
    return NextResponse.json({ error: `/api/invitations/create: process inviter catch ${e}` }, { status: 500 });
  }

  // save to team feed
  try {
    // get teamId from teamsKv

    const pipe = redis.pipeline()
    pipe.zadd(`teams:${1}:actionIds`, {
      score: now,
      member: action.id
    })
    pipe.exec()
  } catch(e) {
    return NextResponse.json({ error: `/api/invitations/create: emails catch ${e}` }, { status: 500 });
    }

    // send emails flow
    // A link is sent to the invitee by email: 
      //    `https://actual.so/auth/login?action=${action.id}`
      // when the invitee clicks the link, 
      // they are taken to the browser on their little machine
      // the browser checks the type of device the user is on

      // if they are on mobile:
      // if the app is installed, 
      // the browser opens the app to the deep link actual://invitations/${action.id}
      // if the app is not installed, a modal pops up asking them to install the app
      // they can either install the app 
      // or continue in the browser

      // the invitation screen on native or web erases any decks that are already in localStorage
      // to reset the user's state

      // It checks to see if the query string has an action id
      // If so, it calls /api/actions/${action}
      // which looks up the action in the db
      // and returns the deck, and the action.description to the fetch call
      // the client saves the deck to localStorage

      // a toast notification pops up
      // displaying the action.description
      // and letting the user know that the deck is waiting for them
      // after they verify their email address

      // After the user enters their email and clicks submit on /invitations/${action.id},
      // they are assigned a session on the db and sent a code to verify by email
      
      // After they enter the code in the browser
      // and click sumbit,
      // the verify screen checks for a deck in localStorage
      // if it finds one, the user is redirected to /play?status=loaded

      // the user is then directed to /play?status=loaded
      // that page opens the learning deck that was previously saved to localStorage

      // if the user is on a mobile device, 
      // if it's installed or the app store if not installed
      // the browser opens the app to the route /invitations/${action.id}
      // looks up the action in the db
      // and saves the deck to localStorage
      // after verification, the user is directed to /play?status=loaded

      // in case the user gets lost in the process
      // the signup/login pages check their email address and 
      // identifies any pending invitations
      // looks up the action in the db
      // and saves the deck to localStorage
      // after verification, the user is directed to /play?status=loaded

  // iterate over invitees
  console.log({ invitees })
  for (const invitee of invitees) {
    console.log('/api/invitations/create: invitee', invitee)
    try {
      const link = `https://actual.so/invitation?action=${action.id}&email=${invitee.email}`
      const inviteeeName = invitee.names?.[0]
      const inviterName = inviter.names?.join(' ')
      const deckHtml = `
        <div style='font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;'>
          <h5>Hi ${inviteeeName},</h5>
          <h5>${inviterName} shared a learning deck with you on the Actual app</h5>
          <div style='background: #0F1B2D;border-radius: 8px;padding: 20px;margin: 30px 0;text-align: center; max-width: 350px;'>
            <h2 style='color: #FFF; font-size: 32px; font-weight: bold; margin: 0; padding: 0;'>${deck.title}</h2>
            <p style='color: #0091FF; margin: 0; padding: 0;'>${deck.description}</p>
            <a href="${link}" style='background: #0091FF;border-radius: 8px;color: #FFF;display: inline-block;font-size: 16px;font-weight: bold;margin: 20px 0;padding: 10px 20px;text-decoration: none;'>Play the learning deck</a>
          </div>
        </div>
      `
      const trimmed = invitee.email.toLowerCase().trim()
      console.log('sending to', trimmed)
      const res = await send({ 
        from: process.env.EMAIL_FROM,
        contentKey: 'invitation',
        data: deckHtml, 
        to: trimmed, 
        subject: 'You have been invited to learn with friends on the Actual app' 
      })

      console.log({ res })
      const data = res.data
      const error = res.error
      console.log({ data, error })
    } catch(e) {
      return NextResponse.json({ error: `/api/invitations/create: emails catch ${e}` }, { status: 500 });
    }

    console.log('sent email to', invitee.email)
  }

  return NextResponse.json({ data: { invitees } }, { status: 200 });
}