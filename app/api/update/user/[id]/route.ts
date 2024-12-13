import { NextRequest, NextResponse } from 'next/server'
import { ConnectionAndBody, KeyValues, Params, User } from 'types'
import { getRedisFromEnv } from 'lib'

export async function POST(req: NextRequest, { params }: Params) {
  // validat inputs
  let redis, userId, fields, payloads
  try {
    // get redis based on meta from body
    const path = '/api/update/user/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn
    
    //validate id from params
    userId = Number(params.id)
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Internal error: /update/user:Val NaN', status: 500 }
      )
    }
    if (!userId) {
      return NextResponse.json(
        { error: 'Internal error: params' }, { status: 500 }
      )
    }

    // get input code from body
    fields = body.fields
    payloads = body.payloads
    console.log('fields:', fields)
    console.log('payloads:', payloads)
    if (!fields || !payloads) {
      return NextResponse.json(
        { error: 'Internal error: /update/user:No fields or payloads in body', status: 500 }
      )
    }
    
  } catch (error) {
    console.error(error)
    console.error('Error in /update/user:validation', error)
    return NextResponse.json(
      { error: 'Internal server error /update/user:validation' }, 
      { status: 500 }
    )
  }

  // update user
  try {
    const user = await redis.get(`users:${userId}`) as User
    if (!user) {
      return NextResponse.json(
        { error: 'Internal error: /update/user:No user found' }, 
        { status: 500 }
      )
    }

    // spread the fields and payloads into an object
    const keyValuesToAdd: KeyValues = {}
    fields.forEach((field: keyof User, i: number) => {
      keyValuesToAdd[field] = payloads[i]
    })

    const updatedUser = { ...user, ...keyValuesToAdd }
    console.log('updatedUser:', updatedUser)
    await redis.set(`users:${userId}`, updatedUser)
  } catch(e) {
    console.error('Error in /update/user:update', e)
    return NextResponse.json(
      { error:  `Internal server error /update/user:update catch ${e}` }, 
      { status: 500 }
    )
  }

  return NextResponse.json({ status: 200 })
}