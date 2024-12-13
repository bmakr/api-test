import { ConnectionAndBody, Params } from 'types'
import { getRedisFromEnv } from 'lib'
import { NextRequest, NextResponse } from 'next/server'

/*
  /GET SET (set meaning get a set, not setter)
  Slug in params is a key from which to get a range of ids in a zset and return the items
  Step 1: Validate the request and check to see if the slug exists
  Step 2: get ids in index and return the items from the ids in the index as { data: items }
*/
export async function POST(req: NextRequest, { params }: Params) {
  // validate
  let redis, key, items
  try {
    // get redis based on meta from body
    const path = '/api/get/set/[slug]'
    const { conn } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
    redis = conn

    // get slug from params
    const slug = params.slug

    if (!slug) {
      return NextResponse.json({ error: `Internal error: /login:no slug` }, { status: 500 })
    }

    key = slug
    console.log({ slug })

  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: /login:validation:${e}` }, { status: 500 })
  }

  // get index and items from index
  try {
    const ids = await redis.zrange(key, 0, 5)
    if (!ids.length) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }
    console.log({ ids })
    // create an array of keys
    const keys = ids.map((id) => `decks:${id}`)
    if (!Array.isArray(keys)) {
      return NextResponse.json({ error: `Internal error: /get/set:keys is not an array` }, { status: 500 })
    }
    console.log({ keys })
    // get items from ids
    items = await redis.mget(keys)
    if (!items || !items.length) {
      return NextResponse.json({ error: `Internal error: /get/set:no items` }, { status: 500 })
    }
  } catch(e) {
    console.error(e)
    return NextResponse.json({ error: `Internal error: /get/set:get index from slug:${e}` }, { status: 500 })
  }

  return NextResponse.json({ data: items }, { status: 200 })
}