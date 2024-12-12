import { NextRequest, NextResponse } from "next/server"

const allowedOrigins = [
  'http://localhost:3000',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  console.log({ origin });
  
  if (origin && allowedOrigins.includes(origin)) {
    console.log('isAllowed : true');
    return NextResponse.next({
      headers: {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}
