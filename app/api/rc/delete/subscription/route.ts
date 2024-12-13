import { ConnectionAndBody, User } from 'types'
import { getRedisFromEnv, nowInSeconds, send } from 'lib'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})

/*
  delete subscription
  1. Get request from rc
  2. Check Authorization header
  3. Get body of request
  4. Get user id from body.event.app_user_id
  5. Update the user's roles to remove 'performer'
  6. Save updated user data
  7. Save subscription data
*/

export async function POST(req: NextRequest) {
  Sentry.captureMessage('POST /api/rc/delete/subscription')
  let redis, customerId, subscription
  try {
    // Check Authorization header
    const authHeader = req.headers.get('authorization')
    const REVENUE_CAT_AUTH_KEY = `Bearer ${process.env.REVENUE_CAT_AUTH_KEY}`
    console.log({ authHeader })
    console.log({ REVENUE_CAT_AUTH_KEY})
    if (!authHeader || authHeader !== REVENUE_CAT_AUTH_KEY) {
      const error = '/rc/delete/sub - Unauthorized'
      Sentry.captureException(error)
      return NextResponse.json({ error }, { status: 401 })
    }

    Sentry.captureMessage('POST /api/rc/delete/subscription - authHeader OK')

    // get redis based on meta from body
    const path = '/api/rc/delete/subscription'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    Sentry.captureMessage(`POST /api/rc/delete/subscription body: ${body}`)
    const data = body
    subscription = data.event
    // we use `Purchases.logIn(String(user.id))` prior to sending the purchase to rc
    // to set the app_user_id (number) to the user.id (string)
    // so we need to be sure to convert to a number here
    customerId = Number(subscription.app_user_id) // === user.id
    Sentry.captureMessage(`POST /api/rc/delete/subscription customerId: ${customerId}`)
    
  } catch(e) {
    console.log(e)
    const error = `/rc/delete/sub - Catch authentication ${e}`
    Sentry.captureException(error)
    return NextResponse.json({ error }, { status: 405 })
  }

  // update user and subscription data
  try {
    const user = await redis.get(`users:${customerId}`) as User
    if (!user) {
      const error = `/rc/delete/sub - User not found - customerId: ${customerId}`
      Sentry.captureException(error)
      return NextResponse.json({ error }, { status: 500 })
    }
    
    const updated: User = {
      ...user,
      roles: user.roles.filter(role => role !== 'performer'),
    }
    console.log({ updated })
    Sentry.captureMessage(`POST /api/rc/delete/subscription updated user: ${updated}`)
    const pipe = redis.pipeline()
    pipe.set(`users:${customerId}`, JSON.stringify(updated))
    pipe.zadd(`users:${user.id}:subscriptions`, {
      score: nowInSeconds(),
      member: JSON.stringify({
        source: 'rc',
        userId: user.id,
        action: 'delete',
        endpoint: 'api/rc/delete/subscription',
        ...subscription
      })
    })
    await pipe.exec()
  } catch(e) {
    const error = `/api/rc/delete/sub - saving user/subscription data catch ${e}`
    Sentry.captureException(error)
    return NextResponse.json({ error }, { status: 500 })
  }

  Sentry.captureMessage(`POST /api/rc/delete/subscription SUCCESS - 200 OK`)

  // send email to admin
  await send({ 
    contentKey: 'subscription', 
    subject: 'Actual - An RC subscription has expired',
    data: `
      <h1>Expired subscription</h1>
      <div>${JSON.stringify(subscription)}</div>
  `  
  })

  return NextResponse.json({ received: true }, { status: 200 })
}