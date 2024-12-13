import { NextRequest, NextResponse } from "next/server"

const allowedOrigins = [
  'http://localhost:3000',
  'https://actual.run'
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
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'x-vercel-protection-bypass':'f8d3c9b7a2e1f4g5h6j7k8l9m0n1o2p3'
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*', 
} 
