import { ConnectionAndBody, User } from 'types'
import { getBody, getRedisFromEnv, nowInSeconds, send } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  When a user signs up for a subscription
  on iOS or Android, RevenueCat sends data to this webhook endpoint
  api/rc/create/subscription
  per the docs https://www.revenuecat.com/docs/integrations/webhooks/event-types-and-fields
  the data object includes:
  {
    "api_version": "1.0",
    "event": {
      "aliases": [
        "yourCustomerAliasedID",
        "yourCustomerAliasedID"
      ],
      "app_id": "yourAppID",
      "app_user_id": "yourCustomerAppUserID",
      "commission_percentage": 0.3,
      "country_code": "US",
      "currency": "USD",
      "entitlement_id": "pro_cat",
      "entitlement_ids": [
        "pro_cat"
      ],
      "environment": "PRODUCTION",
      "event_timestamp_ms": 1591121855319,
      "expiration_at_ms": 1591726653000,
      "id": "UniqueIdentifierOfEvent",
      "is_family_share": false,
      "offer_code": "free_month",
      "original_app_user_id": "OriginalAppUserID",
      "original_transaction_id": "1530648507000",
      "period_type": "NORMAL",
      "presented_offering_id": "OfferingID",
      "price": 2.49,
      "price_in_purchased_currency": 2.49,
      "product_id": "onemonth_no_trial",
      "purchased_at_ms": 1591121853000,
      "store": "APP_STORE",
      "subscriber_attributes": {
        "$Favorite Cat": {
          "updated_at_ms": 1581121853000,
          "value": "Garfield"
        }
      },
      "takehome_percentage": 0.7,
      "tax_percentage": 0.3,
      "transaction_id": "170000869511114",
      "type": "INITIAL_PURCHASE"
    }
  }

  customerId = app_user_id
  sessionId = 

  Similarly but not exactly like the api/stripe/subscription/create endpoint, we:
  1. Init the Redis client
  1. Check the auth header to ensure the request is from RevenueCat
  2. Get the body of the request
  3. 
*/

export async function POST(req: NextRequest) {
  let redis, customerId, subscription
  try {
    // Check Authorization header
    const authHeader = req.headers.get('authorization')
    const REVENUE_CAT_AUTH_KEY = `Bearer ${process.env.REVENUE_CAT_AUTH_KEY}`
    console.log({ authHeader })
    console.log({ REVENUE_CAT_AUTH_KEY})
    if (!authHeader || authHeader !== REVENUE_CAT_AUTH_KEY) {
      return NextResponse.json({ error: '/rc/crete/sub - Unauthorized' }, { status: 401 })
    }

    // get redis based on meta from body
    const path = '/api/rc/create/subscription'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    const data = body
    subscription = data.event
    // we use `Purchases.logIn(String(user.id))` prior to sending the purchase to rc
    // to set the app_user_id (number) to the user.id (string)
    // so we need to be sure to convert to a number here
    customerId = Number(subscription.app_user_id)
    console.log({ customerId })
    
  } catch(e) {
    console.log(e)
    return NextResponse.json({ received: false }, { status: 405 })
  }

  // update user and subscription data
  try {
    const user = await redis.get(`users:${customerId}`) as User
    if (!user) return NextResponse.json({ error: '/rc/create/subscription - User not found' }, { status: 500 })
    
    const updated: User = {
      ...user,
      roles: [...user.roles, 'performer'],
    }
    console.log({ updated })
    const pipe = redis.pipeline()
    pipe.set(`users:${customerId}`, JSON.stringify(updated))
    pipe.zadd(`users:${user.id}:subscriptions`, {
      score: nowInSeconds(),
      member: JSON.stringify({
        source: 'rc',
        userId: user.id,
        action: 'create',
        endpoint: 'api/rc/create/subscription',
        ...subscription
      })
    })
    await pipe.exec()
  } catch(e) {
    return NextResponse.json({ error: '/api/rc/create/sub - saving user/subscription data' }, { status: 500 })
  }

  await send({ contentKey: 'subscription',
    subject: 'Actual - A new RC subscription has been created',
    data: `
      <h1>New subscription</h1>
      <div>${JSON.stringify(subscription)}</div>
  `  
  })

  return NextResponse.json({ received: true }, { status: 200 })
}