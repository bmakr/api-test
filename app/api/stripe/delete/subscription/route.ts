import { ConnectionAndBody, User } from 'types'
import { getRedisFromEnv, nowInSeconds, send } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  api/stripe/delete/subscription
 Listener for these events:
  - customer.subscription.deleted

  When a customer deletes their subscription
  we need to remove `performer` from user.roles
  1. Validate
  2. get the stripe customer id from body
  3. get the userId from the stripe customer id from redis
  4. get the user from redis
  5. Update the user data
  6. Save the updated user data to redis
*/

export async function POST(req: NextRequest) {
  // validate
  let redis, customer, dataObject
  try {
    // get redis based on meta from body
    const path = '/api/stripe/delete/subscription'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn
    const { data } = body
    customer = data.object.customer
    dataObject = data.object
  } catch(e) {
    console.log(e)
    return NextResponse.json({ received: false }, { status: 405 })
  }

  // get userId from stripeCustomerId
  // update user.roles by removing 'performer'
  let userId
  try {
    userId = await redis.get(`stripe:${customer}:userId`) as string
    console.log({ userId })
    const user = await redis.get(`users:${userId}`) as User
    console.log({ user })
    const updated: User = {
      ...user,
      roles: user.roles.filter(role => role !== 'performer'),
    }
    console.log({ updated })
    const pipe = redis.pipeline()
    pipe.set(`users:${userId}`, JSON.stringify(updated))
    pipe.zadd(`users:${userId}:subscriptions`, {
      score: nowInSeconds(),
      member: JSON.stringify({
        userId,
        isDeleted: true,
        endpoint: 'api/stripe/delete/subscription',
        ...dataObject
      })
    })
  } catch(e) {
    console.log(e)
    return NextResponse.json({ received: false }, { status: 405 })
  }

     // send transactional email to admin
     try {
      const res = await send({
        contentKey: `subscription`,
        subject: 'Actual - A stripe subscription has expired',
        data: `
          <div>A stripe subscription has expired for userId: ${userId}</div>
          <div>JSON.stringify(dataObject)</div>
        `
      })
      console.log('transactional email response', res)
    } catch(e) {
      console.log('Transactional email failed to send')
    }

  return NextResponse.json({ received: true })
}