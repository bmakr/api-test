import { NextResponse, NextRequest } from 'next/server'
import { 
  User, Params, ConnectionAndBody 
} from 'types'
import { getCustomerPortalLink } from './getCustomerPortalLink'
import { getRedisFromEnv } from 'lib'

/*
  input: params.id === sessionId
  get userId from sessionId
  get subscription data from `users[id]:subscription
  get unscubscribe link from stripe
  return { data: { url: string }}
*/

export async function POST(
  req: NextRequest, 
  { params }: Params
) {
  let redis, userId
  try {
    // get redis based on meta from body
    const path = '/api/stripe/portal/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    //validate id from params
    if (!params.id) {
      return NextResponse.json(
        { error: 'Internal error with /pdf/params: our team is working on it' }, { status: 500 }
      )
    }

    userId = params.id
  } catch(e) {
    console.log(e)
    return NextResponse.json({ received: false }, { status: 405 })
  }

  // get userId from userId
  // generate url from stripe
  let url = ''
  try {
    const user = await redis.get(`users:${userId}`) as User
    const { stripeCustomerId } = user as { stripeCustomerId: string; }
    url = await getCustomerPortalLink({ 
      customerId: stripeCustomerId 
    })

    console.log({ url })
  } catch(e) {
    console.log(e)
    return NextResponse.json({ error: e }, { status: 500 })
  }

  // success
  return NextResponse.json(
    { data: { url } }, 
    { status: 200 }
  )
}