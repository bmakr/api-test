import { NextRequest, NextResponse } from "next/server"

const allowedOrigins = [
  'http://localhost:3000',
  'https://actual.so',
  'https://www.actual.sh',
  'https://actual.cx',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  if (origin && allowedOrigins.includes(origin)) {
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
