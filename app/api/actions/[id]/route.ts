import { Action, ConnectionAndBody, Params } from 'types'
import { NextRequest, NextResponse } from 'next/server'
import { getRedisFromEnv } from 'lib'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'


/*
  @params id === actionId
  1. get action from `actions:${actionId}`
  2. Get meta from body
  2. get deck from `decks:${action.deckId}`
  return { deck, description }
*/

export async function POST(req: NextRequest, { params }: Params) {
    // validate
  let actionId: number, redis: Redis
  try {
    // get redis based on meta from body
    const path = '/api/actions/[id]'
    const { conn } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    // validate params.id
    if (!params.id) throw new Error('params.id is required')
    actionId = parseInt(params.id)

    
  } catch(e) {
    return NextResponse.json({ error: `/api/invitation validation catch ${e}` }, { status: 400 })
  }

  // get action
  let deck, description
  try {
    const action = await redis.get(`actions:${actionId}`) as Action
    if (!action) throw new Error(`action ${actionId} not found`)
      console.log('api/actions', { action })
    description = action.description
    deck = await redis.get(`decks:${action.deckId}`)
    console.log('api/actions', { deck })
    if (!deck) throw new Error(`deck ${action.deckId} not found`)
  } catch(e) {
    return NextResponse.json({ error: `/api/invitation get action catch ${e}` }, { status: 500 })
  }

  // success
  return NextResponse.json({ data: { deck, description } }, { status: 200 })
}