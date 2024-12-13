import { ConnectionAndBody, Params, User } from 'types'
import { getRedisFromEnv, nowInSeconds } from 'lib'
import { send } from 'lib/email/send'
import { NextRequest, NextResponse } from 'next/server'

/*
  save form inputs to `leads`
*/
export async function POST(req: NextRequest, { params }: Params) {
  // validate
  let redis, formInputs, sessionId, email
    try {
      // validate redis client
      // get redis based on meta from body
      const path = '/api/query/[id]'
      const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn

      //validate id from params
      sessionId = params.id
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Internal error with /query/params: our team is working on it' }, { status: 500 }
        )
      }

      // get input code from body
      if (!body) {
        return NextResponse.json({ error: `Internal error: /query:validation:!body` }, { status: 400 })
      }

      formInputs = body
      if (body.email) email = body.email
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /query:validation:${e}` }, { status: 500 })
    }

    //save to leads
    try {
      const userId = await redis.get(`sessions:${sessionId}:userId`)
      if (userId) {
        const user = await redis.get(`users:${userId}`) as User
        email = user.email
      }
      await redis.zadd(`leads:${formInputs.type}`, {
        member: { 
          ...formInputs, 
          userId, 
          email,
          status: 'submitted',
          createdAt:nowInSeconds()
        },
        score: nowInSeconds()
      })
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /query save to leads:${e}` }, { status: 500 })
    }

    // send transactional email to admin
    try {
      const res = await send({
        to: process.env.EMAIL_ADMIN,
        subject: 'Actual - New Query',
        contentKey: 'generic',
        data: `
          <div>A new query has been submitted</div>
          <div>${JSON.stringify({
            ...formInputs,
            sessionId
        })}</div>
        `
      })
      console.log('transactional email response', res)
    } catch(e) {
      console.log('Transactional email failed to send')
    }

    return NextResponse.json({ status: 200 })
}