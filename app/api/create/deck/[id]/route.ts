import { ConnectionAndBody, Params } from 'types'
import { getRedisFromEnv, nowInSeconds } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  @params id === sessionId
  @params body === { title, description, mcqs }
  Step 1: Validate the request
  Step 2: prep data
  Step 3 save as deck
*/
export async function POST(req: NextRequest, { params }: Params) {
    // validate
    let redis, deck, sessionId
    try {
      // validate redis client
      // get redis based on meta from body
      const path = '/api/create/deck/[id]'
      const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody 
      redis = conn

      //validate id from params
      sessionId = params.id
      console.log('/create/deck', { sessionId })
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Internal error: params' }, { status: 500 }
        )
      }

      if (!body) {
        return NextResponse.json({ error: `Internal error: /create/deck:validation:!body` }, { status: 500 })
      }

      if (!body.title || !body.description || !body.mcqs) {
        return NextResponse.json({ error: `Internal error: /create/deck:validation:body content` }, { status: 500 })
      }

      deck = body
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /create/deck:validation:${e}` }, { status: 500 })
    }

  
    // generate id and save deck to db
    try {
      // get userId from sessionId
      const userId = await redis.get(`sessions:${sessionId}:userId`)
      if (!userId) {
        return NextResponse.json({ error: `Internal error: /create/deck:get sessions[sessionId]:userId` }, { status: 500 })
      }
      const id = await redis.incr('decks:counter')
      // set id to deck
      deck.id = id
      const createdAt = nowInSeconds()
      const pipe = redis.pipeline()
      pipe.set(`decks:${id}`, {
        id,
        userId,
        ...deck
      })
      pipe.zadd(`users:${userId}:deckIds`, {
        score: createdAt,
        member: id
      })

      // added index to manage whether decks are publicly displayed or not
      if (deck.isPublic) {
        pipe.zadd('decks:public', {
          member: id,
          score: createdAt,
        })
      }

      await pipe.exec()
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /create/deck:saving deck:${e}` }, { status: 500 })
    }

    return NextResponse.json({ data: deck }, { status: 200 })
}