import { Redis } from '@upstash/redis'
import { ConnectionAndBody, Deck, Params } from 'types'
import { NextRequest, NextResponse } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { getRedisFromEnv, titlePrompt } from 'lib'

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})
const PDF2TEXT_API_KEY = process.env.PDF2TEXT_API_KEY

/*
  inputs: params.sessionId, form (pdf upload)
  1 - verify: PDF2TEXT_API_KEY, redis client, sessionId, pdf body.formData
  2 - get text as formText from formData
  3 - create deck with id and userId
  4 - generate a title and description and save to deck 
      along with deck.isUpload = true and deck.documentText = formText
  return { data: Deck }
*/
export async function POST(req: NextRequest, { params }: Params) {
  // validate
  let redis, formData, sessionId
    try {
      // validate env variable
      if (!PDF2TEXT_API_KEY) return NextResponse.json({ error: 'Internal error with /pdf (PDF2TEXT_API_KEY)' }, { status: 500 })
      // validate redis client
      // get redis based on meta from body
      const path = '/api/pdf/[id]'
      const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
      redis = conn

      // validate formData (File)
      formData = await req.formData()
      if (!formData) {
        return NextResponse.json({ error: 'Internal error with /pdf (formData)' }, { status: 500 })
      }

      //validate id from params
      sessionId = params.id
      console.log('/pdf', { sessionId })
      if (!sessionId) {
        return NextResponse.json(
          { error: 'Internal error with /pdf/params: our team is working on it' }, { status: 500 }
        )
      }
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /pdf:validation:${e}` }, { status: 500 })
    }

    // check for txt or pdf document
    // and retrieve text from the doc
    let formText
    try {
      const endpoint = 'https://pdf-text.vercel.app/api/convert'
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          authorization: `Bearer ${PDF2TEXT_API_KEY}`,
        }
      })
      if (res.status !== 200) return NextResponse.json({ error: `Internal error: API call failed pdf2text` }, { status: 500 })

      // success
      const { data } = await res.json()
      formText = data
    } catch(e) {
      return NextResponse.json({ error: `Internal error: API call failed pdf2text:catch ${e}` }, { status: 500 })
    }

    // create deck: 
    // id, userId
    let deck: Partial<Deck> = {}
    try {
      // get userId from sessionId
      const userId = await redis.get(`sessions:${sessionId}:userId`)
      if (!userId) {
        return NextResponse.json({ error: `Internal error: /pdf:get sessions[sessionId]:userId` }, { status: 500 })
      }
      const id = await redis.incr('decks:counter')
      // set id to deck
      deck.id = id
      deck.userId = Number(userId)
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /pdf create deck: catch:${e}` }, { status: 500 })
    }

    // generate title and description
    // save key values in deck
    try {
      // truncate text
      const truncated = formText.slice(0,1000)
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
      deck.documentText = formText

      console.log({ deck })
    } catch(e) {
      console.error(e)
      return NextResponse.json({ error: `Internal error: /pdf generate/save deck: catch:${e}` }, { status: 500 })
    }

    return NextResponse.json({ data: deck }, { status: 200 })
}