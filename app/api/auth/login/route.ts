import { NextRequest, NextResponse } from 'next/server'

function requireAuthKey({ req }: { req: NextRequest }) {
  // Get the ACTUALED_AUTH_KEY from environment variables
  const expectedAuthKey = process.env.ACTUALED_AUTH_KEY
  console.log({ expectedAuthKey})

  // Check for the Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized: 1')
  }

  // Extract the token from the header
  const token = authHeader.split(' ')[1]
  console.log({ token })
  if (token !== expectedAuthKey) {
    throw new Error('Unauthorized: 2')
  }
} 

export async function POST(req: NextRequest) {
  requireAuthKey({ req })
  const body = await req.json()
  console.log({ body })
  return NextResponse.json({ message: 'Hello, world!' }, { status : 200 })
}