import { getRedisFromEnv } from 'lib';
import { ConnectionAndBody, Params } from 'types'
import { NextRequest, NextResponse } from 'next/server'

/*
  @param id === userId
  @body: { offset: Number }
  2. get actionIds from `users:[id]:actionIds` zset with offset as start + 10 as stop
  3. get actions from `actions:${actionId}` for each actionId in actionIds
*/
export async function POST(req: NextRequest, params: Params) {
  try {
    const path = '/api/feed/profile/[id]'
    const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody 
  } catch (e) {
    return NextResponse.json({ error: `Internal error: /feed/profile/[id]:getRedisFromEnv:${e}` }, { status: 500 })
  }
  return NextResponse.json({ data: {} }, { status: 200 });
}