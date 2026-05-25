import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = ['/api/auth', '/api/route']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public API routes
  if (PUBLIC_API_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Allow Next.js internals and static assets
  if (pathname.startsWith('/_next/') || pathname.startsWith('/logo') || pathname === '/robots.txt') {
    return NextResponse.next()
  }

  // For API routes, check for session token presence
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('bldr_session')?.value ||
      request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token || !token.startsWith('bldr_')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.next()
  }

  // Page routes: let client-side auth handle it
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
