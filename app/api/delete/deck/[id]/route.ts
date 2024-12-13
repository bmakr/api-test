import { ConnectionAndBody, Deck, Params } from 'types'
import { getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  /api/delete/deck/[id]
  validates inputs: 
    - params.id = deck.id
    - body.key = 'decks'

  get the deck
  remove the deckId from users:[userId]:deck
  remove the deckId from decks:public if it exists
  delete the deck
*/
export async function POST(req: NextRequest, { params }: Params) {
  // validate
  let deckId, redis
  try {
    // get redis based on meta from body
    const path = '/api/delete/deck/[id]'
    const { conn } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    // validate params.id
    deckId = params.id
    if (!deckId) {
      return NextResponse.json({ error: `api/delete/deck/[id] - no params.id`}, { status: 500 })
    }
  } catch(e) {
    console.log(e)
    return NextResponse.json(
      { error: 'Internal error: api/delete/deck/[id] - validate catch ${e}' }, 
      { status: 500 }
    )
  }

  // delete
  try {
    console.log({ deckId })
    const deck = await redis.get(`decks:${deckId}`) as Deck
    console.log('typeof deck', typeof deck)
    if (!deck) return NextResponse.json(
      { error: 'Internal error: api/delete/deck/[id] - get' }, { status: 500 }
    )

    // create pipline
    const pipe = redis.pipeline()
    // remove from users:[userId]:decks
    pipe.zrem(
      `users:${deck.userId}:deckIds`, String(deckId)
    )
    // remove from decks:public if it's in there
    pipe.zrem(`decks:public`, String(deckId))
    // delete the deck
    pipe.del(`decks:${deckId}`)
    const res = await pipe.exec()
    console.log({ res })
  } catch(e) {
    return NextResponse.json(
      { error: `Internal error: api/delete/deck/[id] - delete catch ${e}` }, 
      { status: 500 }
    )
  }

  return NextResponse.json({ status: 200 })
}