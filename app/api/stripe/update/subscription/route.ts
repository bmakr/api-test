import { ConnectionAndBody } from 'types'
import { getRedisFromEnv, nowInSeconds, send } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
 Listener for these events:
  - customer.subscription.updated

  When a customer updates their subscription
  change the customer role in user.roles
  1. Validate
  2. get the stripe customer id and data.object from body
  3. get the userId from the stripe customer id from redis
  4. save the data object to `user:[userId]:subscription` zset with a score of the current time
  5. Send ourselves an email
*/

export async function POST(req: NextRequest) {
  let redis, customer, dataObject, isCancelled
  try {
    // get redis based on meta from body
    const path = '/api/stripe/update/subscription'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    const { data } = body
    isCancelled = data.object.cancel_at_period_end
    dataObject = data.object.cancellation_details
 
    console.log({ dataObject })
    customer = data.object.customer
    console.log({ customer })
    
  } catch(e) {
    console.log(e)
    return NextResponse.json({ received: false }, { status: 405 })
  }

  // get user id from `stripe:[customer]: userId`
  // save data object to `users:[userId]:subscriptions` zset
  let userId
  try {
    userId = await redis.get(`stripe:${customer}:userId`) as string
    await redis.zadd(`users:${userId}:subscriptions`, {
      score: nowInSeconds(),
      member: JSON.stringify({
        userId,
        isCancelled,
        endpoint: 'api/stripe/update/subscription',
        ...dataObject
      })
    })
  } catch(e) {
    return NextResponse.json({ received: false }, { status: 405 })
  }

   // send transactional email to admin
   try {
    const res = await send({
      contentKey: 'subscription',
      subject: 'Actual - A stripe subscription has been updated',
      data: `
        <div>userId: A user with ${userId}</div>
        <div>message: ${isCancelled ? 'Cancelled' : 'Renewed'} their subscription</div>
        <div>JSON.stringify(dataObject)</div>
      `
    })
    console.log('transactional email response', res)
  } catch(e) {
    console.log('Transactional email failed to send')
  }


  // success
  return NextResponse.json({ received: true }, { status: 200 })
}
