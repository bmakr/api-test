import { getRedisFromEnv, nowInSeconds, send } from 'lib'
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/node'
import { ConnectionAndBody } from 'types'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
})

/*
  update subscription
  1. Get request from rc
  2. Check Authorization header
  3. Get body of request
  4. Get user id from body.event.app_user_id
  5. Save subscription data
*/

export async function POST(req: NextRequest) {
  Sentry.captureMessage('POST /api/rc/update/subscription')
  let redis, customerId, subscription
  try {
    // Check Authorization header
    const authHeader = req.headers.get('authorization')
    const REVENUE_CAT_AUTH_KEY = `Bearer ${process.env.REVENUE_CAT_AUTH_KEY}`
    console.log({ authHeader })
    console.log({ REVENUE_CAT_AUTH_KEY})
    if (!authHeader || authHeader !== REVENUE_CAT_AUTH_KEY) {
      const error = '/rc/update/sub - Unauthorized'
      Sentry.captureException(error)
      return NextResponse.json({ error }, { status: 401 })
    }

    Sentry.captureMessage('POST /api/rc/update/subscription - authHeader OK')

    // get redis based on meta from body
    const path = '/api/rc/update/subscription'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    Sentry.captureMessage(`POST /api/rc/update/subscription body: ${body}`)
    const data = body
    subscription = data.event
    // we use `Purchases.logIn(String(user.id))` prior to sending the purchase to rc
    // to set the app_user_id (number) to the user.id (string)
    // so we need to be sure to convert to a number here
    customerId = Number(subscription.app_user_id)
    Sentry.captureMessage(`POST /api/rc/update/subscription customerId: ${customerId}`)
    console.log({ customerId })
    
  } catch(e) {
    console.log(e)
    const error = `/rc/update/sub - Catch authentication ${e}`
    Sentry.captureException(error)
    return NextResponse.json({ error }, { status: 405 })
  }

  // update subscription data
  try {
    await redis.zadd(`users:${customerId}:subscriptions`, {
      score: nowInSeconds(),
      member: JSON.stringify({
        source: 'rc',
        userId: customerId,
        action: 'update',
        endpoint: 'api/rc/update/subscription',
        ...subscription
      })
    })
  } catch(e) {
    const error = `/api/rc/update/sub - saving user/subscription data catch ${e}`
    Sentry.captureException(error)
    return NextResponse.json({ error }, { status: 500 })
  }

  Sentry.captureMessage(`POST /api/rc/update/subscription SUCCESS - 200 OK`)

  await send({ 
    contentKey: 'subscription', 
    subject: 'Actual - A RC subscription has been updated',
    data: `
      <div>Updated subscription</div>
      <div>${JSON.stringify(subscription)}</div>
  `  
  })

  return NextResponse.json({ received: true }, { status: 200 })
}