import { NextRequest, NextResponse } from 'next/server'
import { getRedisFromEnv } from 'lib'
import { ConnectionAndBody } from 'types'

/*
  @body: { domainName: string, offset: Number }
  1. get teamId from teamsKv with domainName as key
  2. get actionIds from `feed:team:${teamId}:actionIds` zset with offset as start + 10 as stop
  3. get actions from `actions:${actionId}` for each actionId in actionIds
*/
export async function POST(req: NextRequest) {
  try {
    // const path = '/api/feed/team/[id]'
    // const { conn, body } = await getRedisFromEnv({ req, path }) as ConnectionAndBody
  } catch(e) {
    return NextResponse.json({ error: `Internal error: /feed/team/[id]:getRedisFromEnv:${e}` }, { status: 500 })
  }
  return NextResponse.json({ data: {} }, { status: 200 });
}