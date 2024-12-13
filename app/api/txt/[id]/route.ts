import { ConnectionAndBody, Deck, Params } from 'types'
import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { getRedisFromEnv, titlePrompt } from 'lib'
import { getBody } from 'lib'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

/*
  inputs: params.sessionId, form (pdf upload)
  1 - verify: redis client, sessionId, pdf body.text
  2 - create deck with id and userId
  3 - generate a title and description and save to deck 
      along with deck.isUpload = true and deck.documentText = text
  return { data: Deck }
*/
export async function POST(req: NextRequest, { params }: Params) {
  // validate
  let redis, txt, sessionId
    try {
      // validate redis client
      // get redis based on meta from body
      const path = '/api/txt/[id]'
      const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn

      //validate id from params
      sessionId = params.id
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Internal error with /txt/params.id' }, { status: 500 }
        )
      }

      // validate body.text
      if (!body || !body.text) {
        return NextResponse.json({ error: 'Internal error with /txt (body.text)' }, { status: 500 })
      }
      // success
      txt = body.text
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /txt:validation:${e}` }, { status: 500 })
    }


    // create deck: 
    // id, userId
    let deck: Partial<Deck> = {}
    try {
      // get userId from sessionId
      const userId = await redis.get(`sessions:${sessionId}:userId`)
      if (!userId) {
        return NextResponse.json({ error: `Internal error: /txt:get sessions[sessionId]:userId` }, { status: 500 })
      }
      const id = await redis.incr('decks:counter')
      // set id to deck
      deck.id = id
      deck.userId = Number(userId)
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /txt create deck: catch:${e}` }, { status: 500 })
    }

    // generate title and description
    // save key values in deck
    try {
      // truncate text
      const truncated = txt.slice(0,1000)
      const { text } = await generateText({
        model: anthropic('claude-2.1'),
        messages: [
          { role: 'system', content: titlePrompt },
          { role: 'user', content: truncated }
        ],
      })
      console.log({ text })
      const { title, description } = JSON.parse(text)
      deck.title = title
      deck.description = description
      deck.isUpload = true
      deck.documentText = txt

      console.log({ deck })
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /txt generate/save deck: catch:${e}` }, { status: 500 })
    }

    return NextResponse.json(
      { data: deck }, 
      { status: 200 }
    )
}