import { ConnectionAndBody, User } from 'types'
import { getRedisFromEnv, nowInSeconds, send } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  received when Stripe processes a successful checkout
  the input is structured as 
  body: { 
    "id": "evt_1Q2GvrCgzhWoiiPe9OKjoeAJ",
    "object": "event",
    "api_version": "2023-08-16",
    "created": 1727115863,
    data: { 
      object: {
        "id": "cs_test_a1nEf9xUNEqjwmWNv0mTSMXlwUs78KtsrDDrjBFk3hQrNPDrHRTVHHNXbY",
        "object": "checkout.session",
        "after_expiration": null,
        "allow_promotion_codes": false,
        "amount_subtotal": 4900,
        "amount_total": 4900,
        customer_details: {
          "address": {
            "city": "Spring Lake",
            "country": "US",
            "line1": "20060 North Shore Drive",
            "line2": null,
            "postal_code": "49456",
            "state": "MI"
          },
          // this email may be different from email used to signup
          "email": "lumeo@me.com", 
          "name": "Brian McDonough",
          "phone": null,
          "tax_exempt": "none",
          "tax_ids": []
          },
        "subscription": "sub_1Q2GvoCgzhWoiiPeCk4quZec",
        "client_reference_id": "29", // session.id
      }
    }
  }
*/

export async function POST(req: NextRequest) {
  let redis, sessionId, customer, subscription, dataObject
  try {
    // get redis based on meta from body
    const path = '/api/stripe/create/subscription'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn
    const { data } = body
    customer = data.object.customer
    dataObject = data.object
    console.log({ customer })

    subscription = data

    sessionId = Number(data.object['client_reference_id'])
    console.log({ sessionId })

    
  } catch(e) {
    console.log(e)
    return NextResponse.json({ received: false }, { status: 405 })
  }

  // get userId from sessionId
  // update user by adding 'performer' to roles and stripeCustomerId
  // set indexes for `users:[id]:stripeCustomerId and
  // stripe:[customerId]:userId
  let userId
  try {
    userId = await redis.get(`sessions:${sessionId}:userId`) as string
    console.log({ userId })
    const user = await redis.get(`users:${userId}`) as User
    console.log({ user })
    const updated: User = {
      ...user,
      roles: [...user.roles, 'performer'],
      stripeCustomerId: customer
    }
    const pipe = redis.pipeline()
    pipe.set(`users:${userId}`, JSON.stringify(updated))
    pipe.zadd(`users:${userId}:subscriptions`, {
      score: nowInSeconds(),
      member: JSON.stringify({
        source: 'stripe',
        userId,
        isCreated: true,
        endpoint: 'api/stripe/create/subscription',
        ...subscription
      })
    })
    pipe.set(`stripe:${customer}:userId`, userId)
    // pipe.set(`users:${userId}:stripeCustomerId`, customer)
    await pipe.exec()
  } catch(e) {
    console.log(e)
    return NextResponse.json({ received: false }, { status: 405 })
  }

  // send transactional email to admin
  try {

    const res = await send({ 
      contentKey: 'subscription', 
      data: `
        <div>A new subscription has been created for userId: ${userId}</div>
        <div>${JSON.stringify(subscription)}</div>
    `  
    })
    console.log('transactional email response', res)
  } catch(e) {
    console.log('Transactional email failed to send')
  }

  // TODO: update name, email...
  await send({ 
    contentKey: 'subscription', 
    subject: 'Actual - A stripe subscription has been created',
    data: `
      <h1>New subscription</h1>
      <div>${JSON.stringify(subscription)}</div>
    ` 
  })

  // success
  return NextResponse.json({ received: true }, { status: 200 })
}