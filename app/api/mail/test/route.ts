import { send } from 'lib'
import { NextResponse } from 'next/server'

export async function POST() {
  await send({ contentKey: 'verification', to: 'lumeo@me.com', data: '568247' })
  await send({ contentKey: 'verification', to: 'brian@actual.team', data: '568247' })
  await send({ contentKey: 'verification', to: 'brianeebill@gmail.com', data: '568247' })
  return NextResponse.json({ received: true }, { status: 200 })
}